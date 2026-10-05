const Task = require("../models/Task");
const Project = require("../models/Project");
const Comment = require("../models/Comment");
const AuditLog = require("../models/AuditLog");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { requireRole, assertMember } = require("../services/access");
const { can, canEditTask } = require("../services/permissions");
const { diff } = require("../services/taskDiff");
const audit = require("../services/audit");
const { notify } = require("../services/notify");
const realtime = require("../services/realtime");
const { getPage, pageResult } = require("../utils/pagination");

// list view skips description/attachments to keep payloads small
const LIST_FIELDS = "title status priority assignee dueDate labels project position createdAt updatedAt";

exports.create = asyncHandler(async (req, res) => {
  const { projectId, ...data } = req.body;
  const project = await Project.findById(projectId).lean();
  if (!project) throw ApiError.notFound("Project not found");

  await requireRole(req.user.id, project.organization, "task:create");
  if (data.assignee) await assertMember(project.organization, data.assignee);

  const task = await Task.create({
    ...data,
    project: project._id,
    organization: project.organization,
    createdBy: req.user.id,
  });

  await audit.log({
    user: req.user.id,
    organization: project.organization,
    action: "TASK_CREATED",
    entity: "Task",
    entityId: task._id,
    newValue: { title: task.title, status: task.status, priority: task.priority, assignee: task.assignee },
    summary: `${req.user.name} created task "${task.title}"`,
  });

  await notify(
    [task.assignee],
    { organization: project.organization, type: "TASK_ASSIGNED", message: `${req.user.name} assigned you "${task.title}"`, entity: "Task", entityId: task._id },
    req.user.id
  );

  await task.populate("assignee", "name email");
  realtime.emitToProject(project._id, "task:created", { task, by: { id: req.user.id, name: req.user.name } });
  res.status(201).json(task);
});

exports.list = asyncHandler(async (req, res) => {
  const q = req.query;
  let orgId = q.organizationId;

  if (q.projectId) {
    const project = await Project.findById(q.projectId).select("organization").lean();
    if (!project) throw ApiError.notFound("Project not found");
    if (orgId && String(project.organization) !== orgId) throw ApiError.badRequest("Project is not in this organization");
    orgId = project.organization;
  }
  await requireRole(req.user.id, orgId, "task:view");

  const filter = { organization: orgId };
  if (q.projectId) filter.project = q.projectId;
  if (q.status) filter.status = { $in: q.status };
  if (q.priority) filter.priority = { $in: q.priority };
  if (q.labels) filter.labels = { $in: q.labels };
  if (q.assignee) filter.assignee = q.assignee === "me" ? req.user._id : q.assignee === "none" ? null : q.assignee;
  if (q.dueAfter || q.dueBefore) filter.dueDate = { ...(q.dueAfter && { $gte: q.dueAfter }), ...(q.dueBefore && { $lt: q.dueBefore }) };
  if (q.createdAfter || q.createdBefore) filter.createdAt = { ...(q.createdAfter && { $gte: q.createdAfter }), ...(q.createdBefore && { $lt: q.createdBefore }) };
  if (q.q) filter.$text = { $search: q.q };

  const dir = q.order === "asc" ? 1 : -1;
  const sort = { [q.sortBy || "createdAt"]: dir, _id: dir };
  const p = getPage(q);

  const [data, total] = await Promise.all([
    Task.find(filter).select(LIST_FIELDS).sort(sort).skip(p.skip).limit(p.limit).populate("assignee", "name email").lean(),
    Task.countDocuments(filter),
  ]);
  res.json(pageResult(data, total, p));
});

exports.get = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate("assignee createdBy", "name email").lean();
  if (!task) throw ApiError.notFound("Task not found");
  await requireRole(req.user.id, task.organization, "task:view");

  const activity = await AuditLog.find({ organization: task.organization, entity: "Task", entityId: task._id })
    .sort({ timestamp: -1 })
    .limit(50)
    .populate("user", "name")
    .lean();
  res.json({ ...task, activity });
});

exports.update = asyncHandler(async (req, res) => {
  const old = await Task.findById(req.params.id).lean();
  if (!old) throw ApiError.notFound("Task not found");

  const role = await requireRole(req.user.id, old.organization, "task:view");
  if (!canEditTask(role, old, req.user.id)) throw ApiError.forbidden("You can only edit tasks assigned to you");

  const updates = req.body;
  const reassigning = "assignee" in updates && String(updates.assignee || "") !== String(old.assignee || "");
  if (reassigning && !can(role, "task:edit_any")) throw ApiError.forbidden("Only admins can reassign tasks");
  if (updates.assignee) await assertMember(old.organization, updates.assignee);

  const changes = diff(old, updates);
  const task = await Task.findByIdAndUpdate(old._id, { $set: updates }, { new: true, runValidators: true }).populate("assignee", "name email");

  await Promise.all(
    changes.map((c) =>
      audit.log({
        user: req.user.id,
        organization: old.organization,
        action: c.action,
        entity: "Task",
        entityId: old._id,
        oldValue: { [c.field]: c.oldValue },
        newValue: { [c.field]: c.newValue },
        summary: `${req.user.name} changed ${c.field} of "${task.title}"`,
      })
    )
  );

  const changed = Object.fromEntries(changes.map((c) => [c.field, c]));
  const base = { organization: old.organization, entity: "Task", entityId: old._id };
  if (changed.assignee) {
    await notify([task.assignee?._id], { ...base, type: "TASK_ASSIGNED", message: `${req.user.name} assigned you "${task.title}"` }, req.user.id);
  }
  if (changed.status) {
    await notify(
      [task.assignee?._id, old.createdBy],
      { ...base, type: "TASK_STATUS_CHANGED", message: `"${task.title}" moved to ${task.status}` },
      req.user.id
    );
  }

  realtime.emitToProject(old.project, "task:updated", { task, by: { id: req.user.id, name: req.user.name } });
  res.json(task);
});

exports.remove = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).lean();
  if (!task) throw ApiError.notFound("Task not found");
  await requireRole(req.user.id, task.organization, "task:delete");

  await Comment.deleteMany({ task: task._id });
  await Task.deleteOne({ _id: task._id });

  await audit.log({
    user: req.user.id,
    organization: task.organization,
    action: "TASK_DELETED",
    entity: "Task",
    entityId: task._id,
    oldValue: { title: task.title, status: task.status, priority: task.priority, assignee: task.assignee },
    summary: `${req.user.name} deleted task "${task.title}"`,
  });
  realtime.emitToProject(task.project, "task:deleted", { taskId: task._id, by: { id: req.user.id, name: req.user.name } });
  res.status(204).end();
});
