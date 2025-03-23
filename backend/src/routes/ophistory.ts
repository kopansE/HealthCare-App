import express, { Request, Response } from "express";
import OpHistory, { IOpHistory } from "../models/OpHistory";
import Patient from "../models/Patient";
import mongoose from "mongoose";

const router = express.Router();

// @route   GET /api/ophistory
// @desc    Get all operation history records
// @access  Public
router.get("/", async (req: Request, res: Response) => {
  try {
    const opHistory = await OpHistory.find()
      .sort({ date: -1 })
      .populate("patientId", "patientId firstName lastName phone")
      .populate("doctorId", "doctorId firstName lastName");

    res.json(opHistory);
  } catch (error) {
    console.error("Error fetching operation history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/ophistory/:id
// @desc    Get operation history by ID
// @access  Public
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const opHistory = await OpHistory.findById(req.params.id)
      .populate("patientId")
      .populate("doctorId");

    if (!opHistory) {
      return res.status(404).json({ message: "Operation history not found" });
    }

    res.json(opHistory);
  } catch (error) {
    console.error("Error fetching operation history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/ophistory/patient/:patientId
// @desc    Get operation history by patient ID (MongoDB ID)
// @access  Public
router.get("/patient/:patientId", async (req: Request, res: Response) => {
  try {
    const opHistory = await OpHistory.find({ patientId: req.params.patientId })
      .sort({ date: -1 })
      .populate("doctorId", "doctorId firstName lastName");

    res.json(opHistory);
  } catch (error) {
    console.error("Error fetching patient operation history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/ophistory/patient-teudat-zehut/:patientId
// @desc    Get operation history by patient's Teudat Zehut (Israeli ID)
// @access  Public
router.get(
  "/patient-teudat-zehut/:patientId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      // First find the patient with the given ID
      const patient = await Patient.findOne({
        patientId: req.params.patientId,
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Then find all operations for this patient
      const opHistory = await OpHistory.find({ patientId: patient._id })
        .sort({ date: -1 })
        .populate("doctorId", "doctorId firstName lastName");

      res.json(opHistory);
    } catch (error) {
      console.error("Error fetching patient operation history by ID:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/ophistory/doctor/:doctorId
// @desc    Get operation history by doctor ID (MongoDB ID)
// @access  Public
router.get("/doctor/:doctorId", async (req: Request, res: Response) => {
  try {
    const opHistory = await OpHistory.find({ doctorId: req.params.doctorId })
      .sort({ date: -1 })
      .populate("patientId", "patientId firstName lastName phone");

    res.json(opHistory);
  } catch (error) {
    console.error("Error fetching doctor operation history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/ophistory/date/:date
// @desc    Get operation history by date
// @access  Public
router.get("/date/:date", async (req: Request, res: Response): Promise<any> => {
  try {
    const date = new Date(req.params.date);

    // Set time to start of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    // Set time to end of day
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const opHistory = await OpHistory.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ startHour: 1 })
      .populate("patientId", "patientId firstName lastName phone")
      .populate("doctorId", "doctorId firstName lastName");

    res.json(opHistory);
  } catch (error) {
    console.error("Error fetching operation history by date:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/ophistory
// @desc    Create a new operation history record
// @access  Public
router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      patientId,
      doctorId,
      isOperation,
      date,
      opType,
      prepType,
      location,
      startHour,
      endHour,
      notes,
    } = req.body;

    // Create new operation history record
    const newOpHistory = new OpHistory({
      patientId,
      doctorId,
      isOperation,
      date,
      opType,
      prepType,
      location,
      startHour,
      endHour,
      notes,
    });

    const savedOpHistory = await newOpHistory.save();

    // Update patient's operation status
    await Patient.findByIdAndUpdate(patientId, { $set: { isSetForOp: true } });

    // Return the operation with populated patient and doctor data
    const populatedOpHistory = await OpHistory.findById(savedOpHistory._id)
      .populate("patientId", "patientId firstName lastName phone")
      .populate("doctorId", "doctorId firstName lastName");

    res.status(201).json(populatedOpHistory);
  } catch (error: any) {
    console.error("Error creating operation history:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/ophistory/:id
// @desc    Update an operation history record
// @access  Public
router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const updatedOpHistory = await OpHistory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate("patientId", "patientId firstName lastName phone")
      .populate("doctorId", "doctorId firstName lastName");

    if (!updatedOpHistory) {
      return res.status(404).json({ message: "Operation history not found" });
    }

    res.json(updatedOpHistory);
  } catch (error: any) {
    console.error("Error updating operation history:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/ophistory/:id
// @desc    Delete an operation history record
// @access  Public
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the operation history record
    const opHistory = await OpHistory.findById(req.params.id).session(session);

    if (!opHistory) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Operation history not found" });
    }

    // Get the patient ID
    const patientId = opHistory.patientId;

    // Delete the operation history record
    await OpHistory.findByIdAndDelete(req.params.id).session(session);

    // Check if patient has any other scheduled operations
    const patientOtherOps = await OpHistory.countDocuments({
      patientId,
    }).session(session);

    // If no other operations, update patient's operation status
    if (patientOtherOps === 0) {
      await Patient.findByIdAndUpdate(
        patientId,
        { $set: { isSetForOp: false } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Operation history removed" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error deleting operation history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/ophistory/location/:location
// @desc    Get operations by location
// @access  Public
router.get("/location/:location", async (req: Request, res: Response) => {
  try {
    const opHistory = await OpHistory.find({ location: req.params.location })
      .sort({ date: -1 })
      .populate("patientId", "patientId firstName lastName phone")
      .populate("doctorId", "doctorId firstName lastName");

    res.json(opHistory);
  } catch (error) {
    console.error("Error fetching operations by location:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/ophistory/operation-type/:opType
// @desc    Get operations by operation type
// @access  Public
router.get("/operation-type/:opType", async (req: Request, res: Response) => {
  try {
    const opHistory = await OpHistory.find({ opType: req.params.opType })
      .sort({ date: -1 })
      .populate("patientId", "patientId firstName lastName phone")
      .populate("doctorId", "doctorId firstName lastName");

    res.json(opHistory);
  } catch (error) {
    console.error("Error fetching operations by type:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/ophistory/stats
// @desc    Get operation statistics
// @access  Public
router.get("/stats/summary", async (req: Request, res: Response) => {
  try {
    // Get total counts
    const totalOperations = await OpHistory.countDocuments({
      isOperation: true,
    });
    const totalConsultations = await OpHistory.countDocuments({
      isOperation: false,
    });

    // Get counts by operation type
    const opTypeCounts = await OpHistory.aggregate([
      { $match: { isOperation: true } },
      { $group: { _id: "$opType", count: { $sum: 1 } } },
    ]);

    // Get counts by location
    const locationCounts = await OpHistory.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
    ]);

    // Get counts by month (for the current year)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const monthlyStats = await OpHistory.aggregate([
      {
        $match: {
          date: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: { $month: "$date" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalOperations,
      totalConsultations,
      opTypeCounts,
      locationCounts,
      monthlyStats,
    });
  } catch (error) {
    console.error("Error fetching operation statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
