// backend/src/scripts/checkDbConnection.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db";
import path from "path";
import fs from "fs";

// Load environment variables with explicit path to .env file
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  console.log(`📄 Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log(`⚠️ No .env file found at ${envPath}`);
  console.log("⚠️ Using default environment variables");
  dotenv.config();
}

// Log connection string (with password redacted)
const connectionString = process.env.MONGODB_URI || "";
if (!connectionString) {
  console.error("❌ Error: No MONGODB_URI found in environment variables");
  process.exit(1);
}

console.log(
  "🔌 Using connection string:",
  connectionString.replace(/:([^:@]+)@/, ":****@")
);

const checkDbConnection = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("✅ Successfully connected to MongoDB");

    // Wait a moment to ensure connection is fully established
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if connection is established and db is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not fully established");
    }

    // Check database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Connected to database: ${dbName}`);

    // List all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log("📋 Available collections:");
    if (collections.length === 0) {
      console.log("  No collections found (empty database)");
    } else {
      collections.forEach((collection) => {
        console.log(`  - ${collection.name}`);
      });
    }

    // Connection state
    console.log(
      `🔌 Connection state: ${
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
      }`
    );

    console.log("✨ Database connection check completed successfully");

    // Close the connection
    await mongoose.connection.close();
    console.log("🔒 Connection closed");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking database connection:", error);
    process.exit(1);
  }
};

// Run the check
checkDbConnection();
