/** @type {import('jest').Config} */
export default {
  testEnvironment: "node",
  transform: {},                 // no Babel; pure ESM
  moduleFileExtensions: ["js", "json"],
  verbose: true,
  setupFiles: ["dotenv/config"], // loads .env via dotenv
  testTimeout: 30000             // instead of jest.setTimeout(...) inside tests
};
