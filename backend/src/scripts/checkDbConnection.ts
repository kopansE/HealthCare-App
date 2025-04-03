// src/scripts/checkDbConnection.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import Doctor from "../models/Doctors";
import Patient from "../models/Patient";
import OperationDay from "../models/OperationDay";
import Schedule from "../models/Schedule";

// Load environment variables
dotenv.config();

// MongoDB connection URL
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/clinic-scheduler";

async function checkDbConnection(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Successfully connected to MongoDB");

    // Check collections statistics
    const doctorCount = await Doctor.countDocuments();
    const patientCount = await Patient.countDocuments();
    const operationDayCount = await OperationDay.countDocuments();
    const scheduleCount = await Schedule.countDocuments();

    console.log("\nDatabase statistics:");
    console.log(`- Doctors: ${doctorCount}`);
    console.log(`- Patients: ${patientCount}`);
    console.log(`- Operation Days: ${operationDayCount}`);
    console.log(`- Scheduled Operations: ${scheduleCount}`);

    // Check for patients that need scheduling
    const unscheduledPatients = await Patient.countDocuments({
      isSetForOp: false,
    });
    console.log(`\n- Patients awaiting scheduling: ${unscheduledPatients}`);

    // Calculate percentage scheduled
    if (patientCount > 0) {
      const scheduledPercentage =
        ((patientCount - unscheduledPatients) / patientCount) * 100;
      console.log(
        `- Scheduling completion: ${scheduledPercentage.toFixed(2)}%`
      );
    }

    // Show upcoming operation days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingDays = await OperationDay.find({
      date: { $gte: today },
    })
      .sort({ date: 1 })
      .limit(5);

    console.log("\nUpcoming operation days:");
    if (upcomingDays.length > 0) {
      upcomingDays.forEach((day) => {
        console.log(
          `- ${day.date.toDateString()} at ${day.location} (${
            day.startHour
          } - ${day.endHour})`
        );
      });
    } else {
      console.log("No upcoming operation days found.");
    }
  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

// Execute the function
checkDbConnection();
