/* Starts the HTTP server by importing the Express app and listening on the provided PORT for local and production runs. */
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname for ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import http from "http";
// Import app after env loaded
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 3000; // Get port from env or default
const server = http.createServer(app); // Create HTTP server

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Cost Manager REST listening on port ${PORT}`); // Log server start
});

export default server;
