import dotenv from "dotenv";
import { generateSpeech } from "../services/elevenlabs-http";

dotenv.config();

async function testElevenLabsHTTP() {
  console.log("🔊 Testing ElevenLabs HTTP API...\n");

  const text = "The first move is what sets everything in motion.";
  const voiceId = "JBFqnCBsd6RMkjVDRZzb";
  const outputFilename = "test-speech.mp3";

  try {
    const filePath = await generateSpeech(text, voiceId, outputFilename);
    console.log("✅ Successfully generated speech file:", filePath);
  } catch (error) {
    console.error("❌ Error generating speech:", error);
  }
}

testElevenLabsHTTP().catch(console.error);
