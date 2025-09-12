/* Express middleware that persists a log document for every HTTP request (and endpoint access), optionally skipping health checks, using the Log model. */
/* Middleware: saves a log document for every HTTP request.*/
import { Log } from "../models/log.js";

export async function requestLogSaver(req, res, next) {
  const start = Date.now(); // Record request start time

  res.on("finish", async () => {
    try {
      const duration = Date.now() - start; // Calculate request duration
      await Log.create({
        level: "info",
        message: "http_request",
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        meta: { duration }
      });
    } catch (e) {
      // Best-effort logging; avoid crashing on log failure
      req.log?.error({ msg: "failed to persist request log", error: e.message });
    }
  });

  next(); // Continue to next middleware
}
