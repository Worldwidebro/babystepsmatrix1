import dotenv from "dotenv";
import { generateSound } from "../services/elevenlabs-sound-generation";

dotenv.config();

async function testSoundGeneration() {
  console.log("🎵 Testing Sound Generation...\n");

  const text = "Spacious braam suitable for high-impact movie trailer moments";
  const outputFilename = "movie_trailer_sound.mp3";

  try {
    const result = await generateSound(text, outputFilename);
    console.log("\n✅ Sound Generation Results:");
    console.log("- Sound saved to:", result.audioPath);
  } catch (error) {
    console.error("❌ Error in sound generation test:", error);
  }
}

testSoundGeneration().catch(console.error);
