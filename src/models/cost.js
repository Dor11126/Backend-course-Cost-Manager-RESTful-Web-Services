import mongoose from "mongoose";

// Allowed categories, loaded from env or default list
const allowed = (process.env.CATEGORIES || "food,health,housing,sports,education")
    .split(",").map(s => s.trim()).filter(Boolean);

// Define cost schema for Mongoose
const costSchema = new mongoose.Schema({
    description: { type: String, required: true, trim: true }, // Cost description
    category:    { type: String, required: true, enum: allowed }, // Category, must be in allowed list
    userid:      { type: Number, required: true }, // User ID reference
    sum:         { type: Number, required: true, min: [0, "sum must be >= 0"] }, // Amount, must be >= 0
    createdAt:   {
        type: Date,
        default: () => new Date(), // Default to now
        validate: {
            // Validate: must be a valid date and not in the past
            validator(v) { return v instanceof Date && !Number.isNaN(v.valueOf()) && v.getTime() >= Date.now() - 5000; },
            message: "createdAt cannot be in the past"
        }
    }
}, { collection: "costs", strict: true, versionKey: false }); // Use "costs" collection, strict mode

// Indexes for efficient queries by user and date
costSchema.index({ userid: 1, createdAt: 1 });
costSchema.index({ category: 1, userid: 1, createdAt: 1 });

// Export Cost model for use in app
export const Cost = mongoose.model("Cost", costSchema);
