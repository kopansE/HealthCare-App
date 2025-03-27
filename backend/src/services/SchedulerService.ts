// services/SchedulerService.ts
import mongoose from "mongoose";
import Patient, { OpType, HCProvider } from "../models/Patient";
import OperationDay, { Location } from "../models/OperationDay";
import Schedule from "../models/Schedule";
import Doctor from "../models/Doctors";

// Helper class to define location constraints
class LocationConstraints {
  // Get minimum operations required for a location
  static getMinOperations(location: Location): number {
    switch (location) {
      case Location.ASOTA_HOLON:
        return 8;
      case Location.ASOTA_RAMAT_HAHAYAL:
        return 12;
      case Location.ASOTA_CALANIOT:
        return 12; // Exactly 12
      case Location.BEST_MEDICAL:
      default:
        return 0; // No minimum
    }
  }

  // Get maximum operations allowed for a location
  static getMaxOperations(location: Location): number {
    switch (location) {
      case Location.ASOTA_CALANIOT:
        return 12; // Exactly 12
      default:
        return Infinity; // No maximum
    }
  }

  // Get max colonoscopies allowed for a location
  static getMaxColono(location: Location): number {
    switch (location) {
      case Location.ASOTA_CALANIOT:
        return 7;
      default:
        return Infinity; // No maximum
    }
  }

  // Check if health provider is allowed at location
  static isHealthProviderAllowed(
    location: Location,
    provider: HCProvider
  ): boolean {
    switch (location) {
      case Location.BEST_MEDICAL:
        return provider === HCProvider.LEUMIT;
      case Location.ASOTA_HOLON:
        return provider === HCProvider.MACCABI;
      case Location.ASOTA_RAMAT_HAHAYAL:
      case Location.ASOTA_CALANIOT:
        return (
          provider === HCProvider.MACCABI || provider === HCProvider.LEUMIT
        );
      default:
        return true;
    }
  }
}

// Helper to calculate operation duration in minutes
function getOperationDuration(opType: OpType): number {
  switch (opType) {
    case OpType.DOUBLE:
      return 45;
    case OpType.COLONO:
      return 30;
    case OpType.GASTRO:
    case OpType.SIGMO:
      return 15;
    default:
      return 30; // Default duration
  }
}

// Convert HH:MM string to minutes since midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Convert minutes since midnight to HH:MM string
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

export class SchedulerService {
  // Find suitable operation day for a patient
  static async findSuitableOperationDay(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; message: string; schedule?: any }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get patient and doctor details
      const patient = await Patient.findById(patientId).session(session);
      const doctor = await Doctor.findById(doctorId).session(session);

      if (!patient) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: "Patient not found" };
      }

      if (!doctor) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: "Doctor not found" };
      }

      if (!patient.operationType) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "Patient operation type not specified",
        };
      }

      // Get operation duration
      const operationDuration = getOperationDuration(
        patient.operationType as OpType
      );

      // Find upcoming operation days (starting from today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const operationDays = await OperationDay.find({
        date: { $gte: today },
      })
        .sort({ date: 1 })
        .session(session);

      if (operationDays.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "No upcoming operation days available",
        };
      }

      // Try to find a suitable slot in each operation day
      for (const opDay of operationDays) {
        // Check if patient's health provider is allowed at this location
        if (
          !LocationConstraints.isHealthProviderAllowed(
            opDay.location as Location,
            patient.HCProvider as HCProvider
          )
        ) {
          continue; // Skip this location, patient's provider not allowed
        }

        // Get existing schedules for this operation day
        const existingSchedules = await Schedule.find({
          operationDayId: opDay._id,
        })
          .sort({ startTime: 1 })
          .session(session);

        // Count total operations and colonoscopies
        const totalOperations = existingSchedules.length;
        const colonoCount = existingSchedules.filter(
          (s) =>
            s.operationType === OpType.COLONO ||
            s.operationType === OpType.DOUBLE
        ).length;

        // Check if we've reached the maximum for this location
        if (
          totalOperations >=
          LocationConstraints.getMaxOperations(opDay.location as Location)
        ) {
          continue; // Maximum operations reached for this day
        }

        // Check maximum colonoscopies
        if (
          (patient.operationType === OpType.COLONO ||
            patient.operationType === OpType.DOUBLE) &&
          colonoCount >=
            LocationConstraints.getMaxColono(opDay.location as Location)
        ) {
          continue; // Maximum colonoscopies reached for this day
        }

        // Calculate available time slots
        const dayStartMinutes = timeToMinutes(opDay.startHour);
        const dayEndMinutes = timeToMinutes(opDay.endHour);

        // Create an array of busy time slots
        const busySlots: { start: number; end: number }[] =
          existingSchedules.map((schedule) => ({
            start: timeToMinutes(schedule.startTime),
            end: timeToMinutes(schedule.endTime),
          }));

        // Sort busy slots by start time
        busySlots.sort((a, b) => a.start - b.start);

        // Find the first available slot
        let currentTime = dayStartMinutes;
        let slotFound = false;
        let slotStart = 0;

        // Check each potential slot
        while (currentTime + operationDuration <= dayEndMinutes) {
          // Check if this time slot conflicts with any busy slot
          const conflictFound = busySlots.some(
            (slot) =>
              (currentTime >= slot.start && currentTime < slot.end) || // Start time conflicts
              (currentTime + operationDuration > slot.start &&
                currentTime + operationDuration <= slot.end) || // End time conflicts
              (currentTime <= slot.start &&
                currentTime + operationDuration >= slot.end) // Encompasses a busy slot
          );

          if (!conflictFound) {
            // We found an available slot
            slotFound = true;
            slotStart = currentTime;
            break;
          }

          // Move to the next potential starting time (try each minute)
          currentTime += 1;
        }

        if (slotFound) {
          // We found a suitable slot in this operation day
          const schedule = new Schedule({
            patientId: patient._id,
            doctorId: doctor._id,
            operationDayId: opDay._id,
            operationType: patient.operationType,
            startTime: minutesToTime(slotStart),
            endTime: minutesToTime(slotStart + operationDuration),
            notes: patient.additionalInfo || "",
          });

          // Save the schedule
          await schedule.save({ session });

          // Update patient's isSetForOp status
          patient.isSetForOp = true;
          await patient.save({ session });

          await session.commitTransaction();
          session.endSession();

          return {
            success: true,
            message: "Operation scheduled successfully",
            schedule: schedule,
          };
        }
      }

      // If we get here, we couldn't find a suitable slot in any operation day
      await session.abortTransaction();
      session.endSession();
      return {
        success: false,
        message:
          "No suitable operation slot found in any available operation day",
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error in scheduler service:", error);
      return {
        success: false,
        message: `Scheduling error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  // Check if an operation day meets minimum requirements
  static async validateOperationDay(
    operationDayId: string
  ): Promise<{ isValid: boolean; message: string }> {
    try {
      const operationDay = await OperationDay.findById(operationDayId);
      if (!operationDay) {
        return { isValid: false, message: "Operation day not found" };
      }

      const schedules = await Schedule.find({ operationDayId });
      const totalOperations = schedules.length;
      const colonoCount = schedules.filter(
        (s) =>
          s.operationType === OpType.COLONO || s.operationType === OpType.DOUBLE
      ).length;

      // Check minimum operations requirement
      const minOperations = LocationConstraints.getMinOperations(
        operationDay.location as Location
      );
      if (totalOperations < minOperations) {
        return {
          isValid: false,
          message: `Minimum ${minOperations} operations required for this location (current: ${totalOperations})`,
        };
      }

      // Check maximum operations
      const maxOperations = LocationConstraints.getMaxOperations(
        operationDay.location as Location
      );
      if (totalOperations > maxOperations) {
        return {
          isValid: false,
          message: `Maximum ${maxOperations} operations allowed for this location (current: ${totalOperations})`,
        };
      }

      // Check maximum colonoscopies for Calaniot Ashdod
      if (operationDay.location === Location.ASOTA_CALANIOT) {
        const maxColono = LocationConstraints.getMaxColono(
          Location.ASOTA_CALANIOT
        );
        if (colonoCount > maxColono) {
          return {
            isValid: false,
            message: `Maximum ${maxColono} colonoscopies allowed for Calaniot Ashdod (current: ${colonoCount})`,
          };
        }
      }

      return { isValid: true, message: "Operation day is valid" };
    } catch (error) {
      console.error("Error validating operation day:", error);
      return {
        isValid: false,
        message: `Validation error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  // Get available patients for scheduling
  static async getAvailablePatientsForScheduling(): Promise<any[]> {
    try {
      // Get patients who need an operation but aren't scheduled yet
      const patients = await Patient.find({
        operationType: { $exists: true, $ne: null },
        isSetForOp: false,
      }).sort({ visitDate: 1 });

      return patients;
    } catch (error) {
      console.error("Error getting available patients:", error);
      return [];
    }
  }

  // Get operations schedule for a specific day
  static async getDaySchedule(operationDayId: string): Promise<any[]> {
    try {
      const schedules = await Schedule.find({ operationDayId })
        .populate("patientId", "patientId firstName lastName phone HCProvider")
        .populate("doctorId", "doctorId firstName lastName")
        .sort({ startTime: 1 });

      return schedules;
    } catch (error) {
      console.error("Error getting day schedule:", error);
      return [];
    }
  }

  // Batch scheduling feature - schedule multiple patients at once for an operation day
  static async batchScheduleForDay(
    operationDayId: string,
    doctorId: string
  ): Promise<{
    success: boolean;
    message: string;
    scheduled: number;
    failed: number;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const operationDay = await OperationDay.findById(operationDayId).session(
        session
      );
      if (!operationDay) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "Operation day not found",
          scheduled: 0,
          failed: 0,
        };
      }

      const doctor = await Doctor.findById(doctorId).session(session);
      if (!doctor) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "Doctor not found",
          scheduled: 0,
          failed: 0,
        };
      }

      // Get available patients
      const patients = await Patient.find({
        operationType: { $exists: true, $ne: null },
        isSetForOp: false,
      })
        .sort({ visitDate: 1 })
        .session(session);

      if (patients.length === 0) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "No patients available for scheduling",
          scheduled: 0,
          failed: 0,
        };
      }

      // Get existing schedules for this day
      const existingSchedules = await Schedule.find({ operationDayId })
        .sort({ startTime: 1 })
        .session(session);

      // Calculate available times
      const dayStartMinutes = timeToMinutes(operationDay.startHour);
      const dayEndMinutes = timeToMinutes(operationDay.endHour);

      // Create an array of busy time slots
      const busySlots: { start: number; end: number }[] = existingSchedules.map(
        (schedule) => ({
          start: timeToMinutes(schedule.startTime),
          end: timeToMinutes(schedule.endTime),
        })
      );

      // Sort busy slots by start time
      busySlots.sort((a, b) => a.start - b.start);

      // Count operations and colonoscopies
      let totalOperations = existingSchedules.length;
      let colonoCount = existingSchedules.filter(
        (s) =>
          s.operationType === OpType.COLONO || s.operationType === OpType.DOUBLE
      ).length;

      const maxOperations = LocationConstraints.getMaxOperations(
        operationDay.location as Location
      );
      const maxColono = LocationConstraints.getMaxColono(
        operationDay.location as Location
      );

      // Try to schedule each patient
      let scheduledCount = 0;
      let failedCount = 0;

      for (const patient of patients) {
        // Check if patient's health provider is allowed at this location
        if (
          !LocationConstraints.isHealthProviderAllowed(
            operationDay.location as Location,
            patient.HCProvider as HCProvider
          )
        ) {
          failedCount++;
          continue; // Skip this patient
        }

        // Check if we've reached the maximum operations
        if (totalOperations >= maxOperations) {
          failedCount++;
          continue; // Maximum operations reached
        }

        // Check if we've reached maximum colonoscopies
        if (
          (patient.operationType === OpType.COLONO ||
            patient.operationType === OpType.DOUBLE) &&
          colonoCount >= maxColono
        ) {
          failedCount++;
          continue; // Maximum colonoscopies reached
        }

        // Get operation duration
        const operationDuration = getOperationDuration(
          patient.operationType as OpType
        );

        // Find an available slot
        let currentTime = dayStartMinutes;
        let slotFound = false;
        let slotStart = 0;

        while (currentTime + operationDuration <= dayEndMinutes) {
          // Check if this time slot conflicts with any busy slot
          const conflictFound = busySlots.some(
            (slot) =>
              (currentTime >= slot.start && currentTime < slot.end) || // Start time conflicts
              (currentTime + operationDuration > slot.start &&
                currentTime + operationDuration <= slot.end) || // End time conflicts
              (currentTime <= slot.start &&
                currentTime + operationDuration >= slot.end) // Encompasses a busy slot
          );

          if (!conflictFound) {
            // We found an available slot
            slotFound = true;
            slotStart = currentTime;
            break;
          }

          // Move to the next potential starting time
          currentTime += 1;
        }

        if (slotFound) {
          // Create a new schedule entry
          const schedule = new Schedule({
            patientId: patient._id,
            doctorId: doctor._id,
            operationDayId: operationDay._id,
            operationType: patient.operationType,
            startTime: minutesToTime(slotStart),
            endTime: minutesToTime(slotStart + operationDuration),
            notes: patient.additionalInfo || "",
          });

          // Save the schedule
          await schedule.save({ session });

          // Update patient status
          patient.isSetForOp = true;
          await patient.save({ session });

          // Update counters
          scheduledCount++;
          totalOperations++;
          if (
            patient.operationType === OpType.COLONO ||
            patient.operationType === OpType.DOUBLE
          ) {
            colonoCount++;
          }

          // Add this slot to busy slots for future iterations
          busySlots.push({
            start: slotStart,
            end: slotStart + operationDuration,
          });
          busySlots.sort((a, b) => a.start - b.start);
        } else {
          failedCount++;
        }
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        message: `Scheduled ${scheduledCount} patients, ${failedCount} could not be scheduled`,
        scheduled: scheduledCount,
        failed: failedCount,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error in batch scheduling:", error);
      return {
        success: false,
        message: `Batch scheduling error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        scheduled: 0,
        failed: 0,
      };
    }
  }
}

export default SchedulerService;
