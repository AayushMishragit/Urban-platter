const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");
const { requireRole } = require("../services/access");
const { getPage, pageResult } = require("../utils/pagination");

exports.list = asyncHandler(async (req, res) => {
  const q = req.query;
  await requireRole(req.user.id, q.organizationId, "audit:view");

  const filter = { organization: q.organizationId };
  if (q.entity) filter.entity = q.entity;
  if (q.entityId) filter.entityId = q.entityId;
  if (q.action) filter.action = q.action;
  if (q.user) filter.user = q.user;
  if (q.from || q.to) filter.timestamp = { ...(q.from && { $gte: q.from }), ...(q.to && { $lte: q.to }) };
  if (q.q) filter.$text = { $search: q.q };

  const p = getPage(q);
  const [data, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1, _id: -1 }).skip(p.skip).limit(p.limit).populate("user", "name email").lean(),
    AuditLog.countDocuments(filter),
  ]);
  res.json(pageResult(data, total, p));
});
