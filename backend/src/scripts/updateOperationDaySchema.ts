// scripts/updateOperationDaySchema.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/clinic-scheduler";

async function updateOperationDaySchema(): Promise<void> {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection;

    console.log("Checking existing indexes on operationdays collection...");
    const indexes = await db.collection("operationdays").indexes();
    console.log("Current indexes:", indexes);

    // Check if our compound index already exists
    const hasCompoundIndex = indexes.some(
      (idx) =>
        idx.key &&
        idx.key.date === 1 &&
        idx.key.location === 1 &&
        idx.key.doctorId === 1
    );

    if (hasCompoundIndex) {
      console.log("Compound index already exists on operationdays collection.");
    } else {
      console.log("Creating compound index on operationdays collection...");
      // Create the compound index with unique constraint
      await db
        .collection("operationdays")
        .createIndex({ date: 1, location: 1, doctorId: 1 }, { unique: true });
      console.log("Compound index created successfully!");
    }

    // Check for duplicate entries that would violate the unique constraint
    console.log("Checking for potential duplicate entries...");
    const pipeline = [
      {
        $group: {
          _id: { date: "$date", location: "$location", doctorId: "$doctorId" },
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ];

    const duplicates = await db
      .collection("operationdays")
      .aggregate(pipeline)
      .toArray();

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate entries.`);
      console.log(
        "Removing duplicate entries keeping only the first occurrence..."
      );

      // For each group of duplicates, keep the first one and remove the rest
      for (const duplicate of duplicates) {
        const idsToRemove = duplicate.ids.slice(1); // Keep the first one

        console.log(
          `Removing ${idsToRemove.length} duplicate entries for: `,
          duplicate._id
        );

        await db.collection("operationdays").deleteMany({
          _id: {
            $in: idsToRemove.map((id: any) => new mongoose.Types.ObjectId(id)),
          },
        });
      }

      console.log("Duplicate entries removed successfully!");
    } else {
      console.log("No duplicate entries found.");
    }

    console.log("Schema update completed successfully!");
  } catch (error) {
    console.error("Error updating schema:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

updateOperationDaySchema();
