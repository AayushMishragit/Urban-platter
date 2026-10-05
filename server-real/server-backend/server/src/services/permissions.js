const base = {
  VIEWER: ["project:view", "task:view", "comment:view"],
  MEMBER: ["task:create", "task:edit_assigned", "comment:create"],
  ADMIN: ["project:manage", "member:manage", "task:edit_any", "task:delete", "audit:view"],
  OWNER: ["org:manage"],
};

const order = ["VIEWER", "MEMBER", "ADMIN", "OWNER"];

const PERMISSIONS = {};
order.forEach((role, i) => {
  PERMISSIONS[role] = new Set(order.slice(0, i + 1).flatMap((r) => base[r]));
});

const can = (role, permission) => !!PERMISSIONS[role]?.has(permission);

const canEditTask = (role, task, userId) =>
  can(role, "task:edit_any") || (can(role, "task:edit_assigned") && !!task.assignee && String(task.assignee) === String(userId));

const canAssignRole = (actorRole, targetRole) => {
  if (actorRole === "OWNER") return true;
  return actorRole === "ADMIN" && ["MEMBER", "VIEWER"].includes(targetRole);
};

const canRemoveMember = (actorRole, actorId, targetRole, targetId) => {
  if (targetRole === "OWNER") return false;
  if (String(actorId) === String(targetId)) return true;
  if (actorRole === "OWNER") return true;
  return actorRole === "ADMIN" && ["MEMBER", "VIEWER"].includes(targetRole);
};

module.exports = { can, canEditTask, canAssignRole, canRemoveMember };
