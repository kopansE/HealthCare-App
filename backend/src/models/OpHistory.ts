import mongoose, { Schema, Document } from "mongoose";

// Enum definitions for operation types and preparation types
export enum OpType {
  COLONO = "colono",
  SIGMO = "sigmo",
  GASTRO = "gastro",
  DOUBLE = "double",
}

export enum PrepType {
  PIKO = "piko",
  MEROKEN = "meroken",
  NO_PREP = "noPrep",
}

export enum Location {
  ASOTA_CALANIOT = "asotaCalaniotAshdod",
  ASOTA_HOLON = "asotaHolon",
  ASOTA_RAMAT_HAHAYAL = "asotaRamatHahayal",
  BEST_MEDICAL = "bestMedicalBatYam",
}

// Interface defining an Operation History document
export interface IOpHistory extends Document {
  patientId: mongoose.Types.ObjectId; // Reference to Patient
  doctorId: mongoose.Types.ObjectId; // Reference to Doctor
  isOperation: boolean; // Is this an actual operation or just a consultation
  date: Date;
  opType: OpType;
  prepType: PrepType;
  location: Location;
  startHour: string;
  endHour: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Operation History schema
const OpHistorySchema: Schema<IOpHistory> = new Schema<IOpHistory>(
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
    isOperation: {
      type: Boolean,
      required: [true, "Operation status is required"],
      default: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    opType: {
      type: String,
      enum: Object.values(OpType),
      required: [true, "Operation type is required"],
    },
    prepType: {
      type: String,
      enum: Object.values(PrepType),
      required: [true, "Preparation type is required"],
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
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Operation History model
export default mongoose.model<IOpHistory>("OpHistory", OpHistorySchema);
