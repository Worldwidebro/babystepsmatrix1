import axios from "axios";
import fs from "fs";
import path from "path";

interface SoundGenerationOptions {
  text: string;
  model_id?: string;
  output_format?: string;
}

interface SoundGenerationResponse {
  audio: string;
  status: string;
}

export class ElevenLabsSoundGeneration {
  private readonly baseUrl = "https://api.elevenlabs.io/v1/sound-generation";

  constructor(private apiKey: string) {}

  async generateSound(
    options: SoundGenerationOptions
  ): Promise<SoundGenerationResponse> {
    const {
      text,
      model_id = "eleven_multilingual_v2",
      output_format = "mp3_44100_128",
    } = options;

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          text,
          model_id,
        },
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "ElevenLabs Sound Generation Error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }

  async saveSound(audioData: string, outputPath: string): Promise<string> {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Convert base64 to buffer and save
      const audioBuffer = Buffer.from(audioData, "base64");
      fs.writeFileSync(outputPath, audioBuffer);
      return outputPath;
    } catch (error) {
      console.error("Error saving sound:", error);
      throw error;
    }
  }
}

// Example usage:
export async function generateSound(
  text: string,
  outputFilename: string
): Promise<{ audioPath: string }> {
  const soundGen = new ElevenLabsSoundGeneration(
    process.env.ELEVENLABS_API_KEY || ""
  );

  try {
    const response = await soundGen.generateSound({
      text,
    });

    const outputPath = await soundGen.saveSound(
      response.audio,
      path.join(process.cwd(), "output", outputFilename)
    );

    console.log("✅ Sound saved to:", outputPath);
    return { audioPath: outputPath };
  } catch (error) {
    console.error("❌ Error generating sound:", error);
    throw error;
  }
}
