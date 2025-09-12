/* Mongoose schema/model for the logs collection storing HTTP request/endpoint entries with timestamps (optional TTL for auto-cleanup). */
/*
 * logs collection (Mongoose)
 * Saved on every HTTP request and on endpoint access
 */
import mongoose from "mongoose";

// Define the schema for logs
const logSchema = new mongoose.Schema(
  {
    level: { type: String, default: "info" }, // Log level
    message: { type: String, required: true }, // Log message
    method: { type: String }, // HTTP method
    path: { type: String }, // Request path
    statusCode: { type: Number }, // HTTP status code
    meta: { type: Object } // Additional metadata
  },
  { collection: "logs", timestamps: { createdAt: "createdAt" } } // Use "logs" collection, timestamped
);

// Export the Log model based on the logSchema
export const Log = mongoose.model("Log", logSchema);
