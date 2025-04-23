import dotenv from "dotenv";
import { createResendService } from "../services/resend-service";

dotenv.config();

async function testResend() {
  console.log("📧 Testing Resend Email Integration...\n");

  // Verify environment variables
  const requiredVars = ["RESEND_API_KEY", "DEFAULT_FROM_EMAIL", "APP_URL"];

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
    const resend = createResendService();

    // Test sending a simple email
    console.log("\n📤 Testing email sending...");
    const emailResponse = await resend.sendEmail({
      from: "onboarding@resend.dev",
      to: "winnerscirclewcllc@gmail.com",
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
    });
    console.log("✅ Test email sent:", emailResponse.id);

    // Test sending a verification email
    console.log("\n📧 Testing verification email...");
    const verificationResponse = await resend.sendVerificationEmail(
      "winnerscirclewcllc@gmail.com",
      "test-verification-token"
    );
    console.log("✅ Verification email sent:", verificationResponse.id);

    // Test sending a password reset email
    console.log("\n🔑 Testing password reset email...");
    const resetResponse = await resend.sendPasswordResetEmail(
      "winnerscirclewcllc@gmail.com",
      "test-reset-token"
    );
    console.log("✅ Password reset email sent:", resetResponse.id);

    console.log("\n✅ Resend integration test completed successfully!");
  } catch (error) {
    console.error("\n❌ Error in Resend test:", error);
  }
}

testResend().catch(console.error);
