import request from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../index";
import Patient from "../models/Patient";
import { connectDB } from "../config/db";

// Load environment variables
dotenv.config();

describe("Patient API Routes", () => {
  // Setup connection to MongoDB before tests
  beforeAll(async () => {
    await connectDB();
    console.log("Connected to MongoDB for testing");
  });

  // Clear patients collection before each test
  beforeEach(async () => {
    await Patient.deleteMany({});
    console.log("Cleared patients collection");
  });

  // Close connection after all tests
  afterAll(async () => {
    await mongoose.connection.close();
    console.log("Closed MongoDB connection");
  });

  // Function to validate Israeli ID (Teudat Zehut)
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

  // Sample patient data for testing with valid Israeli ID
  const samplePatient = {
    patientId: "123456782", // Valid Israeli ID (with proper checksum)
    firstName: "John",
    lastName: "Doe",
    HCProvider: "maccabi",
    phone: "0501234567",
    additionalPhone: "0509876543",
    isSetForOp: false,
  };

  // GET /api/patients - Get all patients
  describe("GET /api/patients", () => {
    it("should return empty array when no patients exist", async () => {
      const res = await request(app).get("/api/patients");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all patients", async () => {
      // Create test patients
      await Patient.create(samplePatient);
      await Patient.create({
        patientId: "987654320",
        firstName: "Jane",
        lastName: "Smith",
        HCProvider: "clalit",
        phone: "0502345678",
        isSetForOp: true,
      });

      const res = await request(app).get("/api/patients");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty("patientId");
      expect(res.body[0]).toHaveProperty("firstName");
      expect(res.body[0]).toHaveProperty("lastName");
      expect(res.body[0]).toHaveProperty("HCProvider");
      expect(res.body[0]).toHaveProperty("phone");
    });
  });

  // GET /api/patients/teudat-zehut/:id - Get patient by Israeli ID
  describe("GET /api/patients/teudat-zehut/:id", () => {
    it("should return a patient by Israeli ID", async () => {
      const patient = await Patient.create(samplePatient);

      const res = await request(app).get(
        `/api/patients/teudat-zehut/${samplePatient.patientId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.patientId).toBe(samplePatient.patientId);
      expect(res.body.firstName).toBe(samplePatient.firstName);
      expect(res.body.lastName).toBe(samplePatient.lastName);
      expect(res.body.HCProvider).toBe(samplePatient.HCProvider);
      expect(res.body.phone).toBe(samplePatient.phone);
    });

    it("should return 404 if patient not found", async () => {
      const res = await request(app).get(
        "/api/patients/teudat-zehut/000000000"
      );

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Patient not found");
    });
  });

  // POST /api/patients - Create a new patient
  describe("POST /api/patients", () => {
    it("should create a new patient", async () => {
      const res = await request(app).post("/api/patients").send(samplePatient);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("patientId", samplePatient.patientId);
      expect(res.body).toHaveProperty("firstName", samplePatient.firstName);
      expect(res.body).toHaveProperty("lastName", samplePatient.lastName);
      expect(res.body).toHaveProperty("HCProvider", samplePatient.HCProvider);
      expect(res.body).toHaveProperty("phone", samplePatient.phone);

      // Verify patient was saved to database
      const savedPatient = await Patient.findOne({
        patientId: samplePatient.patientId,
      });
      expect(savedPatient).not.toBeNull();
    });

    it("should not create patient with duplicate ID", async () => {
      // First create a patient
      await Patient.create(samplePatient);

      // Try to create another with same ID
      const res = await request(app).post("/api/patients").send(samplePatient);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Patient with this ID already exists"
      );
    });

    it("should validate Israeli ID format", async () => {
      const res = await request(app).post("/api/patients").send({
        patientId: "12345", // Invalid - not 9 digits
        firstName: "John",
        lastName: "Doe",
        HCProvider: "maccabi",
        phone: "0501234567",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });

    it("should validate phone number format", async () => {
      const res = await request(app).post("/api/patients").send({
        patientId: "123456782",
        firstName: "John",
        lastName: "Doe",
        HCProvider: "maccabi",
        phone: "12345", // Invalid - not Israeli format
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });

    it("should validate HCProvider value", async () => {
      const res = await request(app).post("/api/patients").send({
        patientId: "123456782",
        firstName: "John",
        lastName: "Doe",
        HCProvider: "invalid_provider", // Invalid value
        phone: "0501234567",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });

    it("should require all mandatory fields", async () => {
      const res = await request(app).post("/api/patients").send({
        patientId: "123456782",
        // Missing firstName, lastName, HCProvider, and phone
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });
  });

  // PUT /api/patients/:id - Update a patient
  describe("PUT /api/patients/:id", () => {
    it("should update an existing patient", async () => {
      // Create a patient first
      const patient = await Patient.create(samplePatient);

      const updatedInfo = {
        firstName: "Updated",
        lastName: "Name",
        HCProvider: "leumit",
        phone: "0509999999",
      };

      const res = await request(app)
        .put(`/api/patients/${patient._id}`)
        .send(updatedInfo);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("firstName", updatedInfo.firstName);
      expect(res.body).toHaveProperty("lastName", updatedInfo.lastName);
      expect(res.body).toHaveProperty("HCProvider", updatedInfo.HCProvider);
      expect(res.body).toHaveProperty("phone", updatedInfo.phone);
      expect(res.body).toHaveProperty("patientId", samplePatient.patientId); // ID should not change

      // Verify patient was updated in database
      const updatedPatient = await Patient.findById(patient._id);
      expect(updatedPatient?.firstName).toBe(updatedInfo.firstName);
      expect(updatedPatient?.lastName).toBe(updatedInfo.lastName);
      expect(updatedPatient?.HCProvider).toBe(updatedInfo.HCProvider);
      expect(updatedPatient?.phone).toBe(updatedInfo.phone);
    });

    it("should return 404 if patient not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).put(`/api/patients/${fakeId}`).send({
        firstName: "Updated",
        lastName: "Name",
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Patient not found");
    });

    it("should validate update data", async () => {
      // Create a patient first
      const patient = await Patient.create(samplePatient);

      const res = await request(app).put(`/api/patients/${patient._id}`).send({
        firstName: "", // Invalid - empty string
        lastName: "Name",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });
  });

  // DELETE /api/patients/:id - Delete a patient
  describe("DELETE /api/patients/:id", () => {
    it("should delete an existing patient", async () => {
      // Create a patient first
      const patient = await Patient.create(samplePatient);

      const res = await request(app).delete(`/api/patients/${patient._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Patient removed");

      // Verify patient was removed from database
      const deletedPatient = await Patient.findById(patient._id);
      expect(deletedPatient).toBeNull();
    });

    it("should return 404 if patient not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/patients/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Patient not found");
    });
  });
});
