import dotenv from "dotenv";
import {
  elevenlabs,
  verifyElevenLabsKey,
  getAvailableVoices,
} from "../config/elevenlabs";

dotenv.config();

async function testElevenLabs() {
  console.log("🔊 Testing ElevenLabs Integration...\n");

  // Check API key
  const isKeyValid = await verifyElevenLabsKey();
  if (isKeyValid) {
    console.log("✅ ElevenLabs API Key: Valid");
  } else {
    console.log("❌ ElevenLabs API Key: Invalid or not set");
    console.log("Please set ELEVENLABS_API_KEY in your .env file");
    return;
  }

  // Get available voices
  console.log("\n🎙️ Fetching available voices...");
  const voices = await getAvailableVoices();
  if (voices.length > 0) {
    console.log(`✅ Found ${voices.length} voices:`);
    voices.forEach((voice) => {
      console.log(`- ${voice.name} (${voice.voice_id})`);
    });
  } else {
    console.log("❌ No voices found or error occurred");
  }
}

testElevenLabs().catch(console.error);
