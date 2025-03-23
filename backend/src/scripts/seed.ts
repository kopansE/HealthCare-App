// backend/src/scripts/seed.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import Doctor from "../models/Doctors";
import { connectDB } from "../config/db";

dotenv.config();

// Sample doctors data
const doctors = [
  {
    doctorId: "123456789",
    firstName: "Moshe",
    lastName: "Cohen",
  },
  {
    doctorId: "987654321",
    firstName: "Sarah",
    lastName: "Levy",
  },
  {
    doctorId: "456789123",
    firstName: "David",
    lastName: "Avraham",
  },
  {
    doctorId: "789123456",
    firstName: "Tamar",
    lastName: "Goldin",
  },
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB...");

    // First clear existing data
    await Doctor.deleteMany({});
    console.log("Cleared existing doctors data...");

    // Insert sample doctors
    const createdDoctors = await Doctor.insertMany(doctors);
    console.log(`Inserted ${createdDoctors.length} doctors`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
