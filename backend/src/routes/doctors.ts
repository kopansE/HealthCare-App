import express, { Request, Response } from "express";
import Doctor, { IDoctor } from "../models/Doctors";

const router = express.Router();

// @route   GET /api/doctors
// @desc    Get all doctors
// @access  Public
router.get("/", async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find().sort({ lastName: 1, firstName: 1 });
    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// // @route   GET /api/doctors/:id
// // @desc    Get doctor by ID
// // @access  Public
// router.get("/:id", async (req: Request, res: Response) => {
//   try {
//     const doctor = await Doctor.findById(req.params.id);

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     res.json(doctor);
//   } catch (error) {
//     console.error("Error fetching doctor:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// @route   GET /api/doctors/teudat-zehut/:id
// @desc    Get doctor by Teudat Zehut (Israeli ID)
// @access  Public
router.get(
  "/teudat-zehut/:id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const doctor = await Doctor.findOne({ doctorId: req.params.id });

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      res.json(doctor);
    } catch (error) {
      console.error("Error fetching doctor by ID:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   POST /api/doctors
// @desc    Create a new doctor
// @access  Public
router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const { doctorId, firstName, lastName } = req.body;

    // Check if doctor with the same ID already exists
    const existingDoctor = await Doctor.findOne({ doctorId });
    if (existingDoctor) {
      return res
        .status(400)
        .json({ message: "Doctor with this ID already exists" });
    }

    // Create new doctor
    const newDoctor = new Doctor({
      doctorId,
      firstName,
      lastName,
    });

    const savedDoctor = await newDoctor.save();
    res.status(201).json(savedDoctor);
  } catch (error: any) {
    console.error("Error creating doctor:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/doctors/:id
// @desc    Update a doctor
// @access  Public
router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(updatedDoctor);
  } catch (error: any) {
    console.error("Error updating doctor:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/doctors/:id
// @desc    Delete a doctor
// @access  Public
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json({ message: "Doctor removed" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
