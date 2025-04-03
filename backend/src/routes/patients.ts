import express, { Request, Response } from "express";
import Patient, { IPatient } from "../models/Patient";
import mongoose from "mongoose";

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

// @route   GET /api/patients/search
// @desc    Search patients by name, ID or phone
// @access  Public
router.get("/search", async (req: Request, res: Response): Promise<any> => {
  try {
    const { patientId, firstName, lastName, phone } = req.query;

    // Log the incoming request parameters for debugging
    console.log("Search parameters:", {
      patientId,
      firstName,
      lastName,
      phone,
    });

    if (!patientId && !firstName && !lastName && !phone) {
      return res
        .status(400)
        .json({ message: "At least one search parameter is required" });
    }

    // Build the query conditions
    const filter: any = {
      isSetForOp: false,
      doesntWantSurgery: false, // Only show patients who want surgery and haven't been scheduled yet
    };

    if (patientId) {
      const cleanId = String(patientId).replace(/\D/g, "");
      filter.patientId = String(patientId);

      // Debug: Find this patient regardless of other flags
      const patientExists = await Patient.find({ patientId: cleanId });
      console.log(
        `Patient with ID ${cleanId} exists in database? ${
          patientExists.length > 0 ? "YES" : "NO"
        }`
      );

      if (patientExists.length > 0) {
        console.log(
          `Patient flags: isSetForOp=${patientExists[0].isSetForOp}, doesntWantSurgery=${patientExists[0].doesntWantSurgery}`
        );
      }
    }

    if (firstName) {
      filter.firstName = new RegExp(String(firstName), "i");
    }

    if (lastName) {
      filter.lastName = new RegExp(String(lastName), "i");
    }

    if (phone) {
      filter.phone = new RegExp(String(phone), "i");
    }

    // Log the final filter for debugging
    console.log("MongoDB filter:", JSON.stringify(filter));

    // Execute the query - get all matching records
    const allPatients = await Patient.find(filter).sort({ visitDate: -1 });

    // Group by patientId and take the most recent visit for each patient
    const patientMap = new Map();

    allPatients.forEach((patient) => {
      const id = patient.patientId;
      if (
        !patientMap.has(id) ||
        new Date(patient.visitDate ?? 0) >
          new Date(patientMap.get(id)?.visitDate ?? 0)
      ) {
        patientMap.set(id, patient);
      }
    });

    // Convert the map values to an array
    const uniquePatients = Array.from(patientMap.values());

    // Log the result count
    console.log(
      `Found ${uniquePatients.length} unique patients from ${allPatients.length} matching records`
    );

    res.json(uniquePatients);
  } catch (error) {
    console.error("Error searching patients:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Public
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id;
    console.log("Looking for patient with ID:", id);

    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // If not valid, try to find the patient by patientId (Israeli ID)
      const patientByTeudatZehut = await Patient.findOne({ patientId: id });
      if (patientByTeudatZehut) {
        return res.json(patientByTeudatZehut);
      }

      return res.status(400).json({
        message: "Invalid ID format or patient not found",
      });
    }

    // Get the requested patient
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Find all visits of this patient by patientId
    const allVisits = await Patient.find({
      patientId: patient.patientId,
    }).sort({ visitDate: -1 });

    // Return the patient details and all visits
    res.json({
      patient,
      allVisits,
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update search by ID to include the new filter
router.get(
  "/search/id/:id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const patientId = req.params.id;

      if (!patientId) {
        return res.status(400).json({ message: "Patient ID is required" });
      }

      const patients = await Patient.find({
        isSetForOp: false,
        doesntWantSurgery: false,
        patientId: patientId,
      }).sort({ visitDate: -1 });

      res.json(patients);
    } catch (error) {
      console.error("Error searching patients by ID:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update all other search routes to include the new filter
router.get(
  "/search/firstname/:name",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const firstName = req.params.name;

      if (!firstName) {
        return res.status(400).json({ message: "First name is required" });
      }

      const searchPattern = new RegExp(String(firstName), "i");

      const patients = await Patient.find({
        isSetForOp: false,
        doesntWantSurgery: false,
        firstName: searchPattern,
      }).sort({ visitDate: -1 });

      res.json(patients);
    } catch (error) {
      console.error("Error searching patients by first name:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/search/lastname/:name",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const lastName = req.params.name;

      if (!lastName) {
        return res.status(400).json({ message: "Last name is required" });
      }

      const searchPattern = new RegExp(String(lastName), "i");

      const patients = await Patient.find({
        isSetForOp: false,
        doesntWantSurgery: false,
        lastName: searchPattern,
      }).sort({ visitDate: -1 });

      res.json(patients);
    } catch (error) {
      console.error("Error searching patients by last name:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(
  "/search/phone/:phone",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const phone = req.params.phone;

      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const searchPattern = new RegExp(String(phone), "i");

      const patients = await Patient.find({
        isSetForOp: false,
        doesntWantSurgery: false,
        phone: searchPattern,
      }).sort({ visitDate: -1 });

      res.json(patients);
    } catch (error) {
      console.error("Error searching patients by phone:", error);
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
      doesntWantSurgery,
    } = req.body;

    // Create new patient - no need to check for existing patients anymore
    // as we allow multiple records for the same patient
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
      isSetForOp: isSetForOp || false,
      doesntWantSurgery: doesntWantSurgery || false,
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
