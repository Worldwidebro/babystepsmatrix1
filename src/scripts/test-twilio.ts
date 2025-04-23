import dotenv from "dotenv";
import { createTwilioService } from "../services/twilio-service";

dotenv.config();

async function testTwilio() {
  console.log("📱 Testing Twilio Integration...\n");

  // Verify environment variables
  const requiredVars = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
  ];

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
    const twilio = createTwilioService();
    const testNumber = "(855) 770-3291";

    // Test message history
    console.log("\n📨 Fetching message history...");
    const messages = await twilio.getMessageHistory(5);
    console.log(`✅ Retrieved ${messages.length} recent messages`);

    // Test sending a message
    console.log("\n📤 Testing message sending...");
    const message = await twilio.sendMessage({
      to: testNumber,
      body: "This is a test message from your Twilio integration. If you receive this, the integration is working!",
    });
    console.log("✅ Test message sent:", message.sid);

    // Test voice call
    console.log("\n📞 Testing voice call...");
    const call = await twilio.sendVoiceCall(
      testNumber,
      "This is a test call from your Twilio integration. If you hear this message, the voice call feature is working!"
    );
    console.log("✅ Test call initiated:", call.sid);

    console.log("\n✅ Twilio integration test completed successfully!");
  } catch (error) {
    console.error("\n❌ Error in Twilio test:", error);
  }
}

testTwilio().catch(console.error);
