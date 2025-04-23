import dotenv from "dotenv";
import { supabase } from "../config/supabase";

dotenv.config();

async function verifySecrets() {
  console.log("🔐 Verifying Environment Variables and API Connections...\n");

  // Check Supabase connection
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    if (error) throw error;
    console.log("✅ Supabase Connection: Working");
  } catch (error) {
    console.error("❌ Supabase Connection: Failed", error);
  }

  // Check environment variables
  const requiredVars = [
    "SUPABASE_URL",
    "SUPABASE_KEY",
    "SUPABASE_SECRET_KEY",
    "ELEVENLABS_KEY",
    "TWILIO_SID",
    "TWILIO_AUTH",
    "STRIPE_SK",
    "RESEND_KEY",
    "GDRIVE_TOKEN",
    "UPTIMEBOT_KEY",
  ];

  console.log("\n📋 Environment Variables Status:");
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

  // Check API usage tracking
  try {
    const { data, error } = await supabase
      .from("api_usage")
      .select("count")
      .limit(1);
    if (error) {
      console.log("\n⚠️ API Usage Tracking: Not set up");
      console.log("To set up, run:");
      console.log(`
        CREATE TABLE api_usage (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service TEXT NOT NULL,
          usage_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      console.log("\n✅ API Usage Tracking: Set up");
    }
  } catch (error) {
    console.error("\n❌ API Usage Tracking: Error checking setup", error);
  }
}

verifySecrets().catch(console.error);
