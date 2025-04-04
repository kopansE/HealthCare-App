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

// Generate random operation days with doctor assignment ensuring uniqueness
async function seedOperationDays(): Promise<void> {
  try {
    // Get all available doctors
    const doctors = await Doctor.find();
    if (doctors.length === 0) {
      console.error("No doctors found for assigning to operation days");
      return;
    }

    // Get weekdays in April 2025
    const april2025Weekdays = getWeekdaysInMonth(2025, 4);

    // Array to keep track of created operation days to ensure uniqueness
    const createdOperationDays: {
      date: Date;
      location: Location;
      doctorId: mongoose.Types.ObjectId;
    }[] = [];
    const operationDaysToCreate = [];

    // For each weekday
    for (const date of april2025Weekdays) {
      // For each location
      for (const location of Object.values(Location)) {
        // Pick a random doctor that hasn't been assigned to this date/location yet
        const availableDoctors = doctors.filter((doctor) => {
          // Check if this doctor already has an assignment for this date and location
          return !createdOperationDays.some(
            (day) =>
              day.date.getTime() === date.getTime() &&
              day.location === location &&
              day.doctorId.toString() === (doctor._id as any).toString()
          );
        });

        if (availableDoctors.length > 0) {
          const randomDoctorIndex = Math.floor(
            Math.random() * availableDoctors.length
          );
          const doctor = availableDoctors[randomDoctorIndex];

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

          const operationDay = {
            date,
            location,
            startHour,
            endHour,
            doctorId: doctor._id as mongoose.Types.ObjectId,
            isLocked: false,
          };

          // Add to tracking array
          createdOperationDays.push({
            date,
            location,
            doctorId: doctor._id as mongoose.Types.ObjectId,
          });

          // Add to array for batch creation
          operationDaysToCreate.push(operationDay);
        }
      }
    }

    // Insert operation days into database
    await OperationDay.insertMany(operationDaysToCreate);
    console.log(
      `✅ Added ${operationDaysToCreate.length} operation days for April 2025`
    );
  } catch (error) {
    console.error("Error seeding operation days:", error);
  }
}

// Seed doctors data
async function seedDoctors(): Promise<void> {
  try {
    const doctors = [];

    // Generate 10 doctors with different IDs
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

// Seed patients data with appropriate health providers for scheduling
async function seedPatients(): Promise<void> {
  try {
    const patients = [];
    const operationTypes = Object.values(OpType);
    const healthProviders = Object.values(HCProvider);

    // Generate patients with specific distribution of health providers
    // to ensure we have patients for all locations
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

      // Control health provider distribution to ensure we have patients for all locations
      // - Maccabi: 50% (can go to Holon, Ramat HaHayal, Calaniot)
      // - Leumit: 30% (can go to Best Medical, Ramat HaHayal, Calaniot)
      // - Others: 20% (for testing invalid cases)
      let healthProvider;
      const rand = Math.random();
      if (rand < 0.5) {
        healthProvider = HCProvider.MACCABI;
      } else if (rand < 0.8) {
        healthProvider = HCProvider.LEUMIT;
      } else {
        healthProvider = healthProviders[Math.floor(Math.random() * 2) + 2]; // CLALIT or MEUHEDET
      }

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

    // Clear existing data
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
