/*
 * API routes per spec
 */
import express from "express";
import { User } from "../models/user.js";
import { Cost } from "../models/cost.js";
import { Log } from "../models/log.js";
import { Report } from "../models/report.js";
import { buildMonthlyReport } from "../utils/report.js";
import dayjs from "dayjs";

const router = express.Router(); // Create router instance

/* GET /api/about — team members (first_name, last_name only) */
router.get("/about", async (req, res) => {
  req.log.info({ msg: "about endpoint accessed" }); // Log endpoint access
  const team = [
    { first_name: "Emil", last_name: "Davidov" },
    { first_name: "Dor", last_name: "Cohen" }
  ];
  await Log.create({ level: "info", message: "endpoint_access", path: "/api/about" }); // Persist a log record
  return res.json(team); // Return team info
});

/* GET /api/users — list all users */
router.get("/users", async (req, res) => {
  req.log.info({ msg: "users list endpoint accessed" }); // Log endpoint access
  await Log.create({ level: "info", message: "endpoint_access", path: "/api/users" });
  const users = await User.find({}, { _id: 0, __v: 0 }).lean(); // Fetch users, exclude _id and __v
  return res.json(users); // Return user list
});

/* GET /api/users/:id — specific user details with total */
router.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id); // Parse user id from params
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "validation_error", message: "id must be a number" });
  }
  req.log.info({ msg: "user details endpoint accessed", id }); // Log access
  await Log.create({ level: "info", message: "endpoint_access", path: `/api/users/${id}` });

  const user = await User.findOne({ id }).lean(); // Find user by id
  if (!user) return res.status(404).json({ error: "not_found", message: "user not found" });

  const totals = await Cost.aggregate([
    { $match: { userid: id } },
    { $group: { _id: null, total: { $sum: "$sum" } } }
  ]);
  const total = totals.length ? Number(totals[0].total) : 0; // Calculate total costs for user
  return res.json({ first_name: user.first_name, last_name: user.last_name, id, total });
});

/* POST /api/add — add user OR cost (single endpoint name per spec) */
// Use route() to handle POST and all other methods for /add
router
  .route('/add')
  .post(async (req, res) => {
    req.log.info({ msg: "add endpoint accessed" }); // Log endpoint access
    await Log.create({ level: "info", message: "endpoint_access", path: "/api/add" });

    const body = req.body || {}; // Get request body

    // Decide which type by presence of key fields
    const isUser = Object.prototype.hasOwnProperty.call(body, "first_name")
      || Object.prototype.hasOwnProperty.call(body, "last_name")
      || Object.prototype.hasOwnProperty.call(body, "birthday");
    const isCost = Object.prototype.hasOwnProperty.call(body, "description")
      || Object.prototype.hasOwnProperty.call(body, "category")
      || Object.prototype.hasOwnProperty.call(body, "userid")
      || Object.prototype.hasOwnProperty.call(body, "sum");

    if (!isUser && !isCost) {
      return res.status(400).json({ error: "validation_error", message: "payload must be either a user or a cost" });
    }
    if (isUser && isCost) {
      return res.status(400).json({ error: "validation_error", message: "payload must be either user or cost, not both" });
    }

    // Handle user creation
    if (isUser) {
      const { id, first_name, last_name, birthday } = body;
      if (typeof id !== "number" || !first_name || !last_name || !birthday) {
        return res.status(400).json({ error: "validation_error", message: "id(Number), first_name(String), last_name(String), birthday(Date) are required" });
      }
      const bday = new Date(birthday);
      if (Number.isNaN(bday.getTime())) {
        return res.status(400).json({ error: "validation_error", message: "birthday must be a valid date" });
      }
      try {
        const created = await User.create({ id, first_name, last_name, birthday: bday });
        return res.status(201).json({ id: created.id, first_name: created.first_name, last_name: created.last_name, birthday: created.birthday });
      } catch (e) {
        return res.status(400).json({ error: "db_error", message: e.message });
      }
    }

    // Handle cost creation
    if (isCost) {
      const { description, category, userid, sum } = body;
      if (!description || !category || typeof userid !== "number" || (typeof sum !== "number" && typeof sum !== "string")) {
        return res.status(400).json({ error: "validation_error", message: "description(String), category(String), userid(Number), sum(Number) are required" });
      }
      const parsedSum = typeof sum === "string" ? Number(sum) : sum;
      if (Number.isNaN(parsedSum)) {
        return res.status(400).json({ error: "validation_error", message: "sum must be a number" });
      }

      // Optional createdAt; default now. Reject past dates per spec.
      let createdAt = body.createdAt ? new Date(body.createdAt) : new Date();
      if (body.createdAt && Number.isNaN(createdAt.getTime())) {
        return res.status(400).json({ error: "validation_error", message: "createdAt must be a valid date if provided" });
      }
      const now = new Date();
      if (createdAt.getTime() < now.getTime()) {
        // If provided, must not belong to the past (spec: server doesn't allow adding past dates)
        if (body.createdAt) {
          return res.status(400).json({ error: "validation_error", message: "createdAt cannot belong to the past" });
        } else {
          createdAt = now;
        }
      }

      try {
        const created = await Cost.create({ description, category, userid, sum: parsedSum, createdAt });
        return res.status(201).json({
          description: created.description,
          category: created.category,
          userid: created.userid,
          sum: Number(created.sum),
          createdAt: created.createdAt
        });
      } catch (e) {
        return res.status(400).json({ error: "db_error", message: e.message });
      }
    }

    return res.status(500).json({ error: "internal_error" }); // Fallback error
  })
  .all((req, res) => {
    // Only POST is allowed for /api/add, all others get 405 with details
    res.set('Allow', 'POST');
    return res.status(405).json({
      error: "method_not_allowed",
      status: 405,
      path: req.originalUrl,
      method_received: req.method,
      allowed: ["POST"],
      message: "This endpoint accepts POST only.",
      how_to_fix: "Send a POST request with Content-Type: application/json and a valid JSON body.",
      payloads: {
        add_user: {
          required_fields: ["id:Number", "first_name:String", "last_name:String", "birthday:YYYY-MM-DD"]
        },
        add_cost: {
          required_fields: ["userid:Number", "description:String", "category:food|health|housing|sports|education", "sum:Number"],
          optional_fields: ["createdAt:ISO-8601 (must not be in the past)"]
        }
      },
      examples: {
        curl: 'curl -X POST http://localhost:3000/api/add -H "Content-Type: application/json" -d \'{"userid":123123,"description":"milk","category":"food","sum":8}\'',
        powershell: 'Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/add" -ContentType "application/json" -Body \'{"userid":123123,"description":"milk","category":"food","sum":8}\''
      },
      see_also: {
        report: 'GET /api/report?id=<userid>&year=<YYYY>&month=<1..12>',
        user_details: 'GET /api/users/<id>',
        users: 'GET /api/users',
        about: 'GET /api/about',
        logs: 'GET /api/logs'
      }
    });
  });

/* GET /api/report?id=..&year=..&month=.. — grouped monthly report (computed pattern) */
router.get("/report", async (req, res) => {
  const id = Number(req.query.id); // Parse user id
  const year = Number(req.query.year); // Parse year
  const month = Number(req.query.month); // Parse month
  if (Number.isNaN(id) || Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: "validation_error", message: "id, year, month are required (month 1..12)" });
  }

  req.log.info({ msg: "report endpoint accessed", id, year, month }); // Log access
  await Log.create({ level: "info", message: "endpoint_access", path: "/api/report", meta: { id, year, month } });

  const now = dayjs();
  const reqDate = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const isPast = reqDate.endOf("month").isBefore(now.startOf("day"));

  /*
   * This block implements the computed/cached pattern for monthly reports.
   * For past months, the service first checks if a cached report exists in the database.
   * If found, it returns the cached result immediately, saving computation and database reads.
   * If not found, or if the request is for the current month, the report is freshly computed.
   * For past months, the computed result is then saved to the cache for future requests.
   */
  if (isPast) {
    // Try to serve cached report (computed pattern)
    const cached = await Report.findOne({ userid: id, year, month }).lean();
    if (cached) {
      return res.json(cached.payload);
    }
  }

  // Build fresh report if not cached or current month
  const payload = await buildMonthlyReport(id, year, month);

  if (isPast) {
    // Save cache for past months
    try {
      await Report.updateOne(
        { userid: id, year, month },
        { $set: { payload, computedAt: new Date() } },
        { upsert: true }
      );
    } catch (e) {
      // Ignore cache errors
      req.log.error({ msg: "failed to cache report", error: e.message });
    }
  }

  return res.json(payload); // Return report payload
});

/* GET /api/logs — list all logs */
router.get("/logs", async (req, res) => {
  req.log.info({ msg: "logs list endpoint accessed" }); // Log access
  await Log.create({ level: "info", message: "endpoint_access", path: "/api/logs" });
  const logs = await Log.find({}, { __v: 0 }).sort({ createdAt: -1 }).lean(); // Fetch logs, newest first
  return res.json(logs); // Return logs
});

export default router; // Export router
