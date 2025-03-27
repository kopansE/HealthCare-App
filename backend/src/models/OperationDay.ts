// models/OperationDay.ts
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
  },
  {
    timestamps: true,
  }
);

// Create and export the Operation Day model
export default mongoose.model<IOperationDay>(
  "OperationDay",
  OperationDaySchema
);
