import dotenv from "dotenv";
import { generateAndCreateVoice } from "../services/elevenlabs-voice-preview";

dotenv.config();

async function testVoiceCreation() {
  console.log("🎙️ Testing Voice Creation Process...\n");

  const voiceName = "Sassy squeaky mouse";
  const voiceDescription =
    "A sassy squeaky mouse with a high-pitched voice and playful attitude";
  const outputFilename = "sassy_mouse_preview.mp3";

  try {
    const result = await generateAndCreateVoice(
      voiceName,
      voiceDescription,
      outputFilename
    );

    console.log("\n✅ Voice Creation Results:");
    console.log("- Preview URL:", result.previewUrl);
    console.log("- Preview Voice ID:", result.voiceId);
    console.log("- Created Voice ID:", result.createdVoiceId);
    console.log("- Preview saved to:", result.outputPath);
  } catch (error) {
    console.error("❌ Error in voice creation test:", error);
  }
}

testVoiceCreation().catch(console.error);
