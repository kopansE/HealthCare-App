// src/index.ts
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";

// Import routes
import patientRoutes from "./routes/patients";
import doctorRoutes from "./routes/doctors";
import opHistoryRoutes from "./routes/ophistory";

// Load environment variables
dotenv.config();

// Initialize express app
const app: Express = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB - but only if not in test mode
// Tests will handle their own connection
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/ophistory", opHistoryRoutes);

// Basic route for testing
app.get("/", (req: Request, res: Response) => {
  res.send("Healthcare API is running");
});

// Start server - but only if not in test mode
let server: any;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
}

// Function to close the server - useful for testing
export const closeServer = () => {
  if (server) {
    server.close();
  }
};

export default app;
