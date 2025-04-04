// routes/operationday.ts - Updated with additional validation
import express, { Request, Response } from "express";
import OperationDay, { Location } from "../models/OperationDay";
import Schedule from "../models/Schedule";
import SchedulerService from "../services/SchedulerService";

const router = express.Router();

// @route   GET /api/operationday
// @desc    Get all operation days
// @access  Public
router.get("/", async (req: Request, res: Response) => {
  try {
    const operationDays = await OperationDay.find()
      .populate("doctorId", "firstName lastName") // Populate doctor information
      .sort({ date: 1 });
    res.json(operationDays);
  } catch (error) {
    console.error("Error fetching operation days:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/operationday/available
// @desc    Get all available (not locked) operation days in the future
// @access  Public
router.get("/available", async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const operationDays = await OperationDay.find({
      date: { $gte: today },
      isLocked: { $ne: true },
    })
      .populate("doctorId", "firstName lastName") // Populate doctor information
      .sort({ date: 1 });

    res.json(operationDays);
  } catch (error) {
    console.error("Error fetching available operation days:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/operationday/:id
// @desc    Get operation day by ID
// @access  Public
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const operationDay = await OperationDay.findById(req.params.id).populate(
      "doctorId",
      "firstName lastName"
    ); // Populate doctor information

    if (!operationDay) {
      return res.status(404).json({ message: "Operation day not found" });
    }

    res.json(operationDay);
  } catch (error) {
    console.error("Error fetching operation day:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/operationday
// @desc    Create a new operation day
// @access  Public
router.post("/", async (req: Request, res: Response): Promise<any> => {
  try {
    const { date, location, startHour, endHour, doctorId } = req.body;

    // Check if doctorId is provided
    if (!doctorId) {
      return res.status(400).json({
        message: "Doctor ID is required",
      });
    }

    // Check if an operation day already exists for this date, location and doctor
    const existingDay = await OperationDay.findOne({
      date: new Date(date),
      location,
      doctorId,
    });

    if (existingDay) {
      return res.status(400).json({
        message:
          "An operation day already exists for this date, location and doctor",
      });
    }

    // Create new operation day
    const newOperationDay = new OperationDay({
      date,
      location,
      startHour,
      endHour,
      doctorId,
      isLocked: false,
    });

    const savedOperationDay = await newOperationDay.save();

    // Populate doctor information for the response
    const populatedOperationDay = await OperationDay.findById(
      savedOperationDay._id
    ).populate("doctorId", "firstName lastName");

    res.status(201).json(populatedOperationDay);
  } catch (error: any) {
    console.error("Error creating operation day:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "An operation day already exists for this date, location and doctor combination",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// Rest of the code remains the same...
router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    // First check if the operation day is locked
    const existingDay = await OperationDay.findById(req.params.id);
    if (existingDay && existingDay.isLocked) {
      return res.status(400).json({
        message: "Cannot update a locked operation day",
      });
    }

    const updatedOperationDay = await OperationDay.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("doctorId", "firstName lastName");

    if (!updatedOperationDay) {
      return res.status(404).json({ message: "Operation day not found" });
    }

    // Validate the operation day against business rules
    const validationResult = await SchedulerService.validateOperationDay(
      req.params.id
    );

    res.json({
      operationDay: updatedOperationDay,
      validation: validationResult,
    });
  } catch (error: any) {
    console.error("Error updating operation day:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "This update would create a duplicate operation day for the same date, location and doctor",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// The remaining routes stay the same...
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    // Check if the operation day is locked
    const existingDay = await OperationDay.findById(req.params.id);
    if (existingDay && existingDay.isLocked) {
      return res.status(400).json({
        message: "Cannot delete a locked operation day",
      });
    }

    // Check if there are any schedules for this operation day
    const scheduleCount = await Schedule.countDocuments({
      operationDayId: req.params.id,
    });

    if (scheduleCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete an operation day with scheduled operations. Please reschedule or delete the operations first.",
      });
    }

    const operationDay = await OperationDay.findByIdAndDelete(req.params.id);

    if (!operationDay) {
      return res.status(404).json({ message: "Operation day not found" });
    }

    res.json({ message: "Operation day removed" });
  } catch (error) {
    console.error("Error deleting operation day:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/date/:date", async (req: Request, res: Response): Promise<any> => {
  try {
    const date = new Date(req.params.date);

    // Set time to start of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    // Set time to end of day
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const operationDays = await OperationDay.find({
      date: { $gte: startDate, $lte: endDate },
    }).populate("doctorId", "firstName lastName");

    res.json(operationDays);
  } catch (error) {
    console.error("Error fetching operation days by date:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/lock", async (req: Request, res: Response): Promise<any> => {
  try {
    const operationDay = await OperationDay.findById(req.params.id);

    if (!operationDay) {
      return res.status(404).json({ message: "Operation day not found" });
    }

    operationDay.isLocked = true;
    await operationDay.save();

    const populatedOperationDay = await OperationDay.findById(
      operationDay._id
    ).populate("doctorId", "firstName lastName");

    res.json({
      message: "Operation day locked successfully",
      operationDay: populatedOperationDay,
    });
  } catch (error) {
    console.error("Error locking operation day:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/:id/unlock",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const operationDay = await OperationDay.findById(req.params.id);

      if (!operationDay) {
        return res.status(404).json({ message: "Operation day not found" });
      }

      operationDay.isLocked = false;
      await operationDay.save();

      const populatedOperationDay = await OperationDay.findById(
        operationDay._id
      ).populate("doctorId", "firstName lastName");

      res.json({
        message: "Operation day unlocked successfully",
        operationDay: populatedOperationDay,
      });
    } catch (error) {
      console.error("Error unlocking operation day:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
