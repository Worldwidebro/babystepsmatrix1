import axios from "axios";
import fs from "fs";
import path from "path";

interface VoicePreviewOptions {
  voice_description: string;
  model_id?: string;
}

interface VoicePreviewResponse {
  preview_url: string;
  voice_id: string;
  status: string;
}

interface CreateVoiceFromPreviewOptions {
  voice_name: string;
  voice_description: string;
  generated_voice_id: string;
}

interface CreateVoiceResponse {
  voice_id: string;
  name: string;
  description: string;
  status: string;
}

export class ElevenLabsVoicePreview {
  private readonly baseUrl = "https://api.elevenlabs.io/v1/text-to-voice";
  private readonly createPreviewUrl = `${this.baseUrl}/create-previews`;
  private readonly createVoiceUrl = `${this.baseUrl}/create-voice-from-preview`;

  constructor(private apiKey: string) {}

  async createVoicePreview(
    options: VoicePreviewOptions
  ): Promise<VoicePreviewResponse> {
    const { voice_description, model_id = "eleven_multilingual_v2" } = options;

    try {
      const response = await axios.post(
        this.createPreviewUrl,
        {
          voice_description,
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
          "ElevenLabs Voice Preview Error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }

  async createVoiceFromPreview(
    options: CreateVoiceFromPreviewOptions
  ): Promise<CreateVoiceResponse> {
    const { voice_name, voice_description, generated_voice_id } = options;

    try {
      const response = await axios.post(
        this.createVoiceUrl,
        {
          voice_name,
          voice_description,
          generated_voice_id,
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
          "ElevenLabs Create Voice Error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }

  async downloadPreview(
    previewUrl: string,
    outputPath: string
  ): Promise<string> {
    try {
      const response = await axios.get(previewUrl, {
        responseType: "arraybuffer",
      });

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save the preview audio
      fs.writeFileSync(outputPath, Buffer.from(response.data));
      return outputPath;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "Error downloading preview:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }
}

// Example usage:
export async function generateAndCreateVoice(
  voiceName: string,
  voiceDescription: string,
  outputFilename: string
): Promise<{
  previewUrl: string;
  voiceId: string;
  outputPath: string;
  createdVoiceId: string;
}> {
  const preview = new ElevenLabsVoicePreview(
    process.env.ELEVENLABS_API_KEY || ""
  );

  try {
    // First, create a preview
    const previewResponse = await preview.createVoicePreview({
      voice_description: voiceDescription,
    });

    // Download the preview
    const outputPath = await preview.downloadPreview(
      previewResponse.preview_url,
      path.join(process.cwd(), "output", outputFilename)
    );

    // Create the voice from the preview
    const voiceResponse = await preview.createVoiceFromPreview({
      voice_name: voiceName,
      voice_description: voiceDescription,
      generated_voice_id: previewResponse.voice_id,
    });

    console.log("✅ Voice preview saved to:", outputPath);
    console.log("✅ Voice created with ID:", voiceResponse.voice_id);

    return {
      previewUrl: previewResponse.preview_url,
      voiceId: previewResponse.voice_id,
      outputPath,
      createdVoiceId: voiceResponse.voice_id,
    };
  } catch (error) {
    console.error("❌ Error in voice generation process:", error);
    throw error;
  }
}
