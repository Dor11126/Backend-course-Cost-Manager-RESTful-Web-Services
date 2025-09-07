import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";

// Generate a unique user id for this test run
const uid = 120000 + Math.floor(Math.random() * 10000);

// Helpers
function ymNow() {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}
function isoPast(minutes = 10) {
  // An ISO timestamp guaranteed to be in the past (used to trigger validation)
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

describe("Cost Manager API (end-to-end)", () => {
  test("GET /health -> 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });

  test("GET /api/about -> 200 and returns array of {first_name,last_name}", async () => {
    const res = await request(app).get("/api/about");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("first_name");
    expect(res.body[0]).toHaveProperty("last_name");
  });

  test("POST /api/add (user) -> 200/201 and echoes user fields", async () => {
    const res = await request(app)
        .post("/api/add")
        .send({ id: uid, first_name: "Test", last_name: "User", birthday: "2001-02-03" })
        .set("Content-Type", "application/json");
    expect([200, 201]).toContain(res.status);
    expect(res.body).toMatchObject({ id: uid, first_name: "Test", last_name: "User" });
  });

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

  test("POST /api/add (valid cost, now) -> 200/201", async () => {
    const res = await request(app)
        .post("/api/add")
        .send({ userid: uid, description: "milk", category: "food", sum: 8 })
        .set("Content-Type", "application/json");
    expect([200, 201]).toContain(res.status);
    expect(res.body).toMatchObject({ userid: uid, description: "milk", category: "food" });
  });

  test("GET /api/users/:id -> 200 and includes total", async () => {
    const res = await request(app).get(`/api/users/${uid}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", uid);
    expect(res.body).toHaveProperty("total");
  });

  test("GET /api/users -> 200 and returns array", async () => {
    const res = await request(app).get(`/api/users`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET /api/report (current month) -> 200 with grouped categories", async () => {
    const { y, m } = ymNow();
    const res = await request(app).get(`/api/report?id=${uid}&year=${y}&month=${m}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("userid", uid);
    expect(res.body).toHaveProperty("year", y);
    expect(res.body).toHaveProperty("month", m);
    expect(Array.isArray(res.body.costs)).toBe(true);
  });

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

  test("GET /api/logs -> 200 and returns array", async () => {
    const res = await request(app).get(`/api/logs`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

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
