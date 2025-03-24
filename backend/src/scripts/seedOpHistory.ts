import mongoose from "mongoose";
import dotenv from "dotenv";
import { connectDB } from "../config/db";
import OpHistory, { OpType, PrepType, Location } from "../models/OpHistory";
import Patient from "../models/Patient";
import Doctor from "../models/Doctors";

dotenv.config();

// Function to seed the database with operation history
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB...");

    // First clear existing operation history data
    await OpHistory.deleteMany({});
    console.log("Cleared existing operation history data...");

    // Get all patients
    const patients = await Patient.find();
    if (patients.length === 0) {
      console.error(
        "No patients found in the database. Please run seed:patients first."
      );
      process.exit(1);
    }
    console.log(`Found ${patients.length} patients in the database.`);

    // Get all doctors
    const doctors = await Doctor.find();
    if (doctors.length === 0) {
      console.error(
        "No doctors found in the database. Please run seed:doctors first."
      );
      process.exit(1);
    }
    console.log(`Found ${doctors.length} doctors in the database.`);

    // Sample operation history data
    const operations = [
      {
        patientId: patients[0]._id,
        doctorId: doctors[0]._id,
        isOperation: true,
        date: new Date("2024-02-15"),
        opType: OpType.COLONO,
        prepType: PrepType.PIKO,
        location: Location.ASOTA_HOLON,
        startHour: "09:00",
        endHour: "09:30",
        notes: "Patient's first colonoscopy",
      },
      {
        patientId: patients[1]._id,
        doctorId: doctors[1]._id,
        isOperation: true,
        date: new Date("2024-03-10"),
        opType: OpType.DOUBLE,
        prepType: PrepType.MEROKEN,
        location: Location.ASOTA_RAMAT_HAHAYAL,
        startHour: "10:00",
        endHour: "10:45",
        notes: "Double procedure scheduled",
      },
      {
        patientId: patients[0]._id,
        doctorId: doctors[2]._id,
        isOperation: false, // This is a consultation, not an operation
        date: new Date("2024-01-20"),
        opType: OpType.GASTRO,
        prepType: PrepType.NO_PREP,
        location: Location.BEST_MEDICAL,
        startHour: "13:15",
        endHour: "13:30",
        notes: "Initial consultation for gastroscopy",
      },
      {
        patientId: patients[2]._id,
        doctorId: doctors[0]._id,
        isOperation: true,
        date: new Date("2024-03-20"),
        opType: OpType.SIGMO,
        prepType: PrepType.NO_PREP,
        location: Location.ASOTA_CALANIOT,
        startHour: "14:00",
        endHour: "14:15",
        notes: "Routine sigmoidoscopy",
      },
      {
        patientId: patients[1]._id,
        doctorId: doctors[1]._id,
        isOperation: true,
        date: new Date("2024-04-05"),
        opType: OpType.COLONO,
        prepType: PrepType.PIKO,
        location: Location.ASOTA_HOLON,
        startHour: "11:30",
        endHour: "12:00",
        notes: "Follow-up colonoscopy",
      },
    ];

    // Insert sample operations
    const createdOps = await OpHistory.insertMany(operations);
    console.log(`Inserted ${createdOps.length} operation history records`);

    // Update patients' isSetForOp status
    // For each patient that has at least one operation, set isSetForOp to true
    for (const patient of patients) {
      const hasOperation = await OpHistory.exists({
        patientId: patient._id,
        isOperation: true,
        date: { $gte: new Date() }, // Only future operations count
      });

      if (hasOperation) {
        await Patient.findByIdAndUpdate(patient._id, { isSetForOp: true });
        console.log(
          `Updated patient ${patient.firstName} ${patient.lastName} to isSetForOp: true`
        );
      }
    }

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
