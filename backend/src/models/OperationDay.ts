// models/OperationDay.ts - Updated with compound index
import mongoose, { Schema, Document } from "mongoose";

export enum Location {
  ASOTA_CALANIOT = "asotaCalaniotAshdod",
  ASOTA_HOLON = "asotaHolon",
  ASOTA_RAMAT_HAHAYAL = "asotaRamatHahayal",
  BEST_MEDICAL = "bestMedicalBatYam",
}

// Interface defining an Operation Day document
export interface IOperationDay extends Document {
  date: Date;
  location: Location;
  startHour: string;
  endHour: string;
  doctorId: mongoose.Types.ObjectId; // Added doctorId field
  isLocked: boolean; // Added isLocked field
  createdAt: Date;
  updatedAt: Date;
}

// Define the Operation Day schema
const OperationDaySchema: Schema<IOperationDay> = new Schema<IOperationDay>(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    location: {
      type: String,
      enum: Object.values(Location),
      required: [true, "Location is required"],
    },
    startHour: {
      type: String,
      required: [true, "Start hour is required"],
      // Validate time format (HH:MM)
      validate: {
        validator: function (v: string) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid time format (HH:MM)!`,
      },
    },
    endHour: {
      type: String,
      required: [true, "End hour is required"],
      // Validate time format (HH:MM)
      validate: {
        validator: function (v: string) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid time format (HH:MM)!`,
      },
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor ID is required"],
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add a compound index to ensure uniqueness of date+location+doctorId
OperationDaySchema.index(
  { date: 1, location: 1, doctorId: 1 },
  { unique: true }
);

// Create and export the Operation Day model
export default mongoose.model<IOperationDay>(
  "OperationDay",
  OperationDaySchema
);
