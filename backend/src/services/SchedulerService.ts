// services/SchedulerService.ts
import mongoose from "mongoose";
import Patient, { OpType, HCProvider, IPatient } from "../models/Patient";
import OperationDay, { Location, IOperationDay } from "../models/OperationDay";
import Schedule, { ISchedule } from "../models/Schedule";
import Doctor, { IDoctor } from "../models/Doctors";

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

export class SchedulerService {
  // Helper to calculate operation duration in minutes
  static getOperationDuration(opType: OpType): number {
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
  static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  // Convert minutes since midnight to HH:MM string
  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  }

  // Check if health provider is allowed at location
  static isHealthProviderAllowed(location: string, provider: string): boolean {
    return LocationConstraints.isHealthProviderAllowed(
      location as Location,
      provider as HCProvider
    );
  }

  // Get available patients for scheduling
  static async getAvailablePatientsForScheduling(): Promise<IPatient[]> {
    try {
      // Get patients who need an operation but aren't scheduled yet
      const patients = await Patient.find({
        operationType: { $exists: true, $ne: null },
        isSetForOp: false,
        doesntWantSurgery: false,
      }).sort({ visitDate: 1 });

      return patients;
    } catch (error) {
      console.error("Error getting available patients:", error);
      return [];
    }
  }

  // Get all available (not locked) operation days
  static async getAvailableOperationDays(): Promise<IOperationDay[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const operationDays = await OperationDay.find({
        date: { $gte: today },
        isLocked: { $ne: true },
      }).sort({ date: 1 });

      return operationDays;
    } catch (error) {
      console.error("Error getting available operation days:", error);
      return [];
    }
  }

  // Get operations schedule for a specific day
  static async getDaySchedule(operationDayId: string): Promise<ISchedule[]> {
    try {
      const schedules = await Schedule.find({ operationDayId })
        .populate(
          "patientId",
          "patientId firstName lastName phone HCProvider operationType"
        )
        .populate("doctorId", "doctorId firstName lastName")
        .sort({ startTime: 1 });

      return schedules;
    } catch (error) {
      console.error("Error getting day schedule:", error);
      return [];
    }
  }

  // Calculate next available time slot for a patient on a given operation day
  static async calculateNextAvailableTime(
    operationDay: IOperationDay,
    patient: IPatient
  ): Promise<{ time: string | null; message?: string }> {
    try {
      if (!patient.operationType) {
        return { time: null, message: "Operation type not specified" };
      }

      // Check if patient's health provider is allowed at this location
      if (
        !LocationConstraints.isHealthProviderAllowed(
          operationDay.location as Location,
          patient.HCProvider as HCProvider
        )
      ) {
        return {
          time: null,
          message: "Patient's health provider is not allowed at this location",
        };
      }

      // Get existing schedules for this day
      const schedules = await Schedule.find({
        operationDayId: operationDay._id,
      });

      // Check if adding a colonoscopy would exceed limits for Asota Calaniot
      if (
        operationDay.location === Location.ASOTA_CALANIOT &&
        (patient.operationType === OpType.COLONO ||
          patient.operationType === OpType.DOUBLE)
      ) {
        const colonoCount = schedules.filter(
          (s) =>
            s.operationType === OpType.COLONO ||
            s.operationType === OpType.DOUBLE
        ).length;

        if (
          colonoCount >=
          LocationConstraints.getMaxColono(Location.ASOTA_CALANIOT)
        ) {
          return {
            time: null,
            message:
              "Maximum number of colonoscopies reached for this location",
          };
        }
      }

      // Check if total operations would exceed maximum
      if (
        schedules.length >=
        LocationConstraints.getMaxOperations(operationDay.location as Location)
      ) {
        return {
          time: null,
          message: "Maximum number of operations reached for this day",
        };
      }

      // Get operation duration
      const operationDuration = this.getOperationDuration(
        patient.operationType as OpType
      );

      // Calculate day start/end in minutes
      const dayStartMinutes = this.timeToMinutes(operationDay.startHour);
      const dayEndMinutes = this.timeToMinutes(operationDay.endHour);

      // Map existing schedules to time slots
      const busySlots = schedules
        .map((schedule) => ({
          start: this.timeToMinutes(schedule.startTime),
          end: this.timeToMinutes(schedule.endTime),
        }))
        .sort((a, b) => a.start - b.start);

      // Find first available slot
      let currentTime = dayStartMinutes;

      while (currentTime + operationDuration <= dayEndMinutes) {
        // Check for conflicts
        const conflictFound = busySlots.some(
          (slot) =>
            (currentTime >= slot.start && currentTime < slot.end) || // Start time conflicts
            (currentTime + operationDuration > slot.start &&
              currentTime + operationDuration <= slot.end) || // End time conflicts
            (currentTime <= slot.start &&
              currentTime + operationDuration >= slot.end) // Encompasses a busy slot
        );

        if (!conflictFound) {
          return { time: this.minutesToTime(currentTime) };
        }

        // Try next minute
        currentTime += 1;
      }

      return {
        time: null,
        message: "No available time slot found in this day",
      };
    } catch (error) {
      console.error("Error calculating next available time:", error);
      return {
        time: null,
        message: `Error calculating availability: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  // Calculate availability for multiple operation days for a patient
  static async calculateAvailabilityForDays(patient: IPatient): Promise<
    Array<{
      operationDay: IOperationDay;
      availableTime: string | null;
      message?: string;
    }>
  > {
    try {
      const availableDays = await this.getAvailableOperationDays();
      const result = [];

      for (const day of availableDays) {
        const availability = await this.calculateNextAvailableTime(
          day,
          patient
        );
        result.push({
          operationDay: day,
          availableTime: availability.time,
          message: availability.message,
        });
      }

      return result;
    } catch (error) {
      console.error("Error calculating availability for days:", error);
      return [];
    }
  }

  // Check if an operation day meets requirements and lock it if needed
  static async checkAndLockOperationDay(
    operationDayId: string | mongoose.Types.ObjectId
  ): Promise<void> {
    // Convert to string if it's an ObjectId
    const idString =
      typeof operationDayId === "string"
        ? operationDayId
        : operationDayId.toString();
    try {
      const operationDay = await OperationDay.findById(operationDayId);
      if (!operationDay || operationDay.isLocked) {
        return; // Already locked or not found
      }

      const schedules = await Schedule.find({ operationDayId });
      const totalOperations = schedules.length;
      const colonoCount = schedules.filter(
        (s) =>
          s.operationType === OpType.COLONO || s.operationType === OpType.DOUBLE
      ).length;

      const location = operationDay.location as Location;
      const minOperations = LocationConstraints.getMinOperations(location);
      const maxOperations = LocationConstraints.getMaxOperations(location);
      const maxColono = LocationConstraints.getMaxColono(location);

      // Check if we need to lock the operation day
      let shouldLock = false;

      // Case 1: We've reached maximum operations
      if (totalOperations >= maxOperations) {
        shouldLock = true;
      }

      // Case 2: For Asota Calaniot we need special handling
      if (location === Location.ASOTA_CALANIOT) {
        // Lock if we've reached exactly 12 operations total
        if (totalOperations >= 12) {
          shouldLock = true;
        }
        // Lock if we've reached 7 colonoscopies AND there are already 5 or more other operations
        // (meaning we can't add more operations without exceeding the 12 operation limit)
        else if (colonoCount >= 7 && totalOperations - colonoCount >= 5) {
          shouldLock = true;
        }
        // Otherwise, don't lock yet
      }

      if (shouldLock) {
        operationDay.isLocked = true;
        await operationDay.save();
        console.log(
          `Operation day ${operationDayId} has been automatically locked due to reaching capacity limits.`
        );
      }
    } catch (error) {
      console.error("Error checking operation day lock status:", error);
    }
  }

  // Schedule a patient for a specific operation day and time
  static async schedulePatient(
    patientId: string,
    doctorId: string,
    operationDayId: string,
    startTime: string
  ): Promise<{ success: boolean; message: string; schedule?: ISchedule }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get patient details
      const patient = await Patient.findById(patientId).session(session);
      if (!patient) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: "Patient not found" };
      }

      // Get doctor details
      const doctor = await Doctor.findById(doctorId).session(session);
      if (!doctor) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: "Doctor not found" };
      }

      // Get operation day details
      const operationDay = await OperationDay.findById(operationDayId).session(
        session
      );
      if (!operationDay) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: "Operation day not found" };
      }

      // Check if operation day is locked
      if (operationDay.isLocked) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: "Operation day is locked" };
      }

      // Validate health provider constraint
      const isHealthProviderAllowed =
        LocationConstraints.isHealthProviderAllowed(
          operationDay.location as Location,
          patient.HCProvider as HCProvider
        );

      if (!isHealthProviderAllowed) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "Patient's health provider is not allowed at this location",
        };
      }

      // Calculate operation duration
      if (!patient.operationType) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "Patient operation type not specified",
        };
      }

      const operationDuration = this.getOperationDuration(
        patient.operationType as OpType
      );

      // Calculate end time
      const startMinutes = this.timeToMinutes(startTime);
      const endMinutes = startMinutes + operationDuration;
      const endTime = this.minutesToTime(endMinutes);

      // Validate operation day time range
      const dayStartMinutes = this.timeToMinutes(operationDay.startHour);
      const dayEndMinutes = this.timeToMinutes(operationDay.endHour);

      if (startMinutes < dayStartMinutes || endMinutes > dayEndMinutes) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "Operation time is outside operation day hours",
        };
      }

      // Check for conflicts
      const existingSchedules = await Schedule.find({ operationDayId }).session(
        session
      );

      const hasConflict = existingSchedules.some((schedule) => {
        const scheduleStartMinutes = this.timeToMinutes(schedule.startTime);
        const scheduleEndMinutes = this.timeToMinutes(schedule.endTime);

        return (
          (startMinutes >= scheduleStartMinutes &&
            startMinutes < scheduleEndMinutes) ||
          (endMinutes > scheduleStartMinutes &&
            endMinutes <= scheduleEndMinutes) ||
          (startMinutes <= scheduleStartMinutes &&
            endMinutes >= scheduleEndMinutes)
        );
      });

      if (hasConflict) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "Time slot conflicts with existing schedule",
        };
      }

      // Check maximum operations constraint
      if (
        existingSchedules.length >=
        LocationConstraints.getMaxOperations(operationDay.location as Location)
      ) {
        await session.abortTransaction();
        session.endSession();
        return {
          success: false,
          message: "Maximum number of operations reached for this day",
        };
      }

      // Additional constraints for specific locations
      if (operationDay.location === Location.ASOTA_CALANIOT) {
        // Count existing colonoscopies for this day
        const colonoCount = existingSchedules.filter(
          (s) =>
            s.operationType === OpType.COLONO ||
            s.operationType === OpType.DOUBLE
        ).length;

        // Check if adding this colonoscopy would exceed the limit
        if (
          (patient.operationType === OpType.COLONO ||
            patient.operationType === OpType.DOUBLE) &&
          colonoCount >=
            LocationConstraints.getMaxColono(Location.ASOTA_CALANIOT)
        ) {
          await session.abortTransaction();
          session.endSession();
          return {
            success: false,
            message:
              "Maximum number of colonoscopies reached for this location",
          };
        }
      }

      // Create the schedule
      const schedule = new Schedule({
        patientId: patient._id,
        doctorId: doctor._id,
        operationDayId: operationDay._id,
        operationType: patient.operationType,
        startTime,
        endTime,
        notes: patient.additionalInfo || "",
      });

      // Save the schedule
      await schedule.save({ session });

      // Update patient's isSetForOp status
      patient.isSetForOp = true;
      await patient.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Check if operation day needs to be locked after this scheduling
      await this.checkAndLockOperationDay(operationDayId);

      return {
        success: true,
        message: "Operation scheduled successfully",
        schedule,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error scheduling patient:", error);
      return {
        success: false,
        message: `Scheduling error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  // Get available time slots for each operation day
  static async getAvailableTimeSlotsForPatient(patientId: string): Promise<
    Array<{
      operationDay: IOperationDay;
      availableTime: string | null;
      message?: string;
    }>
  > {
    try {
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return [];
      }

      return await this.calculateAvailabilityForDays(patient);
    } catch (error) {
      console.error("Error getting available time slots:", error);
      return [];
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
}

export default SchedulerService;
