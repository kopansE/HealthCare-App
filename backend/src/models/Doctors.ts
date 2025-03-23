import mongoose, { Schema, Document } from "mongoose";

// Interface defining a Doctor document
export interface IDoctor extends Document {
  doctorId: string; // Israeli ID (Teudat Zehut)
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Doctor schema
const DoctorSchema: Schema = new Schema(
  {
    doctorId: {
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
  },
  {
    timestamps: true,
  }
);

// Create and export the Doctor model
export default mongoose.model<IDoctor>("Doctor", DoctorSchema);
