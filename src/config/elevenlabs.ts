import { ElevenLabs } from "elevenlabs";

// Initialize ElevenLabs client with API key from environment variables
export const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
});

// Helper function to verify API key
export const verifyElevenLabsKey = async () => {
  try {
    const voices = await elevenlabs.voices.list();
    return true;
  } catch (error) {
    console.error("ElevenLabs API key verification failed:", error);
    return false;
  }
};

// Helper function to get available voices
export const getAvailableVoices = async () => {
  try {
    const voices = await elevenlabs.voices.list();
    return voices;
  } catch (error) {
    console.error("Error fetching voices:", error);
    return [];
  }
};
