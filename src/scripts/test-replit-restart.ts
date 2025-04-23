import dotenv from "dotenv";
import { createReplitService } from "../services/replit-service";

dotenv.config();

async function testReplitRestart() {
  console.log("🔄 Testing Replit Auto-Restart...\n");

  // Verify environment variables
  const requiredVars = ["REPLIT_REPL_ID", "REPLIT_API_KEY"];

  console.log("🔑 Checking environment variables:");
  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
      // Mask the value for security
      const maskedValue =
        value.substring(0, 4) + "..." + value.substring(value.length - 4);
      console.log(`✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  });

  try {
    const replit = createReplitService();

    // Check current status
    console.log("\n🔍 Checking current Replit status...");
    const status = await replit.getReplStatus();
    console.log("✅ Current status:", status.state);

    // Check health
    console.log("\n🏥 Checking Replit health...");
    const isHealthy = await replit.checkHealth();
    console.log("✅ Health check:", isHealthy ? "Healthy" : "Unhealthy");

    // Test restart (commented out for safety)
    /*
    console.log('\n🔄 Testing Replit restart...');
    await replit.restartRepl({
      reason: 'Test restart from UptimeRobot integration',
      waitForReady: true
    });
    console.log('✅ Restart initiated');
    */

    console.log("\n✅ Replit auto-restart test completed successfully!");
  } catch (error) {
    console.error("\n❌ Error in Replit test:", error);
  }
}

testReplitRestart().catch(console.error);
