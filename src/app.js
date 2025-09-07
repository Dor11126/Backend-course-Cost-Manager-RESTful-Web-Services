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

/* Error handler: return JSON with error description */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    req.log?.error({ msg: "Unhandled error", error: err.message });
    return res.status(500).json({ error: "internal_error", message: err.message });
});

export default app;
