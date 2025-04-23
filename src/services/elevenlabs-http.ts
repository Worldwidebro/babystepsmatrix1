import axios from "axios";
import fs from "fs";
import path from "path";

interface TextToSpeechOptions {
  text: string;
  voice_id: string;
  model_id?: string;
  output_format?: string;
  with_timestamps?: boolean;
}

interface TimestampResponse {
  audio: string;
  timestamps: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export class ElevenLabsHTTP {
  private readonly baseUrl = "https://api.elevenlabs.io/v1/text-to-speech";

  constructor(private apiKey: string) {}

  async textToSpeech(
    options: TextToSpeechOptions
  ): Promise<Buffer | TimestampResponse> {
    const {
      text,
      voice_id,
      model_id = "eleven_multilingual_v2",
      output_format = "mp3_44100_128",
      with_timestamps = false,
    } = options;

    try {
      const endpoint = with_timestamps
        ? `${this.baseUrl}/${voice_id}/with-timestamps`
        : `${this.baseUrl}/${voice_id}?output_format=${output_format}`;

      const response = await axios.post(
        endpoint,
        {
          text,
          model_id,
        },
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          responseType: with_timestamps ? "json" : "arraybuffer",
        }
      );

      if (with_timestamps) {
        return response.data as TimestampResponse;
      }

      return Buffer.from(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "ElevenLabs API Error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }

  async saveToFile(audioBuffer: Buffer, filename: string): Promise<string> {
    const outputPath = path.join(process.cwd(), "output", filename);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the audio buffer to file
    fs.writeFileSync(outputPath, audioBuffer);
    return outputPath;
  }

  async saveTimestamps(
    timestamps: TimestampResponse["timestamps"],
    filename: string
  ): Promise<string> {
    const outputPath = path.join(process.cwd(), "output", filename);

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the timestamps to file
    fs.writeFileSync(outputPath, JSON.stringify(timestamps, null, 2));
    return outputPath;
  }
}

// Example usage:
export async function generateSpeechWithTimestamps(
  text: string,
  voiceId: string,
  outputFilename: string
): Promise<{ audioPath: string; timestampsPath: string }> {
  const elevenlabs = new ElevenLabsHTTP(process.env.ELEVENLABS_API_KEY || "");

  try {
    const response = (await elevenlabs.textToSpeech({
      text,
      voice_id: voiceId,
      with_timestamps: true,
    })) as TimestampResponse;

    // Save audio file
    const audioBuffer = Buffer.from(response.audio, "base64");
    const audioPath = await elevenlabs.saveToFile(audioBuffer, outputFilename);

    // Save timestamps
    const timestampsPath = await elevenlabs.saveTimestamps(
      response.timestamps,
      outputFilename.replace(".mp3", "_timestamps.json")
    );

    console.log(`Audio saved to: ${audioPath}`);
    console.log(`Timestamps saved to: ${timestampsPath}`);

    return { audioPath, timestampsPath };
  } catch (error) {
    console.error("Error generating speech with timestamps:", error);
    throw error;
  }
}
