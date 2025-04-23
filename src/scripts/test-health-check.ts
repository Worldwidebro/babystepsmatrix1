import dotenv from "dotenv";
import { createHealthService } from "../services/health-service";

dotenv.config();

async function testHealthCheck() {
  console.log("🏥 Testing Health Check System...\n");

  try {
    const healthService = createHealthService();

    // Test basic health check
    console.log("🔍 Running basic health check...");
    const healthStatus = await healthService.checkHealth();
    console.log("\nHealth Check Results:");
    console.log("- Overall Status:", healthStatus.status);
    console.log("- Timestamp:", healthStatus.timestamp);
    console.log("\nComponent Status:");
    Object.entries(healthStatus.components).forEach(([component, status]) => {
      console.log(`- ${component}: ${status.status}`);
      if (status.message) {
        console.log(`  Message: ${status.message}`);
      }
    });

    // Check if any components are unhealthy
    const unhealthyComponents = Object.entries(healthStatus.components)
      .filter(([_, status]) => status.status === "unhealthy")
      .map(([component]) => component);

    if (unhealthyComponents.length > 0) {
      console.log("\n⚠️ Unhealthy Components:");
      unhealthyComponents.forEach((component) => {
        console.log(`- ${component}`);
      });
    } else {
      console.log("\n✅ All components are healthy!");
    }

    console.log("\n✅ Health check test completed successfully!");
  } catch (error) {
    console.error("\n❌ Error in health check test:", error);
  }
}

testHealthCheck().catch(console.error);
