import express from "express";
import { createHealthService } from "../services/health-service";

const router = express.Router();
const healthService = createHealthService();

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const healthStatus = await healthService.checkHealth();
    res.json(healthStatus);
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
    });
  }
});

// Detailed health check endpoint
router.get("/health/detailed", async (req, res) => {
  try {
    const healthStatus = await healthService.checkHealth();
    res.json({
      ...healthStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    });
  } catch (error) {
    console.error("Detailed health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Detailed health check failed",
    });
  }
});

export default router;
