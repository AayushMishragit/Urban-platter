const Membership = require("../models/Membership");
const ApiError = require("../utils/ApiError");
const { can } = require("./permissions");

const getRole = async (userId, orgId) => {
  const m = await Membership.findOne({ organization: orgId, user: userId }).select("role").lean();
  return m ? m.role : null;
};

// non-members get 404 so org ids can't be probed; members lacking the permission get 403
const requireRole = async (userId, orgId, permission) => {
  const role = await getRole(userId, orgId);
  if (!role) throw ApiError.notFound("Organization not found");
  if (permission && !can(role, permission)) throw ApiError.forbidden("You do not have permission to do this");
  return role;
};

const assertMember = async (orgId, userId) => {
  const exists = await Membership.exists({ organization: orgId, user: userId });
  if (!exists) throw ApiError.badRequest("User is not a member of this organization");
};

module.exports = { getRole, requireRole, assertMember };
