// models/Schedule.ts
import mongoose, { Schema, Document } from "mongoose";
import { OpType } from "./Patient";

// Interface defining a Schedule entry document
export interface ISchedule extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  operationDayId: mongoose.Types.ObjectId;
  operationType: OpType;
  startTime: string;
  endTime: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Schedule schema
const ScheduleSchema: Schema<ISchedule> = new Schema<ISchedule>(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor ID is required"],
    },
    operationDayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OperationDay",
      required: [true, "Operation Day ID is required"],
    },
    operationType: {
      type: String,
      enum: Object.values(OpType),
      required: [true, "Operation type is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      validate: {
        validator: function (v: string) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid time format (HH:MM)!`,
      },
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      validate: {
        validator: function (v: string) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid time format (HH:MM)!`,
      },
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Schedule model
export default mongoose.model<ISchedule>("Schedule", ScheduleSchema);
