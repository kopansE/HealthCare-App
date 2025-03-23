import request from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../index";
import Doctor from "../models/Doctors";
import { connectDB } from "../config/db";

// Load environment variables
dotenv.config();

describe("Doctor API Routes", () => {
  // Setup connection to MongoDB before tests
  beforeAll(async () => {
    // Connect to the real MongoDB using your connection string
    await connectDB();
    console.log("Connected to MongoDB for testing");
  });

  // Clear doctors collection before each test
  beforeEach(async () => {
    await Doctor.deleteMany({});
    console.log("Cleared doctors collection");
  });

  // Close connection after all tests
  afterAll(async () => {
    await mongoose.connection.close();
    console.log("Closed MongoDB connection");
  });

  // Sample doctor data for testing
  const sampleDoctor = {
    doctorId: "123456789",
    firstName: "John",
    lastName: "Doe",
  };

  // GET /api/doctors - Get all doctors
  describe("GET /api/doctors", () => {
    it("should return empty array when no doctors exist", async () => {
      const res = await request(app).get("/api/doctors");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all doctors", async () => {
      // Create test doctors
      await Doctor.create(sampleDoctor);
      await Doctor.create({
        doctorId: "987654321",
        firstName: "Jane",
        lastName: "Smith",
      });

      const res = await request(app).get("/api/doctors");

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty("doctorId");
      expect(res.body[0]).toHaveProperty("firstName");
      expect(res.body[0]).toHaveProperty("lastName");
    });
  });

  // GET /api/doctors/teudat-zehut/:id - Get doctor by Israeli ID
  describe("GET /api/doctors/teudat-zehut/:id", () => {
    it("should return a doctor by Israeli ID", async () => {
      const doctor = await Doctor.create(sampleDoctor);

      const res = await request(app).get(
        `/api/doctors/teudat-zehut/${sampleDoctor.doctorId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.doctorId).toBe(sampleDoctor.doctorId);
      expect(res.body.firstName).toBe(sampleDoctor.firstName);
      expect(res.body.lastName).toBe(sampleDoctor.lastName);
    });

    it("should return 404 if doctor not found", async () => {
      const res = await request(app).get("/api/doctors/teudat-zehut/000000000");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Doctor not found");
    });
  });

  // POST /api/doctors - Create a new doctor
  describe("POST /api/doctors", () => {
    it("should create a new doctor", async () => {
      const res = await request(app).post("/api/doctors").send(sampleDoctor);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("doctorId", sampleDoctor.doctorId);
      expect(res.body).toHaveProperty("firstName", sampleDoctor.firstName);
      expect(res.body).toHaveProperty("lastName", sampleDoctor.lastName);

      // Verify doctor was saved to database
      const savedDoctor = await Doctor.findOne({
        doctorId: sampleDoctor.doctorId,
      });
      expect(savedDoctor).not.toBeNull();
    });

    it("should not create doctor with duplicate ID", async () => {
      // First create a doctor
      await Doctor.create(sampleDoctor);

      // Try to create another with same ID
      const res = await request(app).post("/api/doctors").send(sampleDoctor);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "message",
        "Doctor with this ID already exists"
      );
    });

    it("should validate Israeli ID format", async () => {
      const res = await request(app).post("/api/doctors").send({
        doctorId: "12345", // Invalid - not 9 digits
        firstName: "John",
        lastName: "Doe",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });

    it("should require all mandatory fields", async () => {
      const res = await request(app).post("/api/doctors").send({
        doctorId: "123456789",
        // Missing firstName and lastName
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });
  });

  // PUT /api/doctors/:id - Update a doctor
  describe("PUT /api/doctors/:id", () => {
    it("should update an existing doctor", async () => {
      // Create a doctor first
      const doctor = await Doctor.create(sampleDoctor);

      const updatedInfo = {
        firstName: "Updated",
        lastName: "Name",
      };

      const res = await request(app)
        .put(`/api/doctors/${doctor._id}`)
        .send(updatedInfo);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("firstName", updatedInfo.firstName);
      expect(res.body).toHaveProperty("lastName", updatedInfo.lastName);
      expect(res.body).toHaveProperty("doctorId", sampleDoctor.doctorId); // ID should not change

      // Verify doctor was updated in database
      const updatedDoctor = await Doctor.findById(doctor._id);
      expect(updatedDoctor?.firstName).toBe(updatedInfo.firstName);
      expect(updatedDoctor?.lastName).toBe(updatedInfo.lastName);
    });

    it("should return 404 if doctor not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).put(`/api/doctors/${fakeId}`).send({
        firstName: "Updated",
        lastName: "Name",
      });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Doctor not found");
    });

    it("should validate update data", async () => {
      // Create a doctor first
      const doctor = await Doctor.create(sampleDoctor);

      const res = await request(app).put(`/api/doctors/${doctor._id}`).send({
        firstName: "", // Invalid - empty string
        lastName: "Name",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "Validation error");
    });
  });

  // DELETE /api/doctors/:id - Delete a doctor
  describe("DELETE /api/doctors/:id", () => {
    it("should delete an existing doctor", async () => {
      // Create a doctor first
      const doctor = await Doctor.create(sampleDoctor);

      const res = await request(app).delete(`/api/doctors/${doctor._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Doctor removed");

      // Verify doctor was removed from database
      const deletedDoctor = await Doctor.findById(doctor._id);
      expect(deletedDoctor).toBeNull();
    });

    it("should return 404 if doctor not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/doctors/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Doctor not found");
    });
  });
});
