// src/scripts/seed.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import Doctor from "../models/Doctors";
import Patient from "../models/Patient";
import OperationDay from "../models/OperationDay";
import { Location } from "../models/OperationDay";
import { OpType, PrepType, HCProvider } from "../models/Patient";

// Load environment variables
dotenv.config();

// MongoDB connection URL
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/clinic-scheduler";

// Helper function to generate a valid Israeli ID
function generateIsraeliID(): string {
  // Generate 8 random digits
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += Math.floor(Math.random() * 10).toString();
  }

  // Calculate checksum using Israeli ID algorithm
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let digit = parseInt(id[i]);
    // Apply weight (1 for even positions, 2 for odd positions)
    const weight = (i % 2) + 1;
    digit *= weight;

    // If the weighted value is > 9, subtract 9
    if (digit > 9) {
      digit -= 9;
    }
    sum += digit;
  }

  // Calculate check digit
  const checkDigit = (10 - (sum % 10)) % 10;

  // Return complete ID
  return id + checkDigit;
}

// Helper function to generate a valid Israeli phone number
function generateIsraeliPhoneNumber(): string {
  const prefixes = ["050", "052", "053", "054", "055", "058"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let number = prefix;

  // Add 7 more random digits
  for (let i = 0; i < 7; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }

  return number;
}

// Helper function to get weekdays in a month (Sunday to Thursday)
function getWeekdaysInMonth(year: number, month: number): Date[] {
  const weekdays: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();

    // Sunday (0) to Thursday (4)
    if (dayOfWeek >= 0 && dayOfWeek <= 4) {
      weekdays.push(date);
    }
  }

  return weekdays;
}

// Distribute operation days among available locations
function distributeLocations(
  dates: Date[]
): Array<{ date: Date; location: Location }> {
  const distribution: Array<{ date: Date; location: Location }> = [];
  const locations = Object.values(Location);

  dates.forEach((date, index) => {
    // Distribute locations in a round-robin fashion, but with some randomness
    const locationIndex = Math.floor(Math.random() * locations.length);
    distribution.push({
      date,
      location: locations[locationIndex],
    });

    // Sometimes add a second location for the same day (about 30% of the time)
    if (Math.random() < 0.3) {
      const secondLocationIndex =
        (locationIndex +
          1 +
          Math.floor(Math.random() * (locations.length - 1))) %
        locations.length;
      distribution.push({
        date,
        location: locations[secondLocationIndex],
      });
    }
  });

  return distribution;
}

// Generate random operation days
async function seedOperationDays(): Promise<void> {
  try {
    // Get weekdays in April 2025
    const april2025Weekdays = getWeekdaysInMonth(2025, 4);

    // Distribute locations for these dates
    const operationDaysData = distributeLocations(april2025Weekdays);

    // Prepare operation days with appropriate start/end hours
    const operationDays = operationDaysData.map(({ date, location }) => {
      // Different locations might have different hours
      let startHour = "09:00";
      let endHour = "17:00";

      // Slight variations for different locations
      if (location === Location.ASOTA_HOLON) {
        startHour = "08:30";
        endHour = "16:30";
      } else if (location === Location.ASOTA_RAMAT_HAHAYAL) {
        startHour = "09:00";
        endHour = "18:00";
      } else if (location === Location.BEST_MEDICAL) {
        startHour = "08:00";
        endHour = "16:00";
      }

      return {
        date,
        location,
        startHour,
        endHour,
      };
    });

    // Insert operation days into database
    await OperationDay.insertMany(operationDays);
    console.log(
      `✅ Added ${operationDays.length} operation days for April 2025`
    );
  } catch (error) {
    console.error("Error seeding operation days:", error);
  }
}

// Seed doctors data
async function seedDoctors(): Promise<void> {
  try {
    const doctors = [];

    // Generate 10 doctors
    for (let i = 0; i < 10; i++) {
      doctors.push({
        doctorId: generateIsraeliID(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
      });
    }

    // Insert doctors into database
    await Doctor.insertMany(doctors);
    console.log(`✅ Added ${doctors.length} doctors`);
  } catch (error) {
    console.error("Error seeding doctors:", error);
  }
}

// Seed patients data
async function seedPatients(): Promise<void> {
  try {
    const patients = [];
    const operationTypes = Object.values(OpType);
    const healthProviders = Object.values(HCProvider);

    // Generate 50 patients
    for (let i = 0; i < 50; i++) {
      // Select operation type
      const operationType =
        operationTypes[Math.floor(Math.random() * operationTypes.length)];

      // Determine preparation type based on operation type
      let preparationType;
      if (operationType === OpType.SIGMO || operationType === OpType.GASTRO) {
        preparationType = PrepType.NO_PREP;
      } else {
        // For COLONO and DOUBLE, randomly choose PIKO or MEROKEN
        preparationType =
          Math.random() < 0.5 ? PrepType.PIKO : PrepType.MEROKEN;
      }

      // Random health provider
      const healthProvider =
        healthProviders[Math.floor(Math.random() * healthProviders.length)];

      // Generate a visit date (between 1 and 30 days ago)
      const visitDate = new Date();
      visitDate.setDate(
        visitDate.getDate() - Math.floor(Math.random() * 30) - 1
      );

      // Randomly decide if the patient wants surgery (80% yes, 20% no)
      const doesntWantSurgery = Math.random() < 0.2;

      // Generate patient data
      patients.push({
        patientId: generateIsraeliID(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        HCProvider: healthProvider,
        phone: generateIsraeliPhoneNumber(),
        additionalPhone:
          Math.random() < 0.3 ? generateIsraeliPhoneNumber() : undefined,
        isSetForOp: false, // Start with all patients unscheduled
        doesntWantSurgery, // Add new field
        visitDate,
        operationType,
        preparationType,
        additionalInfo:
          Math.random() < 0.4 ? faker.lorem.sentence() : undefined,
      });
    }

    // Insert patients into database
    await Patient.insertMany(patients);
    console.log(`✅ Added ${patients.length} patients`);
  } catch (error) {
    console.error("Error seeding patients:", error);
  }
}

// Main function to seed all data
async function seedDatabase(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing data (optional - comment out if you want to keep existing data)
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await OperationDay.deleteMany({});
    console.log("Cleared existing data");

    // Seed data
    await seedDoctors();
    await seedPatients();
    await seedOperationDays();

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Execute the seeding function
seedDatabase();
