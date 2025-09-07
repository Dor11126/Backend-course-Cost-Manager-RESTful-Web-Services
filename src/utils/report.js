/*
 * Utility: compute monthly report per spec and format exactly.
 */
import dayjs from "dayjs";
import { Cost } from "../models/cost.js";

/* Fixed category order (per spec, ensures deterministic output) */
const CATEGORY_ORDER = ["food", "education", "health", "housing", "sports"];

/**
 * Build the JSON report structure:
 * {
 *   userid, year, month,
 *   costs: [ {food:[{sum,description,day},...]}, {education:[...]}, ... ]
 * }
 */
export async function buildMonthlyReport(userid, year, month) {
  const from = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).startOf("month").toDate(); // Start of month
  const to = dayjs(from).endOf("month").toDate(); // End of month

  /* Fetch costs for that user and month */
  const costs = await Cost.find({
    userid: Number(userid),
    createdAt: { $gte: from, $lte: to }
  }).lean();

  /* Group by category */
  const grouped = new Map();
  for (const c of costs) {
    const day = dayjs(c.createdAt).date(); // Extract day from createdAt
    const item = { sum: Number(c.sum), description: c.description, day };
    const arr = grouped.get(c.category) || [];
    arr.push(item);
    grouped.set(c.category, arr);
  }

  /* Create array of single-key objects in desired order; include empty categories */
  const costsArray = CATEGORY_ORDER.map((cat) => {
    const arr = grouped.get(cat) || [];
    // keep input order; could sort by day if desired
    return { [cat]: arr };
  });

  return {
    userid: Number(userid),
    year: Number(year),
    month: Number(month),
    costs: costsArray
  };
}
