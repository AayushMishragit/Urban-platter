const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { requireRole } = require("../services/access");
const audit = require("../services/audit");
const { getPage, pageResult } = require("../utils/pagination");

const findProject = async (id) => {
  const project = await Project.findById(id).lean();
  if (!project) throw ApiError.notFound("Project not found");
  return project;
};

exports.create = asyncHandler(async (req, res) => {
  const { organizationId, name, description } = req.body;
  await requireRole(req.user.id, organizationId, "project:manage");

  const project = await Project.create({ organization: organizationId, name, description, createdBy: req.user.id });
  await audit.log({
    user: req.user.id,
    organization: organizationId,
    action: "PROJECT_CREATED",
    entity: "Project",
    entityId: project._id,
    newValue: { name },
    summary: `${req.user.name} created project "${name}"`,
  });
  res.status(201).json(project);
});

exports.list = asyncHandler(async (req, res) => {
  await requireRole(req.user.id, req.query.organizationId, "project:view");
  const p = getPage(req.query);
  const filter = { organization: req.query.organizationId };

  const [data, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Project.countDocuments(filter),
  ]);
  res.json(pageResult(data, total, p));
});

exports.get = asyncHandler(async (req, res) => {
  const project = await findProject(req.params.id);
  await requireRole(req.user.id, project.organization, "project:view");

  const counts = await Task.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(req.params.id) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  res.json({ ...project, taskCounts: Object.fromEntries(counts.map((c) => [c._id, c.count])) });
});

exports.update = asyncHandler(async (req, res) => {
  const old = await findProject(req.params.id);
  await requireRole(req.user.id, old.organization, "project:manage");

  const project = await Project.findByIdAndUpdate(old._id, { $set: req.body }, { new: true, runValidators: true }).lean();
  await audit.log({
    user: req.user.id,
    organization: old.organization,
    action: "PROJECT_UPDATED",
    entity: "Project",
    entityId: old._id,
    oldValue: { name: old.name, description: old.description, status: old.status },
    newValue: req.body,
    summary: `${req.user.name} updated project "${old.name}"`,
  });
  res.json(project);
});

exports.remove = asyncHandler(async (req, res) => {
  const project = await findProject(req.params.id);
  await requireRole(req.user.id, project.organization, "project:manage");

  const taskIds = await Task.find({ project: project._id }).distinct("_id");
  await Comment.deleteMany({ task: { $in: taskIds } });
  await Task.deleteMany({ project: project._id });
  await Project.deleteOne({ _id: project._id });

  await audit.log({
    user: req.user.id,
    organization: project.organization,
    action: "PROJECT_DELETED",
    entity: "Project",
    entityId: project._id,
    oldValue: { name: project.name },
    summary: `${req.user.name} deleted project "${project.name}"`,
  });
  res.status(204).end();
});
