/* Mongoose schema/model for computed monthly reports per the Computed Pattern. */
/*
 * reports collection (Mongoose) - computed cache for past months
 *  - userid: Number
 *  - year: Number
 *  - month: Number (1..12)
 *  - payload: Object (the exact JSON structure to return)
 *  - computedAt: Date
 */
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    userid: { type: Number, required: true, index: true }, // User id, indexed
    year: { type: Number, required: true }, // Year of report
    month: { type: Number, required: true, min: 1, max: 12 }, // Month (1..12)
    payload: { type: Object, required: true }, // Cached report payload
    computedAt: { type: Date, default: Date.now } // When report was computed
  },
  { collection: "reports" } // Use "reports" collection
);

reportSchema.index({ userid: 1, year: 1, month: 1 }, { unique: true }); // Unique index for cache

export const Report = mongoose.model("Report", reportSchema); // Export Report model
