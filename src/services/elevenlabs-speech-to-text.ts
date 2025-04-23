import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

interface SpeechToTextOptions {
  filePath: string;
  model_id?: string;
}

interface SpeechToTextResponse {
  text: string;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export class ElevenLabsSpeechToText {
  private readonly baseUrl = "https://api.elevenlabs.io/v1/speech-to-text";

  constructor(private apiKey: string) {}

  async convertSpeechToText(
    options: SpeechToTextOptions
  ): Promise<SpeechToTextResponse> {
    const { filePath, model_id = "whisper-1" } = options;

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));
      formData.append("model_id", model_id);

      // Make the request
      const response = await axios.post(this.baseUrl, formData, {
        headers: {
          "xi-api-key": this.apiKey,
          ...formData.getHeaders(),
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "ElevenLabs Speech-to-Text Error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }

  async saveTranscription(
    transcription: SpeechToTextResponse,
    outputPath: string
  ): Promise<string> {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save the transcription
    fs.writeFileSync(outputPath, JSON.stringify(transcription, null, 2));
    return outputPath;
  }
}

// Example usage:
export async function transcribeAudio(
  audioFilePath: string,
  outputFilename: string
): Promise<{ text: string; outputPath: string }> {
  const stt = new ElevenLabsSpeechToText(process.env.ELEVENLABS_API_KEY || "");

  try {
    const transcription = await stt.convertSpeechToText({
      filePath: audioFilePath,
    });

    const outputPath = await stt.saveTranscription(
      transcription,
      path.join(process.cwd(), "output", outputFilename)
    );

    console.log("✅ Transcription saved to:", outputPath);
    return {
      text: transcription.text,
      outputPath,
    };
  } catch (error) {
    console.error("❌ Error transcribing audio:", error);
    throw error;
  }
}
