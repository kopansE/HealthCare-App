// backend/src/tests/setupTests.ts
import mongoose from "mongoose";

// Increase timeout for tests
jest.setTimeout(30000);

// Define a Mock for console.error to reduce noise in tests
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === "string" && args[0].includes("Mongoose")) {
    return; // Suppress mongoose warning logs
  }
  originalConsoleError(...args);
};

// Clean up after all tests
afterAll(async () => {
  try {
    await mongoose.connection.close();
  } catch (err) {
    // Ignore connection errors during cleanup
  }
});
