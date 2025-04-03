// scripts/resetPatientCollection.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/clinic-scheduler";

async function resetPatientCollection(): Promise<void> {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    try {
      // Drop the patients collection
      await db.collection("patients").drop();
      console.log("Successfully dropped patients collection");
    } catch (error) {
      console.log("No patients collection to drop or error:", error);
    }

    await client.close();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error resetting collection:", error);
  }
}

resetPatientCollection();
