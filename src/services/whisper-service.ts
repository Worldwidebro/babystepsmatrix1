import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

interface TranscriptionConfig {
  model?: string;
  language?: string;
  response_format?: string;
  temperature?: number;
  prompt?: string;
}

interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  segments: {
    id: number;
    start: number;
    end: number;
    text: string;
    confidence: number;
  }[];
}

export class WhisperService {
  private apiKey: string;
  private baseUrl: string;
  private supabase: any;

  constructor() {
    this.apiKey = process.env.WHISPER_API_KEY || "";
    this.baseUrl = "https://api.whisper.io/v1";
    this.supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || ""
    );
  }

  // Basic Transcription
  async transcribeAudio(
    audioFile: string | Buffer,
    config: TranscriptionConfig = {}
  ): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();

      if (typeof audioFile === "string") {
        formData.append("file", fs.createReadStream(audioFile));
      } else {
        formData.append("file", new Blob([audioFile]));
      }

      if (config.model) formData.append("model", config.model);
      if (config.language) formData.append("language", config.language);
      if (config.response_format)
        formData.append("response_format", config.response_format);
      if (config.temperature)
        formData.append("temperature", config.temperature.toString());
      if (config.prompt) formData.append("prompt", config.prompt);

      const response = await axios.post(
        `${this.baseUrl}/transcriptions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw error;
    }
  }

  // Real-time Transcription
  async startRealtimeTranscription(
    audioStream: ReadableStream,
    onTranscription: (text: string) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      const reader = audioStream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const formData = new FormData();
        formData.append("file", new Blob([value]));

        const response = await axios.post(
          `${this.baseUrl}/transcriptions/stream`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        onTranscription(response.data.text);
      }
    } catch (error) {
      onError(error);
    }
  }

  // Batch Transcription
  async batchTranscribe(
    audioFiles: (string | Buffer)[],
    config: TranscriptionConfig = {}
  ): Promise<TranscriptionResult[]> {
    try {
      const results = await Promise.all(
        audioFiles.map((file) => this.transcribeAudio(file, config))
      );
      return results;
    } catch (error) {
      console.error("Error in batch transcription:", error);
      throw error;
    }
  }

  // Cache Transcription
  async cacheTranscription(
    audioHash: string,
    result: TranscriptionResult
  ): Promise<void> {
    try {
      await this.supabase.from("transcription_cache").insert({
        audio_hash: audioHash,
        text: result.text,
        language: result.language,
        duration: result.duration,
        segments: result.segments,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error caching transcription:", error);
      throw error;
    }
  }

  // Get Cached Transcription
  async getCachedTranscription(
    audioHash: string
  ): Promise<TranscriptionResult | null> {
    try {
      const { data, error } = await this.supabase
        .from("transcription_cache")
        .select("*")
        .eq("audio_hash", audioHash)
        .single();

      if (error || !data) return null;

      return {
        text: data.text,
        language: data.language,
        duration: data.duration,
        segments: data.segments,
      };
    } catch (error) {
      console.error("Error retrieving cached transcription:", error);
      return null;
    }
  }

  // Generate Audio Hash
  private generateAudioHash(audio: Buffer): string {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(audio).digest("hex");
  }

  // Save Transcription to File
  async saveTranscriptionToFile(
    result: TranscriptionResult,
    outputPath: string
  ): Promise<void> {
    try {
      const content = JSON.stringify(result, null, 2);
      fs.writeFileSync(outputPath, content);
    } catch (error) {
      console.error("Error saving transcription to file:", error);
      throw error;
    }
  }

  // Get Transcription Statistics
  async getTranscriptionStats(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/usage`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting transcription stats:", error);
      throw error;
    }
  }
}
