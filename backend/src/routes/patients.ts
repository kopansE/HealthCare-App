import express, { Request, Response } from "express";
import Patient, { IPatient } from "../models/Patient";

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients
// @access  Public
router.get("/", async (req: Request, res: Response) => {
  try {
    const patients = await Patient.find().sort({ lastName: 1, firstName: 1 });
    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Public
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/patients/teudat-zehut/:id
// @desc    Get patient by Teudat Zehut (Israeli ID)
// @access  Public
router.get(
  "/teudat-zehut/:id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const patient = await Patient.findOne({ patientId: req.params.id });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      res.json(patient);
    } catch (error) {
      console.error("Error fetching patient by ID:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   POST /api/patients
// @desc    Create a new patient
// @access  Public
router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      patientId,
      firstName,
      lastName,
      HCProvider,
      visitDate,
      operationType,
      preparationType,
      phone,
      additionalPhone,
      additionalInfo,
      isSetForOp,
    } = req.body;

    // Check if patient with the same ID and visit date already exists
    const existingPatient = await Patient.findOne({
      patientId,
      visitDate: new Date(visitDate),
    });

    if (existingPatient) {
      return res.status(400).json({
        message:
          "Patient with this ID already has a record for this visit date",
      });
    }

    // Create new patient
    const newPatient = new Patient({
      patientId,
      firstName,
      lastName,
      HCProvider,
      visitDate,
      operationType,
      preparationType,
      phone,
      additionalPhone,
      additionalInfo,
      isSetForOp,
    });

    const savedPatient = await newPatient.save();
    res.status(201).json(savedPatient);
  } catch (error: any) {
    console.error("Error creating patient:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update a patient
// @access  Public
router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json(updatedPatient);
  } catch (error: any) {
    console.error("Error updating patient:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Delete a patient
// @access  Public
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient removed" });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
