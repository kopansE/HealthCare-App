// routes/scheduler.ts
import express from "express";
import type { Request, Response } from "express";
import SchedulerService from "../services/SchedulerService";
import OperationDay from "../models/OperationDay";
import Schedule from "../models/Schedule";
import Patient from "../models/Patient";
import Doctor from "../models/Doctors";
import { OpType } from "../models/Patient";

const router = express.Router();

// @route   GET /api/scheduler/available-patients
// @desc    Get patients available for scheduling
// @access  Public
router.get("/available-patients", async (req: Request, res: Response) => {
  try {
    const patients = await SchedulerService.getAvailablePatientsForScheduling();
    res.json(patients);
  } catch (error) {
    console.error("Error fetching available patients:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/scheduler/available-days
// @desc    Get operation days available for scheduling
// @access  Public
router.get("/available-days", async (req: Request, res: Response) => {
  try {
    const operationDays = await SchedulerService.getAvailableOperationDays();
    res.json(operationDays);
  } catch (error) {
    console.error("Error fetching available operation days:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/scheduler/day-schedule/:id
// @desc    Get schedule for a specific operation day
// @access  Public
router.get("/day-schedule/:id", async (req: Request, res: Response) => {
  try {
    const schedules = await SchedulerService.getDaySchedule(req.params.id);
    res.json(schedules);
  } catch (error) {
    console.error("Error fetching day schedule:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/scheduler/available-slots/:patientId
// @desc    Get available time slots for a patient
// @access  Public
router.get(
  "/available-slots/:patientId",
  async (req: Request, res: Response) => {
    try {
      const slots = await SchedulerService.getAvailableTimeSlotsForPatient(
        req.params.patientId
      );
      res.json(slots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/scheduler/next-available/:operationDayId/:patientId
// @desc    Get next available time for a patient on a specific operation day
// @access  Public
router.get(
  "/next-available/:operationDayId/:patientId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { operationDayId, patientId } = req.params;

      const patient = await Patient.findById(patientId);
      const operationDay = await OperationDay.findById(operationDayId);

      if (!patient || !operationDay) {
        return res.status(404).json({
          message: !patient ? "Patient not found" : "Operation day not found",
        });
      }

      const availability = await SchedulerService.calculateNextAvailableTime(
        operationDay,
        patient
      );

      res.json(availability);
    } catch (error) {
      console.error("Error calculating next available time:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   POST /api/scheduler/schedule-specific
// @desc    Schedule a patient for a specific operation day and time
// @access  Public
router.post(
  "/schedule-specific",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { patientId, doctorId, operationDayId, startTime } = req.body;

      if (!patientId || !doctorId || !operationDayId || !startTime) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const result = await SchedulerService.schedulePatient(
        patientId,
        doctorId,
        operationDayId,
        startTime
      );

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(201).json({
        message: result.message,
        schedule: result.schedule,
      });
    } catch (error) {
      console.error("Error scheduling specific operation:", error);
      res.status(500).json({
        message: `Server error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }
);

// @route   GET /api/scheduler/validate-day/:id
// @desc    Validate an operation day against business rules
// @access  Public
router.get("/validate-day/:id", async (req: Request, res: Response) => {
  try {
    const result = await SchedulerService.validateOperationDay(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Error validating operation day:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/scheduler/patient-schedule/:patientId
// @desc    Get a patient's scheduled operations
// @access  Public
router.get(
  "/patient-schedule/:patientId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const patientId = req.params.patientId;

      // Find the patient by ID
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Get all schedules for this patient
      const schedules = await Schedule.find({ patientId })
        .populate("operationDayId", "date location startHour endHour")
        .populate("doctorId", "doctorId firstName lastName")
        .sort({ "operationDayId.date": 1, startTime: 1 });

      res.json(schedules);
    } catch (error) {
      console.error("Error fetching patient schedule:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
