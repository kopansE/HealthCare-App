import request from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../index";
import OpHistory, { OpType, PrepType, Location } from "../models/OpHistory";
import Patient from "../models/Patient";
import Doctor from "../models/Doctors";
import { connectDB } from "../config/db";

// Load environment variables
dotenv.config();

describe("Operation History API Routes", () => {
  let patientId: mongoose.Types.ObjectId;
  let doctorId: mongoose.Types.ObjectId;

  // Setup connection to MongoDB before tests
  beforeAll(async () => {
    await connectDB();
    console.log("Connected to MongoDB for testing");

    // Create a test patient and doctor
    const patient = await Patient.create({
      patientId: "123456782",
      firstName: "Test",
      lastName: "Patient",
      HCProvider: "maccabi",
      phone: "0501234567",
      additionalPhone: "",
      isSetForOp: false,
    });

    const doctor = await Doctor.create({
      doctorId: "987654320",
      firstName: "Test",
      lastName: "Doctor",
    });

    patientId = patient._id as mongoose.Types.ObjectId;
    doctorId = doctor._id as mongoose.Types.ObjectId;
  });

  // Clear OpHistory collection before each test
  beforeEach(async () => {
    await OpHistory.deleteMany({});
    console.log("Cleared operation history collection");
  });

  // Close connection after all tests
  afterAll(async () => {
    // Clean up test data
    await Patient.findByIdAndDelete(patientId);
    await Doctor.findByIdAndDelete(doctorId);
    await mongoose.connection.close();
    console.log("Closed MongoDB connection");
  });

  // Sample operation history data for testing
  const sampleOpHistory = {
    patientId: "", // Will be filled dynamically
    doctorId: "", // Will be filled dynamically
    isOperation: true,
    date: new Date("2024-04-01"),
    opType: OpType.COLONO,
    prepType: PrepType.PIKO,
    location: Location.ASOTA_HOLON,
    startHour: "10:00",
    endHour: "10:30",
    notes: "Test operation",
  };

  // GET /api/ophistory - Get all operation history records
  describe("GET /api/ophistory", () => {
    it("should return empty array when no records exist", async () => {
      const res = await request(app).get("/api/ophistory");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all operation history records", async () => {
      // Create test operation history
      const opData = {
        ...sampleOpHistory,
        patientId: patientId,
        doctorId: doctorId,
      };

      await OpHistory.create(opData);

      const res = await request(app).get("/api/ophistory");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty("opType", OpType.COLONO);
      expect(res.body[0]).toHaveProperty("location", Location.ASOTA_HOLON);
      // Check populated fields
      expect(res.body[0].patientId).toHaveProperty("firstName", "Test");
      expect(res.body[0].doctorId).toHaveProperty("lastName", "Doctor");
    });
  });

  // POST /api/ophistory - Create a new operation history record
  describe("POST /api/ophistory", () => {
    it("should create a new operation history record", async () => {
      const opData = {
        ...sampleOpHistory,
        patientId: patientId.toString(),
        doctorId: doctorId.toString(),
      };

      const res = await request(app).post("/api/ophistory").send(opData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("opType", OpType.COLONO);
      expect(res.body).toHaveProperty("prepType", PrepType.PIKO);
      expect(res.body).toHaveProperty("location", Location.ASOTA_HOLON);
      expect(res.body.patientId).toHaveProperty("firstName", "Test");
      expect(res.body.doctorId).toHaveProperty("lastName", "Doctor");

      // Verify record was saved to database
      const savedOp = await OpHistory.findById(res.body._id);
      expect(savedOp).not.toBeNull();

      // Verify patient has isSetForOp = true now
      const updatedPatient = await Patient.findById(patientId);
      expect(updatedPatient?.isSetForOp).toBe(true);
    });

    it("should validate operation type", async () => {
      const opData = {
        ...sampleOpHistory,
        patientId: patientId.toString(),
        doctorId: doctorId.toString(),
        opType: "invalid_type", // Invalid operation type
      };

      const res = await request(app).post("/api/ophistory").send(opData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });

    it("should validate preparation type", async () => {
      const opData = {
        ...sampleOpHistory,
        patientId: patientId.toString(),
        doctorId: doctorId.toString(),
        prepType: "invalid_prep", // Invalid preparation type
      };

      const res = await request(app).post("/api/ophistory").send(opData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });

    it("should validate location", async () => {
      const opData = {
        ...sampleOpHistory,
        patientId: patientId.toString(),
        doctorId: doctorId.toString(),
        location: "invalid_location", // Invalid location
      };

      const res = await request(app).post("/api/ophistory").send(opData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });

    it("should validate time format", async () => {
      const opData = {
        ...sampleOpHistory,
        patientId: patientId.toString(),
        doctorId: doctorId.toString(),
        startHour: "10:65", // Invalid time format (minutes > 59)
      };

      const res = await request(app).post("/api/ophistory").send(opData);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });
  });

  // GET /api/ophistory/patient/:patientId - Get operation history by patient ID
  describe("GET /api/ophistory/patient/:patientId", () => {
    it("should return operation history for a specific patient", async () => {
      // Create two operation histories with different patients
      const opData1 = {
        ...sampleOpHistory,
        patientId: patientId,
        doctorId: doctorId,
      };

      await OpHistory.create(opData1);

      // Create another patient and operation
      const patient2 = await Patient.create({
        patientId: "987654320",
        firstName: "Another",
        lastName: "Patient",
        HCProvider: "clalit",
        phone: "0502345678",
      });

      const opData2 = {
        ...sampleOpHistory,
        patientId: patient2._id,
        doctorId: doctorId,
        date: new Date("2024-04-02"),
      };

      await OpHistory.create(opData2);

      // Request operation history for the first patient
      const res = await request(app).get(`/api/ophistory/patient/${patientId}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(new Date(res.body[0].date).toISOString().split("T")[0]).toBe(
        "2024-04-01"
      );

      // Clean up
      await Patient.findByIdAndDelete(patient2._id);
    });
  });

  // GET /api/ophistory/date/:date - Get operation history by date
  describe("GET /api/ophistory/date/:date", () => {
    it("should return operation history for a specific date", async () => {
      // Create operations on different dates
      const opData1 = {
        ...sampleOpHistory,
        patientId: patientId,
        doctorId: doctorId,
        date: new Date("2024-04-01"),
      };

      const opData2 = {
        ...sampleOpHistory,
        patientId: patientId,
        doctorId: doctorId,
        date: new Date("2024-04-02"),
      };

      await OpHistory.create(opData1);
      await OpHistory.create(opData2);

      // Request operation history for April 1, 2024
      const res = await request(app).get("/api/ophistory/date/2024-04-01");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(new Date(res.body[0].date).toISOString().split("T")[0]).toBe(
        "2024-04-01"
      );
    });
  });

  // DELETE /api/ophistory/:id - Delete an operation history record
  describe("DELETE /api/ophistory/:id", () => {
    it("should delete an operation history record and update patient status", async () => {
      // Create operation history
      const opData = {
        ...sampleOpHistory,
        patientId: patientId,
        doctorId: doctorId,
      };

      const operation = await OpHistory.create(opData);

      // Verify patient has isSetForOp = true
      await Patient.findByIdAndUpdate(patientId, { isSetForOp: true });

      // Delete the operation
      const res = await request(app).delete(`/api/ophistory/${operation._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Operation history removed");

      // Verify operation was removed from database
      const deletedOp = await OpHistory.findById(operation._id);
      expect(deletedOp).toBeNull();

      // Verify patient has isSetForOp = false now (since this was their only operation)
      const updatedPatient = await Patient.findById(patientId);
      expect(updatedPatient?.isSetForOp).toBe(false);
    });

    it("should return 404 if operation history not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/ophistory/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Operation history not found");
    });
  });
});
