/* End-to-end Jest/Supertest tests that cover all endpoints, input validation, and the computed report caching behavior. */
// This test suite validates the Cost Manager REST API functionality.
import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";

// Generate a unique user id for this test run
// Ensures test isolation and avoids collisions with existing users.
const uid = 120000 + Math.floor(Math.random() * 10000);

// Helpers
// ymNow: Returns current year and month for report queries.
function ymNow() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}
// isoPast: Generates an ISO timestamp in the past for validation tests.
function isoPast(minutes = 10) {
  // An ISO timestamp guaranteed to be in the past (used to trigger validation)
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

// Main test suite for the Cost Manager API
// Covers health check, user/cost addition, reports, logs, and error handling.
describe("Cost Manager API (end-to-end)", () => {
  // Health check endpoint should return 200 and {ok:true}
  test("GET /health -> 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });

  // About endpoint should return team info as array of {first_name,last_name}
  test("GET /api/about -> 200 and returns array of {first_name,last_name}", async () => {
    const res = await request(app).get("/api/about");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("first_name");
    expect(res.body[0]).toHaveProperty("last_name");
  });

  // Add user endpoint should echo user fields and return 200/201
  test("POST /api/add (user) -> 200/201 and echoes user fields", async () => {
    const res = await request(app)
        .post("/api/add")
        .send({ id: uid, first_name: "Test", last_name: "User", birthday: "2001-02-03" })
        .set("Content-Type", "application/json");
    expect([200, 201]).toContain(res.status);
    expect(res.body).toMatchObject({ id: uid, first_name: "Test", last_name: "User" });
  });

  // Add cost with past date should return 400 validation_error
  test("POST /api/add (cost with past createdAt) -> 400 validation_error", async () => {
    const res = await request(app)
        .post("/api/add")
        .send({
          userid: uid,
          description: "old",
          category: "food",
          sum: 3.5,
          createdAt: isoPast(60 * 24 * 7) // 7 days in the past
        })
        .set("Content-Type", "application/json");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  // Add valid cost entry (current time) should return 200/201
  test("POST /api/add (valid cost, now) -> 200/201", async () => {
    const res = await request(app)
        .post("/api/add")
        .send({ userid: uid, description: "milk", category: "food", sum: 8 })
        .set("Content-Type", "application/json");
    expect([200, 201]).toContain(res.status);
    expect(res.body).toMatchObject({ userid: uid, description: "milk", category: "food" });
  });

  // User report for current month should return 200 with correct structure
  test("GET /api/report (current month) -> 200 with grouped categories", async () => {
    const { y, m } = ymNow();
    const res = await request(app).get(`/api/report?id=${uid}&year=${y}&month=${m}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("userid", uid);
    expect(res.body).toHaveProperty("year", y);
    expect(res.body).toHaveProperty("month", m);
    expect(Array.isArray(res.body.costs)).toBe(true);
  });

  // Report for past month (computed cache) should return 200 twice
  test("GET /api/report (past month, computed cache) -> 200 twice", async () => {
    // Use previous month to trigger computed cache behavior
    const d = new Date();
    const past = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    const y = past.getFullYear();
    const m = past.getMonth() + 1;

    // Clear client-side caching signals (ETag) to observe server-side caching
    const a = await request(app)
        .get(`/api/report?id=${uid}&year=${y}&month=${m}`)
        .set("If-None-Match", "");
    const b = await request(app)
        .get(`/api/report?id=${uid}&year=${y}&month=${m}`)
        .set("If-None-Match", "");

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
  });

  // Logs endpoint should return 200 and an array of logs
  test("GET /api/logs -> 200 and returns array", async () => {
    const res = await request(app).get(`/api/logs`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Invalid GET request to /api/add should return 405 (or 404 if not enabled)
  test("GET /api/add -> 405 (or 404 if 405 handler not enabled)", async () => {
    const res = await request(app).get("/api/add");
    // If you added the 405 handler, expect 405; otherwise 404 is acceptable.
    expect([404, 405]).toContain(res.status);
  });
});

// Ensure mongoose connection closes, so Jest can exit cleanly
afterAll(async () => {
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
});
