// routes/scheduler.ts
import express from "express";
import type { Request, Response } from "express";
import SchedulerService from "../services/SchedulerService";
import OperationDay from "../models/OperationDay";
import Schedule from "../models/Schedule";
import Patient from "../models/Patient";

const router = express.Router();

// @route   POST /api/scheduler/schedule-patient
// @desc    Schedule a patient for an operation
// @access  Public
router.post(
  "/schedule-patient",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { patientId, doctorId } = req.body;

      if (!patientId || !doctorId) {
        return res
          .status(400)
          .json({ message: "Patient ID and Doctor ID are required" });
      }

      const result = await SchedulerService.findSuitableOperationDay(
        patientId,
        doctorId
      );

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(201).json({
        message: result.message,
        schedule: result.schedule,
      });
    } catch (error) {
      console.error("Error scheduling patient:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   POST /api/scheduler/batch-schedule
// @desc    Schedule multiple patients for an operation day
// @access  Public
router.post(
  "/batch-schedule",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { operationDayId, doctorId } = req.body;

      if (!operationDayId || !doctorId) {
        return res
          .status(400)
          .json({ message: "Operation Day ID and Doctor ID are required" });
      }

      const result = await SchedulerService.batchScheduleForDay(
        operationDayId,
        doctorId
      );

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("Error batch scheduling:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

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

// @route   POST /api/scheduler/reschedule
// @desc    Reschedule a patient's operation
// @access  Public
router.post(
  "/reschedule",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { scheduleId, newOperationDayId, newStartTime } = req.body;

      if (!scheduleId || !newOperationDayId || !newStartTime) {
        return res.status(400).json({
          message:
            "Schedule ID, new operation day ID, and new start time are required",
        });
      }

      // Find the existing schedule
      const schedule = await Schedule.findById(scheduleId);

      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }

      // Find the new operation day
      const operationDay = await OperationDay.findById(newOperationDayId);
      if (!operationDay) {
        return res.status(404).json({ message: "Operation day not found" });
      }

      // Find the patient to get operation type
      const patient = await Patient.findById(schedule.patientId);
      const operationType = patient?.operationType;

      if (!operationType) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Calculate end time based on operation type
      const durationMinutes = getOperationDuration(operationType);

      const startMinutes = timeToMinutes(newStartTime);
      const endMinutes = startMinutes + durationMinutes;
      const newEndTime = minutesToTime(endMinutes);

      // Check if the new time is within the operation day hours
      const dayStartMinutes = timeToMinutes(operationDay.startHour);
      const dayEndMinutes = timeToMinutes(operationDay.endHour);

      if (startMinutes < dayStartMinutes || endMinutes > dayEndMinutes) {
        return res.status(400).json({
          message: "The requested time slot is outside the operation day hours",
        });
      }

      // Check for conflicts with other schedules
      const existingSchedules = await Schedule.find({
        operationDayId: newOperationDayId,
        _id: { $ne: scheduleId }, // Exclude the current schedule
      });

      const hasConflict = existingSchedules.some((existingSchedule) => {
        const existingStart = timeToMinutes(existingSchedule.startTime);
        const existingEnd = timeToMinutes(existingSchedule.endTime);

        return (
          (startMinutes >= existingStart && startMinutes < existingEnd) || // Start time conflicts
          (endMinutes > existingStart && endMinutes <= existingEnd) || // End time conflicts
          (startMinutes <= existingStart && endMinutes >= existingEnd) // Encompasses another schedule
        );
      });

      if (hasConflict) {
        return res.status(400).json({
          message: "The requested time slot conflicts with another schedule",
        });
      }

      // Update the schedule
      schedule.operationDayId = newOperationDayId;
      schedule.startTime = newStartTime;
      schedule.endTime = newEndTime;

      await schedule.save();

      res.json({
        message: "Operation rescheduled successfully",
        schedule,
      });
    } catch (error) {
      console.error("Error rescheduling operation:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Helper functions for time conversion
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

// Helper to calculate operation duration in minutes
function getOperationDuration(opType: string): number {
  switch (opType) {
    case "double":
      return 45;
    case "colono":
      return 30;
    case "gastro":
    case "sigmo":
      return 15;
    default:
      return 30; // Default duration
  }
}

export default router;
