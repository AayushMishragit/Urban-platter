const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Membership = require("../models/Membership");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { requireRole } = require("../services/access");
const audit = require("../services/audit");
const { notify } = require("../services/notify");
const realtime = require("../services/realtime");
const { getPage, pageResult } = require("../utils/pagination");

const findTask = async (id) => {
  const task = await Task.findById(id).select("title organization project").lean();
  if (!task) throw ApiError.notFound("Task not found");
  return task;
};

exports.create = asyncHandler(async (req, res) => {
  const task = await findTask(req.params.id);
  await requireRole(req.user.id, task.organization, "comment:create");

  // only org members can be mentioned
  const mentions = req.body.mentions?.length
    ? (await Membership.find({ organization: task.organization, user: { $in: req.body.mentions } }).select("user").lean()).map((m) => m.user)
    : [];

  const comment = await Comment.create({
    task: task._id,
    organization: task.organization,
    author: req.user.id,
    body: req.body.body,
    mentions,
  });

  await audit.log({
    user: req.user.id,
    organization: task.organization,
    action: "COMMENT_ADDED",
    entity: "Task",
    entityId: task._id,
    newValue: { commentId: comment._id, body: comment.body.slice(0, 200) },
    summary: `${req.user.name} commented on "${task.title}"`,
  });

  await notify(
    mentions,
    { organization: task.organization, type: "COMMENT_MENTION", message: `${req.user.name} mentioned you on "${task.title}"`, entity: "Task", entityId: task._id },
    req.user.id
  );

  realtime.emitToProject(task.project, "comment:created", { taskId: task._id, comment });
  res.status(201).json(comment);
});

exports.list = asyncHandler(async (req, res) => {
  const task = await findTask(req.params.id);
  await requireRole(req.user.id, task.organization, "comment:view");

  const p = getPage(req.query);
  const [data, total] = await Promise.all([
    Comment.find({ task: task._id }).sort({ createdAt: 1 }).skip(p.skip).limit(p.limit).populate("author", "name email").lean(),
    Comment.countDocuments({ task: task._id }),
  ]);
  res.json(pageResult(data, total, p));
});
