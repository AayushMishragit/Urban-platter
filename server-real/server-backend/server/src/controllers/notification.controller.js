const Notification = require("../models/Notification");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { getPage, pageResult } = require("../utils/pagination");

exports.list = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  if (req.query.unread === "true") filter.read = false;

  const p = getPage(req.query);
  const [data, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user.id, read: false }),
  ]);
  res.json({ ...pageResult(data, total, p), unreadCount });
});

// scoped by user so other people's notification ids look like "not found"
exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { read: true }, { new: true }).lean();
  if (!n) throw ApiError.notFound("Notification not found");
  res.json(n);
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const r = await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json({ updated: r.modifiedCount });
});
