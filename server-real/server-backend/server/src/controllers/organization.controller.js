const Organization = require("../models/Organization");
const Membership = require("../models/Membership");
const Task = require("../models/Task");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { requireRole } = require("../services/access");
const { canAssignRole, canRemoveMember } = require("../services/permissions");
const audit = require("../services/audit");
const { notify } = require("../services/notify");

exports.create = asyncHandler(async (req, res) => {
  const org = await Organization.create({ name: req.body.name, createdBy: req.user.id });
  await Membership.create({ organization: org._id, user: req.user.id, role: "OWNER" });
  await audit.log({
    user: req.user.id,
    organization: org._id,
    action: "ORG_CREATED",
    entity: "Organization",
    entityId: org._id,
    newValue: { name: org.name },
    summary: `${req.user.name} created organization "${org.name}"`,
  });
  res.status(201).json({ id: org.id, name: org.name, role: "OWNER" });
});

exports.list = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ user: req.user.id }).populate("organization", "name").lean();
  res.json(memberships.map((m) => ({ id: m.organization._id, name: m.organization.name, role: m.role })));
});

exports.listMembers = asyncHandler(async (req, res) => {
  await requireRole(req.user.id, req.params.id, "project:view");
  const members = await Membership.find({ organization: req.params.id })
    .populate("user", "name email")
    .limit(500)
    .lean();
  res.json(members.map((m) => ({ user: m.user, role: m.role })));
});

exports.addMember = asyncHandler(async (req, res) => {
  const orgId = req.params.id;
  const actorRole = await requireRole(req.user.id, orgId, "member:manage");
  if (!canAssignRole(actorRole, req.body.role)) throw ApiError.forbidden("You cannot assign this role");

  const target = await User.findOne({ email: req.body.email });
  if (!target) throw ApiError.notFound("No user with that email");
  if (await Membership.exists({ organization: orgId, user: target._id })) throw ApiError.conflict("Already a member");

  await Membership.create({ organization: orgId, user: target._id, role: req.body.role });
  const org = await Organization.findById(orgId).select("name").lean();

  await audit.log({
    user: req.user.id,
    organization: orgId,
    action: "MEMBER_ADDED",
    entity: "Membership",
    entityId: target._id,
    newValue: { email: target.email, role: req.body.role },
    summary: `${req.user.name} added ${target.email} as ${req.body.role}`,
  });
  await notify(
    [target._id],
    { organization: orgId, type: "ORG_ADDED", message: `You were added to ${org.name} as ${req.body.role}`, entity: "Organization", entityId: orgId },
    req.user.id
  );

  res.status(201).json({ user: { id: target.id, name: target.name, email: target.email }, role: req.body.role });
});

exports.removeMember = asyncHandler(async (req, res) => {
  const { id: orgId, userId } = req.params;
  const actorRole = await requireRole(req.user.id, orgId);

  const target = await Membership.findOne({ organization: orgId, user: userId });
  if (!target) throw ApiError.notFound("Member not found");
  if (!canRemoveMember(actorRole, req.user.id, target.role, userId)) throw ApiError.forbidden("You cannot remove this member");

  await target.deleteOne();
  await Task.updateMany({ organization: orgId, assignee: userId }, { $set: { assignee: null } });

  await audit.log({
    user: req.user.id,
    organization: orgId,
    action: "MEMBER_REMOVED",
    entity: "Membership",
    entityId: userId,
    oldValue: { role: target.role },
    summary: `${req.user.name} removed a member (${target.role})`,
  });
  res.status(204).end();
});
