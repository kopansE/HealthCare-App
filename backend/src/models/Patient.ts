import mongoose, { Schema, Document } from "mongoose";

// Interface defining a Patient document
export interface IPatient extends Document {
  patientId: string; // Israeli ID (Teudat Zehut)
  firstName: string;
  lastName: string;
  HCProvider: "maccabi" | "clalit" | "meuhedet" | "leumit";
  phone: string;
  additionalPhone?: string;
  isSetForOp: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Patient schema
const PatientSchema: Schema = new Schema(
  {
    patientId: {
      type: String,
      required: [true, "ID is required"],
      unique: true,
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
      enum: ["maccabi", "clalit", "meuhedet", "leumit"],
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
    isSetForOp: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the Patient model
export default mongoose.model<IPatient>("Patient", PatientSchema);
