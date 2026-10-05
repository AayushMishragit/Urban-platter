const test = require("node:test");
const assert = require("node:assert");
const { can, canEditTask, canAssignRole, canRemoveMember } = require("../src/services/permissions");
const { diff } = require("../src/services/taskDiff");
const s = require("../src/validators/schemas");

test("role permissions are cumulative", () => {
  assert.ok(can("VIEWER", "task:view"));
  assert.ok(!can("VIEWER", "task:create"));
  assert.ok(can("MEMBER", "task:create"));
  assert.ok(!can("MEMBER", "task:delete"));
  assert.ok(can("ADMIN", "task:delete"));
  assert.ok(can("ADMIN", "audit:view"));
  assert.ok(!can("MEMBER", "audit:view"));
  assert.ok(can("OWNER", "org:manage"));
  assert.ok(!can("ADMIN", "org:manage"));
  assert.ok(!can("NOPE", "task:view"));
});

test("members edit only assigned tasks, admins edit any", () => {
  const task = { assignee: "u1" };
  assert.ok(canEditTask("MEMBER", task, "u1"));
  assert.ok(!canEditTask("MEMBER", task, "u2"));
  assert.ok(!canEditTask("MEMBER", { assignee: null }, "u1"));
  assert.ok(!canEditTask("VIEWER", task, "u1"));
  assert.ok(canEditTask("ADMIN", task, "u2"));
});

test("role assignment and member removal rules", () => {
  assert.ok(canAssignRole("OWNER", "ADMIN"));
  assert.ok(canAssignRole("ADMIN", "MEMBER"));
  assert.ok(!canAssignRole("ADMIN", "ADMIN"));
  assert.ok(!canAssignRole("MEMBER", "VIEWER"));
  assert.ok(!canRemoveMember("OWNER", "a", "OWNER", "b"));
  assert.ok(canRemoveMember("MEMBER", "a", "MEMBER", "a"));
  assert.ok(!canRemoveMember("MEMBER", "a", "VIEWER", "b"));
  assert.ok(!canRemoveMember("ADMIN", "a", "ADMIN", "b"));
  assert.ok(canRemoveMember("ADMIN", "a", "MEMBER", "b"));
});

test("taskDiff only reports real changes", () => {
  const old = { status: "TODO", priority: "LOW", assignee: "u1", dueDate: new Date("2026-10-10"), labels: ["a"] };
  const changes = diff(old, {
    status: "DONE",
    priority: "LOW",
    assignee: "u1",
    dueDate: "2026-10-10T00:00:00.000Z",
    labels: ["a"],
  });
  assert.deepStrictEqual(changes.map((c) => c.action), ["TASK_STATUS_CHANGED"]);
  assert.strictEqual(diff(old, { assignee: null })[0].action, "TASK_ASSIGNEE_CHANGED");
  assert.strictEqual(diff(old, {}).length, 0);
});

test("task schemas reject bad input and strip unknown fields", () => {
  assert.ok(!s.createTask.safeParse({ title: "x" }).success);
  assert.ok(!s.createTask.safeParse({ title: "x", projectId: "123" }).success);
  const ok = s.createTask.parse({ title: "x", projectId: "a".repeat(24), organization: "hacked", createdBy: "hacked" });
  assert.strictEqual(ok.organization, undefined);
  assert.strictEqual(ok.createdBy, undefined);
  assert.ok(!s.updateTask.safeParse({}).success);
  assert.ok(!s.updateTask.safeParse({ status: "NOPE" }).success);
  assert.ok(!("assignee" in s.updateTask.parse({ status: "DONE" })));
  assert.strictEqual(s.updateTask.parse({ assignee: null }).assignee, null);
  assert.ok(!s.searchTasks.safeParse({ status: "TODO" }).success);
  assert.ok(!s.searchTasks.safeParse({ projectId: "a".repeat(24), status: "BAD" }).success);
  const q = s.searchTasks.parse({ projectId: "a".repeat(24), status: "TODO,DONE", labels: "x,y", dueBefore: "2026-09-01" });
  assert.deepStrictEqual(q.status, ["TODO", "DONE"]);
  assert.ok(q.dueBefore instanceof Date);
});
