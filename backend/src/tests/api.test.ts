// tests/api.test.ts
import request from "supertest";
import mongoose from "mongoose";
import app from "../index";
import Doctor from "../models/Doctors";
import Patient from "../models/Patient";
import OperationDay from "../models/OperationDay";
import Schedule from "../models/Schedule";
import dotenv from "dotenv";

dotenv.config();

// Test data
const testDoctor = {
  doctorId: "123456789",
  firstName: "Test",
  lastName: "Doctor",
};

const testPatient = {
  patientId: "987654321",
  firstName: "Test",
  lastName: "Patient",
  HCProvider: "maccabi",
  phone: "0501234567",
  isSetForOp: false,
  operationType: "colono",
  preparationType: "piko",
};

const testOperationDay = {
  date: new Date().toISOString(),
  location: "asotaHolon",
  startHour: "09:00",
  endHour: "17:00",
};

// Connect to MongoDB before tests
beforeAll(async () => {
  const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/test";
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for testing");
    console.log(process.env.MONGODB_URI); // Check if the connection string is correct

    // Clear test data
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await OperationDay.deleteMany({});
    await Schedule.deleteMany({});
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
});

// Disconnect from MongoDB after tests
afterAll(async () => {
  await mongoose.connection.close();
  console.log("Disconnected from MongoDB");
});

// Doctor API Tests
describe("Doctor API", () => {
  let createdDoctorId: string;

  // Test creating a doctor
  test("POST /api/doctors - Create a doctor", async () => {
    const response = await request(app).post("/api/doctors").send(testDoctor);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.doctorId).toBe(testDoctor.doctorId);

    createdDoctorId = response.body._id;
  });

  // Test getting all doctors
  test("GET /api/doctors - Get all doctors", async () => {
    const response = await request(app).get("/api/doctors");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test getting a doctor by ID
  test("GET /api/doctors/teudat-zehut/:id - Get doctor by Teudat Zehut", async () => {
    const response = await request(app).get(
      `/api/doctors/teudat-zehut/${testDoctor.doctorId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.doctorId).toBe(testDoctor.doctorId);
  });

  // Test updating a doctor
  test("PUT /api/doctors/:id - Update doctor", async () => {
    const updatedData = {
      firstName: "Updated",
      lastName: "DoctorName",
    };

    const response = await request(app)
      .put(`/api/doctors/${createdDoctorId}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe(updatedData.firstName);
    expect(response.body.lastName).toBe(updatedData.lastName);
  });

  // Test deleting a doctor will be the last test for Doctor
});

// Patient API Tests
describe("Patient API", () => {
  let createdPatientId: string;

  // Test creating a patient
  test("POST /api/patients - Create a patient", async () => {
    const response = await request(app).post("/api/patients").send(testPatient);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.patientId).toBe(testPatient.patientId);

    createdPatientId = response.body._id;
  });

  // Test getting all patients
  test("GET /api/patients - Get all patients", async () => {
    const response = await request(app).get("/api/patients");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test getting a patient by ID
  test("GET /api/patients/:id - Get patient by ID", async () => {
    const response = await request(app).get(
      `/api/patients/${createdPatientId}`
    );

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(createdPatientId);
  });

  // Test getting a patient by Teudat Zehut
  test("GET /api/patients/teudat-zehut/:id - Get patient by Teudat Zehut", async () => {
    const response = await request(app).get(
      `/api/patients/teudat-zehut/${testPatient.patientId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.patientId).toBe(testPatient.patientId);
  });

  // Test updating a patient
  test("PUT /api/patients/:id - Update patient", async () => {
    const updatedData = {
      firstName: "Updated",
      lastName: "PatientName",
      additionalInfo: "Test additional information",
    };

    const response = await request(app)
      .put(`/api/patients/${createdPatientId}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe(updatedData.firstName);
    expect(response.body.lastName).toBe(updatedData.lastName);
    expect(response.body.additionalInfo).toBe(updatedData.additionalInfo);
  });

  // Test deleting a patient will be the last test for Patient
});

// OperationDay API Tests
describe("OperationDay API", () => {
  let createdOperationDayId: string;

  // Test creating an operation day
  test("POST /api/operationday - Create an operation day", async () => {
    const response = await request(app)
      .post("/api/operationday")
      .send(testOperationDay);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.location).toBe(testOperationDay.location);

    createdOperationDayId = response.body._id;
  });

  // Test getting all operation days
  test("GET /api/operationday - Get all operation days", async () => {
    const response = await request(app).get("/api/operationday");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test getting an operation day by ID
  test("GET /api/operationday/:id - Get operation day by ID", async () => {
    const response = await request(app).get(
      `/api/operationday/${createdOperationDayId}`
    );

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(createdOperationDayId);
  });

  // Test getting operation days by date
  test("GET /api/operationday/date/:date - Get operation days by date", async () => {
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const response = await request(app).get(`/api/operationday/date/${today}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  // Test updating an operation day
  test("PUT /api/operationday/:id - Update operation day", async () => {
    const updatedData = {
      startHour: "10:00",
      endHour: "18:00",
    };

    const response = await request(app)
      .put(`/api/operationday/${createdOperationDayId}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.operationDay.startHour).toBe(updatedData.startHour);
    expect(response.body.operationDay.endHour).toBe(updatedData.endHour);
    expect(response.body).toHaveProperty("validation");
  });

  // Test validating an operation day
  test("GET /api/scheduler/validate-day/:id - Validate operation day", async () => {
    const response = await request(app).get(
      `/api/scheduler/validate-day/${createdOperationDayId}`
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("isValid");
    expect(response.body).toHaveProperty("message");
  });

  // Test deleting an operation day will be in the final cleanup
});

// Scheduler API Tests
describe("Scheduler API", () => {
  let doctorId: string;
  let patientId: string;
  let operationDayId: string;
  let scheduleId: string;

  // Setup: Create necessary entities for scheduler tests
  beforeAll(async () => {
    // Create a doctor
    const doctorResponse = await request(app).post("/api/doctors").send({
      doctorId: "111222333",
      firstName: "Scheduler",
      lastName: "TestDoctor",
    });
    doctorId = doctorResponse.body._id;

    // Create a patient
    const patientResponse = await request(app).post("/api/patients").send({
      patientId: "444555666",
      firstName: "Scheduler",
      lastName: "TestPatient",
      HCProvider: "maccabi",
      phone: "0502345678",
      isSetForOp: false,
      operationType: "gastro",
      preparationType: "noPrep",
    });
    patientId = patientResponse.body._id;

    // Create an operation day
    const opDayResponse = await request(app).post("/api/operationday").send({
      date: new Date().toISOString(),
      location: "asotaHolon",
      startHour: "09:00",
      endHour: "17:00",
    });
    operationDayId = opDayResponse.body._id;
  });

  // Test scheduling a patient
  test("POST /api/scheduler/schedule-patient - Schedule a patient", async () => {
    const response = await request(app)
      .post("/api/scheduler/schedule-patient")
      .send({
        patientId,
        doctorId,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("schedule");

    // Store schedule ID for later tests
    scheduleId = response.body.schedule._id;
  });

  // Test getting available patients
  test("GET /api/scheduler/available-patients - Get available patients", async () => {
    const response = await request(app).get(
      "/api/scheduler/available-patients"
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  // Test getting day schedule
  test("GET /api/scheduler/day-schedule/:id - Get schedule for a day", async () => {
    const response = await request(app).get(
      `/api/scheduler/day-schedule/${operationDayId}`
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBeGreaterThan(0);
  });

  // Test getting patient schedule
  test("GET /api/scheduler/patient-schedule/:patientId - Get patient schedule", async () => {
    const response = await request(app).get(
      `/api/scheduler/patient-schedule/${patientId}`
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
  });

  // Test batch scheduling
  test("POST /api/scheduler/batch-schedule - Batch schedule patients", async () => {
    // Create additional unscheduled patients first
    await request(app).post("/api/patients").send({
      patientId: "777888999",
      firstName: "Batch",
      lastName: "Patient1",
      HCProvider: "maccabi",
      phone: "0503456789",
      isSetForOp: false,
      operationType: "sigmo",
    });

    await request(app).post("/api/patients").send({
      patientId: "999888777",
      firstName: "Batch",
      lastName: "Patient2",
      HCProvider: "maccabi",
      phone: "0504567890",
      isSetForOp: false,
      operationType: "colono",
    });

    const response = await request(app)
      .post("/api/scheduler/batch-schedule")
      .send({
        operationDayId,
        doctorId,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("success");
    expect(response.body).toHaveProperty("scheduled");
    expect(response.body).toHaveProperty("failed");
  });
});

// Final cleanup - Delete all created entities
describe("Cleanup", () => {
  test("Delete all test entities", async () => {
    // Get all created entities
    const doctors = await Doctor.find({});
    const patients = await Patient.find({});
    const operationDays = await OperationDay.find({});

    // Delete all schedules first (due to foreign key constraints)
    const scheduleDeleteResponse = await Schedule.deleteMany({});
    expect(scheduleDeleteResponse.acknowledged).toBeTruthy();

    // Delete all doctors
    for (const doctor of doctors) {
      const response = await request(app).delete(`/api/doctors/${doctor._id}`);
      expect(response.status).toBe(200);
    }

    // Delete all patients
    for (const patient of patients) {
      const response = await request(app).delete(
        `/api/patients/${patient._id}`
      );
      expect(response.status).toBe(200);
    }

    // Delete all operation days
    for (const opDay of operationDays) {
      const response = await request(app).delete(
        `/api/operationday/${opDay._id}`
      );
      expect(response.status).toBe(200);
    }

    // Verify all entities are deleted
    const remainingDoctors = await Doctor.find({});
    const remainingPatients = await Patient.find({});
    const remainingOperationDays = await OperationDay.find({});
    const remainingSchedules = await Schedule.find({});

    expect(remainingDoctors.length).toBe(0);
    expect(remainingPatients.length).toBe(0);
    expect(remainingOperationDays.length).toBe(0);
    expect(remainingSchedules.length).toBe(0);
  });
});
