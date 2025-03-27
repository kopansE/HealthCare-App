// index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

// Import routes
import doctorRoutes from "./routes/doctors";
import patientRoutes from "./routes/patients";
import operationDayRoutes from "./routes/operationday";
import schedulerRoutes from "./routes/scheduler";

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Define routes
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/operationday", operationDayRoutes);
app.use("/api/scheduler", schedulerRoutes);

// Define port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
