// needs a real MongoDB: MONGO_URI_TEST=mongodb://127.0.0.1:27017/atlasdesk_test npm test
const uri = process.env.MONGO_URI_TEST;
process.env.MONGO_URI = uri || "mongodb://127.0.0.1:27017/unused";
process.env.JWT_SECRET = "test-secret";

const test = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");

const skip = !uri && "MONGO_URI_TEST not set";

test("permissions, audit log and notifications end to end", { skip }, async (t) => {
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
  t.after(() => mongoose.disconnect());

  const api = (token) => ({
    get: (url) => request(app).get(url).set("Authorization", `Bearer ${token}`),
    post: (url, body) => request(app).post(url).set("Authorization", `Bearer ${token}`).send(body),
    put: (url, body) => request(app).put(url).set("Authorization", `Bearer ${token}`).send(body),
    patch: (url, body) => request(app).patch(url).set("Authorization", `Bearer ${token}`).send(body),
    del: (url) => request(app).delete(url).set("Authorization", `Bearer ${token}`),
  });

  const signup = async (name) => {
    const res = await request(app).post("/api/auth/register").send({ name, email: `${name}@test.com`, password: "password123" });
    assert.strictEqual(res.status, 201);
    return { id: res.body.user.id, a: api(res.body.token) };
  };

  const [owner, admin, member, viewer, outsider] = await Promise.all(["owner", "admin", "member", "viewer", "outsider"].map(signup));

  const org = (await owner.a.post("/api/organizations", { name: "Acme" })).body;
  for (const [u, role] of [[admin, "ADMIN"], [member, "MEMBER"], [viewer, "VIEWER"]]) {
    const r = await owner.a.post(`/api/organizations/${org.id}/members`, { email: `${["admin", "member", "viewer"][[admin, member, viewer].indexOf(u)]}@test.com`, role });
    assert.strictEqual(r.status, 201);
  }
  assert.strictEqual((await member.a.get("/api/notifications")).body.unreadCount, 1);

  const project = (await admin.a.post("/api/projects", { organizationId: org.id, name: "P1" })).body;
  assert.strictEqual((await member.a.post("/api/projects", { organizationId: org.id, name: "no" })).status, 403);

  assert.strictEqual((await viewer.a.post("/api/tasks", { projectId: project._id, title: "t" })).status, 403);
  assert.strictEqual((await outsider.a.post("/api/tasks", { projectId: project._id, title: "t" })).status, 404);
  assert.strictEqual((await member.a.post("/api/tasks", { projectId: project._id })).status, 400);

  const mine = (await member.a.post("/api/tasks", { projectId: project._id, title: "mine", assignee: member.id })).body;
  const theirs = (await admin.a.post("/api/tasks", { projectId: project._id, title: "theirs", assignee: admin.id })).body;

  assert.strictEqual((await member.a.put(`/api/tasks/${mine._id}`, { status: "IN_PROGRESS" })).status, 200);
  assert.strictEqual((await member.a.put(`/api/tasks/${theirs._id}`, { status: "DONE" })).status, 403);
  assert.strictEqual((await viewer.a.put(`/api/tasks/${mine._id}`, { status: "DONE" })).status, 403);
  assert.strictEqual((await member.a.del(`/api/tasks/${mine._id}`)).status, 403);

  assert.strictEqual((await admin.a.put(`/api/tasks/${mine._id}`, { priority: "HIGH", assignee: viewer.id })).status, 200);
  assert.strictEqual((await viewer.a.get("/api/notifications?unread=true")).body.unreadCount, 1);

  const found = await viewer.a.get(`/api/tasks?projectId=${project._id}&status=IN_PROGRESS&priority=HIGH`);
  assert.strictEqual(found.body.total, 1);

  assert.strictEqual((await member.a.get(`/api/audit-logs?organizationId=${org.id}`)).status, 403);
  const logs = await admin.a.get(`/api/audit-logs?organizationId=${org.id}&entityId=${mine._id}`);
  const actions = logs.body.data.map((l) => l.action);
  assert.ok(actions.includes("TASK_STATUS_CHANGED") && actions.includes("TASK_PRIORITY_CHANGED") && actions.includes("TASK_ASSIGNEE_CHANGED"));

  const n = (await viewer.a.get("/api/notifications")).body.data[0];
  assert.strictEqual((await member.a.patch(`/api/notifications/${n._id}/read`)).status, 404);
  assert.strictEqual((await viewer.a.patch(`/api/notifications/${n._id}/read`)).body.read, true);

  assert.strictEqual((await admin.a.del(`/api/tasks/${theirs._id}`)).status, 204);
  assert.strictEqual((await admin.a.get(`/api/tasks/${theirs._id}`)).status, 404);
});
