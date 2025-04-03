// models/Patient.ts
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

export enum HCProvider {
  MACCABI = "maccabi",
  CLALIT = "clalit",
  MEUHEDET = "meuhedet",
  LEUMIT = "leumit",
}

// Interface defining a Patient document
export interface IPatient extends Document {
  patientId: string; // Israeli ID (Teudat Zehut)
  firstName: string;
  lastName: string;
  HCProvider: string;
  phone: string;
  additionalPhone?: string;
  isSetForOp: boolean;
  doesntWantSurgery: boolean;
  visitDate?: Date;
  operationType?: OpType;
  preparationType?: PrepType;
  additionalInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Patient schema
const PatientSchema: Schema = new Schema(
  {
    patientId: {
      type: String,
      required: [true, "ID is required"],
      trim: true,
      // Validate Israeli ID format (9 digits)
      validate: {
        validator: function (v: string) {
          return /^\d{9}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Israeli ID!`,
      },
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    HCProvider: {
      type: String,
      required: [true, "Health care provider is required"],
      enum: Object.values(HCProvider),
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      // Validate Israeli mobile number format
      validate: {
        validator: function (v: string) {
          return /^05\d{8}$/.test(v.replace(/\D/g, ""));
        },
        message: (props) =>
          `${props.value} is not a valid Israeli mobile number!`,
      },
    },
    additionalPhone: {
      type: String,
      trim: true,
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
    operationType: {
      type: String,
      enum: Object.values(OpType),
    },
    preparationType: {
      type: String,
      enum: Object.values(PrepType),
    },
    additionalInfo: {
      type: String,
      trim: true,
    },
    isSetForOp: {
      type: Boolean,
      default: false,
    },
    doesntWantSurgery: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
PatientSchema.index({ patientId: 1, visitDate: 1 });

// Create and export the Patient model
export default mongoose.model<IPatient>("Patient", PatientSchema);
