// backend/src/scripts/seedPatients.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import Patient from "../models/Patient";
import { connectDB } from "../config/db";

dotenv.config();

// Function to validate Israeli ID (Teudat Zehut) - Used to ensure valid IDs in sample data
const validateIsraeliID = (id: string): boolean => {
  // ID must be 9 digits
  if (!/^\d{9}$/.test(id)) return false;

  // Calculate checksum
  const digits = id.split("").map((digit) => parseInt(digit, 10));
  let sum = 0;

  // Loop through first 8 digits
  for (let i = 0; i < 8; i++) {
    // Multiply digit by 1 or 2 based on position
    let digit = digits[i];
    const factor = (i % 2) + 1;
    digit *= factor;

    // If multiplication resulted in a two-digit number, add digits
    if (digit > 9) {
      digit = Math.floor(digit / 10) + (digit % 10);
    }

    sum += digit;
  }

  // Check if last digit makes the sum a multiple of 10
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return calculatedCheckDigit === digits[8];
};

// Sample patients data (with valid Israeli IDs)
const patients = [
  {
    patientId: "123456782", // Valid ID
    firstName: "שרה",
    lastName: "כהן",
    HCProvider: "maccabi",
    phone: "0501234567",
    additionalPhone: "036789012",
    isSetForOp: false,
  },
  {
    patientId: "209130335", // Valid ID
    firstName: "רחל",
    lastName: "גולדברג",
    HCProvider: "meuhedet",
    phone: "0539876543",
    isSetForOp: false,
  },
  {
    patientId: "208668442", // Valid ID
    firstName: "דוד",
    lastName: "אברהם",
    HCProvider: "leumit",
    phone: "0548765432",
    additionalPhone: "035678901",
    isSetForOp: true,
  },
];

// Verify the IDs are valid before seeding
patients.forEach((patient) => {
  if (!validateIsraeliID(patient.patientId)) {
    console.error(`Invalid Israeli ID: ${patient.patientId}`);
    process.exit(1);
  }
});

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("Connected to MongoDB...");

    // First clear existing data
    await Patient.deleteMany({});
    console.log("Cleared existing patients data...");

    // Insert sample patients
    const createdPatients = await Patient.insertMany(patients);
    console.log(`Inserted ${createdPatients.length} patients`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
