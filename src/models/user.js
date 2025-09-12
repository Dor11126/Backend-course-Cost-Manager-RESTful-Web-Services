/* Mongoose schema/model for the users collection */
/*
 * users collection (Mongoose)
 * Fields and types per spec:
 *  - id: Number
 *  - first_name: String
 *  - last_name: String
 *  - birthday: Date
 */
import mongoose from "mongoose";

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true }, // User id, unique
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    birthday: { type: Date, required: true } // Birthday (date)
  },
  { collection: "users", timestamps: true } // Use "users" collection, timestamped
);

// Export the User model based on the schema
export const User = mongoose.model("User", userSchema);
