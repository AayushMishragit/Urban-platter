process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/unused";
process.env.JWT_SECRET = "test-secret";

const test = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const app = require("../src/app");

test("health is public", async () => {
  const res = await request(app).get("/api/health");
  assert.strictEqual(res.status, 200);
});

test("protected routes reject missing and bad tokens", async () => {
  assert.strictEqual((await request(app).get("/api/tasks")).status, 401);
  const bad = await request(app).get("/api/notifications").set("Authorization", "Bearer garbage");
  assert.strictEqual(bad.status, 401);
  assert.strictEqual(bad.body.error.code, "UNAUTHORIZED");
});

test("expired token returns TOKEN_EXPIRED", async () => {
  const token = jwt.sign({ sub: "a".repeat(24) }, "test-secret", { expiresIn: -10 });
  const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, "TOKEN_EXPIRED");
});

test("register validates input before touching the db", async () => {
  const res = await request(app).post("/api/auth/register").send({ email: "nope", password: "short" });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, "VALIDATION_ERROR");
  assert.ok(res.body.error.details.length >= 2);
});

test("malformed JSON and unknown routes give structured errors", async () => {
  const bad = await request(app).post("/api/auth/login").set("Content-Type", "application/json").send("{oops");
  assert.strictEqual(bad.status, 400);
  assert.strictEqual(bad.body.error.code, "INVALID_JSON");
  assert.strictEqual((await request(app).get("/nope")).status, 404);
});
