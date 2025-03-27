// routes/operationday.ts
import express, { Request, Response } from "express";
import OperationDay, { Location } from "../models/OperationDay";
import Schedule from "../models/Schedule"; // Add this missing import
import SchedulerService from "../services/SchedulerService";

const router = express.Router();

// @route   GET /api/operationday
// @desc    Get all operation days
// @access  Public
router.get("/", async (req: Request, res: Response) => {
  try {
    const operationDays = await OperationDay.find().sort({ date: 1 });
    res.json(operationDays);
  } catch (error) {
    console.error("Error fetching operation days:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/operationday/:id
// @desc    Get operation day by ID
// @access  Public
router.get("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const operationDay = await OperationDay.findById(req.params.id);

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
    const { date, location, startHour, endHour } = req.body;

    // Check if an operation day already exists for this date and location
    const existingDay = await OperationDay.findOne({
      date: new Date(date),
      location,
    });

    if (existingDay) {
      return res.status(400).json({
        message: "An operation day already exists for this date and location",
      });
    }

    // Create new operation day
    const newOperationDay = new OperationDay({
      date,
      location,
      startHour,
      endHour,
    });

    const savedOperationDay = await newOperationDay.save();
    res.status(201).json(savedOperationDay);
  } catch (error: any) {
    console.error("Error creating operation day:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/operationday/:id
// @desc    Update an operation day
// @access  Public
router.put("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
    const updatedOperationDay = await OperationDay.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

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

    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/operationday/:id
// @desc    Delete an operation day
// @access  Public
router.delete("/:id", async (req: Request, res: Response): Promise<any> => {
  try {
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

// @route   GET /api/operationday/date/:date
// @desc    Get operation days by date
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

    const operationDays = await OperationDay.find({
      date: { $gte: startDate, $lte: endDate },
    });

    res.json(operationDays);
  } catch (error) {
    console.error("Error fetching operation days by date:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
