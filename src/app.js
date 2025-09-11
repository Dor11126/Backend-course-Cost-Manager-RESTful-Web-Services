import express from "express";
import helmet from "helmet";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";
import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";
import apiRouter from "./routes/api.js";
import { requestLogSaver } from "./middlewares/request-log-saver.js";

// Extend dayjs with UTC and timezone plugins
dayjs.extend(utc);
dayjs.extend(tz);

/* Create application */
const app = express();

/* Security & parsing middleware */
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Enable CORS for all origins
app.use(express.json({ limit: "1mb" })); // per spec, JSON API

/* Pino logger for console */
const logger = pino({ level: process.env.NODE_ENV === "test" ? "silent" : "info" });
app.use(pinoHttp({ logger }));

/* Connect to MongoDB Atlas */
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    // eslint-disable-next-line no-console
    console.error("Missing MONGODB_URI in environment variables");
    process.exit(1);
}
mongoose.set("strictQuery", true);
mongoose
    .connect(mongoUri, { autoIndex: true })
    .then(() => logger.info({ msg: "Connected to MongoDB" }))
    .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("MongoDB connection error", err);
        if (process.env.NODE_ENV === "test") throw err;  // לא לסגור תהליך בטסטים
        process.exit(1);
    });

/* Custom middleware: save every request as a log document */
app.use(requestLogSaver);

/* Routes */
app.use("/api", apiRouter);

/* Root health */
app.get("/health", (req, res) => {
    req.log.info({ msg: "health endpoint accessed" });
    res.json({ ok: true });
});



// Compact, text-only landing page (no buttons, no JS)
app.get("/", (req, res) => {
    const renderUrl = "https://backend-course-cost-manager-restful-web.onrender.com";
    const localUrl  = "http://localhost:3000";


    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Cost Manager — REST API</title>
<style>
  :root{
    /* quick knobs to tweak density later */
    --font-base: 14.5px;         
    --line: 1.5;                
    --page-w: 78%;              
    --block-w: 90%;              
    --pad-card: 16px;        
    --gap-card: 14px;          
    --radius: 14px;             
    --badge-pad: 3px 10px;       
    --h1: 22px;                 
    --h2: 16px;                 
    --h3: 14px;                 
--muted: #9aa4b2; --text:#e5e7eb; --accent:#22d3ee; --border:rgba(255,255,255,.12);
--bg1:#19243a; --bg2:#1f315a;





  }
  *{box-sizing:border-box}
  body{
    margin:0;
    text-align:left; /* English */
    font: var(--font-base)/var(--line) ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
    color:var(--text);
    background:linear-gradient(180deg,var(--bg1) 0%, var(--bg2) 50%, var(--bg1) 100%);
  }
  .wrap{width:var(--page-w); margin:24px auto; padding:16px}
  .card{
    background:rgba(255,255,255,.04);
    border:1px solid var(--border);
    border-radius:var(--radius);
    padding:var(--pad-card);
    margin-bottom:var(--gap-card);
    backdrop-filter: blur(2px);
  }
  h1{font-size:var(--h1); margin:6px 0 4px}
  .badge{display:inline-block;background:var(--accent);color:#05121a;font-weight:700;padding:var(--badge-pad);border-radius:999px}
  .sub{color:var(--muted);margin:2px 0 8px}
  h2{font-size:var(--h2);margin:12px 0 6px;color:var(--accent)}
  h3{font-size:var(--h3);margin:10px 0 4px;color:#a5eaff}

  pre, .w { width:var(--block-w); max-width:var(--block-w); }
  pre,code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  pre{
    background:rgba(0,0,0,.35);
    border:1px solid var(--border);
    padding:10px;               /* was 14px */
    border-radius:10px;         /* was 12px */
    overflow:auto;
    margin:6px 0;               /* was 8px */
  }
  ul{margin:8px 0 0 18px; width:var(--block-w);}
  li{margin:3px 0;color:var(--text)}
  .small{color:var(--muted);font-size:12.5px; width:var(--block-w);}
  hr{border:none;height:1px;background:var(--border);margin:12px 0}
</style>
</head>
<body>
  <div class="wrap">

    <div class="card">
      <span class="badge">Cost Manager — REST API</span>
      <h1>Welcome</h1>
<div>
This service is an API only. 
We created this front page to explain capabilities and show examples.
  <br> 
<span>For GET requests you can paste the URL directly in your browser.</span>
<span>For POST requests, you can use Postman or another HTTP client</span>
  <br>
</div>

      <h2>Base URLs</h2>
      <pre><code>Production: ${renderUrl}
Local:      ${localUrl}</code></pre>

      <h2>Supported Categories</h2>
      <pre><code>food, health, housing, sports, education</code></pre>
    </div>

    <div class="card">
      <h2>What you can do </h2>
      <ul>
        <li>Add a <strong>user</strong> (POST <code>/api/add</code>)</li>
        <li>Add a <strong>cost</strong> (POST <code>/api/add</code>)</li>
        <li>Get a <strong>monthly report</strong> grouped by category (GET <code>/api/report?id=&amp;year=&amp;month=</code>)</li>
        <li>Get <strong>user details</strong> + total (GET <code>/api/users/:id</code>)</li>
        <li>List <strong>all users</strong> (GET <code>/api/users</code>)</li>
        <li>List <strong>logs</strong> (GET <code>/api/logs</code>)</li>
        <li><strong>Developers team</strong> (GET <code>/api/about</code>)</li>
        <li><strong>Health</strong> (GET <code>/health</code>) → returns <code>{ ok: true }</code></li>
      </ul>
      <div class="small" style="margin-top:6px">
        Notes:
        • <code>/api/add</code> is POST-only; calling it with GET will show “Cannot GET /api/add” or 405 by design.
        • Past-dated costs are rejected; past-month reports are <em>cached</em> (Computed Pattern).
        • Response JSON fields mirror the DB schema exactly.
      </div>
    </div>

    <div class="card">
      <h2>Examples (Production)</h2>

      <h3>(1) Health</h3>
      <pre><code>GET ${renderUrl}/health
→ { "ok": true }</code></pre>

      <h3>(2) Developers team (About)</h3>
      <pre><code>GET ${renderUrl}/api/about
→ [
  { "first_name": "Amil", "last_name": "Davidov" },
  { "first_name": "Dor",  "last_name": "Cohen" }
]</code></pre>

      <h3>(3) Add User</h3>
      <pre><code>POST ${renderUrl}/api/add
Content-Type: application/json

{ "id": 123123, "first_name": "mosh", "last_name": "israeli", "birthday": "2000-01-02" }
→ 201/200 (echoes the user document)</code></pre>

      <h3>(4) Add Cost (current)</h3>
      <pre><code>POST ${renderUrl}/api/add
Content-Type: application/json

{ "userid": 123123, "description": "milk", "category": "food", "sum": 8 }
→ 201/200 (createdAt is set by the server if not provided)</code></pre>

      <h3>(5) Add Cost — invalid (past createdAt)</h3>
      <pre><code>POST ${renderUrl}/api/add
Content-Type: application/json

{ "userid": 123123, "description": "old example", "category": "food", "sum": 3.5, "createdAt": "2025-08-30T10:00:00.000Z" }
→ 400
{ "error": "validation_error", "message": "createdAt cannot belong to the past" }</code></pre>

      <h3>(6) Monthly Report (current month)</h3>
      <pre><code>GET ${renderUrl}/api/report?id=123123&amp;year=2025&amp;month=9
→ {
  "userid": 123123, "year": 2025, "month": 9,
  "costs": [
    { "food": [ { "sum": 8, "description": "milk 9", "day": 7 }, ... ] },
    { "education": [ ... ] },
    { "health": [ ... ] },
    { "housing": [ ... ] },
    { "sports": [ ... ] }
  ]
}</code></pre>

      <h3>(7) Monthly Report (past month → computed cache)</h3>
      <pre><code>GET ${renderUrl}/api/report?id=123123&amp;year=2025&amp;month=6
→ First call computes & stores report in "reports".
→ Next calls serve precomputed report.</code></pre>

      <h3>(8) User details</h3>
      <pre><code>GET ${renderUrl}/api/users/123123
→ { "first_name": "Dor", "last_name": "Cohen", "id": 123123, "total": &lt;sum&gt; }</code></pre>

      <h3>(9) All users</h3>
      <pre><code>GET ${renderUrl}/api/users
→ [ { "id": ..., "first_name": ..., "last_name": ..., "birthday": ... }, ... ]</code></pre>

      <h3>(10) Logs</h3>
      <pre><code>GET ${renderUrl}/api/logs
→ [ { "level":"info","message":"http_request","method":"GET","path":"/...", "statusCode":200, "createdAt":"..." }, ... ]</code></pre>
    </div>

    <div class="card">
      <h2>Implementation</h2>
      <pre class="w"><code>• MongoDB Atlas with Mongoose models in /models
• Collections: users, costs, logs, reports (computed)
• JSON fields mirror DB schema
• Validation on input and report params (month 1..12)
• Logging for every request + endpoint access (Pino)
• Env: MONGODB_URI, NODE_ENV, CATEGORIES, PORT</code></pre>
      <div class="small">Developers Team: <code>Amil Davidov</code>, <code>Dor Cohen</code></div>
    </div>

  </div>
</body>
</html>`;

    res.type("html").send(html);
});



/* Error handler: return JSON with error description */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    req.log?.error({ msg: "Unhandled error", error: err.message });
    return res.status(500).json({ error: "internal_error", message: err.message });
});

export default app;
