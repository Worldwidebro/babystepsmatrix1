import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import WebSocket from "ws";
import FormData from "form-data";

dotenv.config();

interface ElevenLabsConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  settings?: VoiceSettings;
  style?: string;
  version?: string;
  is_archived?: boolean;
  is_shared?: boolean;
}

interface UsageStats {
  character_count: number;
  character_limit: number;
  voice_count: number;
  voice_limit: number;
}

interface PronunciationRule {
  alias: string;
  phoneme: string;
}

interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
}

interface BatchJob {
  job_id: string;
  status: string;
  progress: number;
  result?: any;
}

export class ElevenLabsClient {
  private readonly baseUrl = "https://api.elevenlabs.io/v1";
  private readonly apiKey: string;
  private readonly voiceId?: string;
  private readonly modelId?: string;
  private supabase: any;
  private ws: WebSocket | null = null;

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
    this.voiceId = config.voiceId;
    this.modelId = config.modelId;
    this.supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || ""
    );
  }

  private get headers() {
    return {
      "xi-api-key": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  async textToSpeech(
    text: string,
    voiceId?: string,
    modelId?: string,
    voiceSettings?: VoiceSettings
  ): Promise<Buffer> {
    const endpoint = `${this.baseUrl}/text-to-speech/${voiceId || this.voiceId}`;

    try {
      const response = await axios.post(
        endpoint,
        {
          text,
          model_id: modelId || this.modelId,
          voice_settings: voiceSettings,
        },
        {
          headers: this.headers,
          responseType: "arraybuffer",
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Text-to-speech request failed: ${error}`);
    }
  }

  async getVoices() {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch voices: ${error}`);
    }
  }

  async createVoice(name: string, files: Buffer[], description?: string) {
    const formData = new FormData();
    formData.append("name", name);

    if (description) {
      formData.append("description", description);
    }

    files.forEach((file, index) => {
      formData.append(`files`, file, `sample_${index}.mp3`);
    });

    try {
      const response = await axios.post(
        `${this.baseUrl}/voices/add`,
        formData,
        {
          headers: {
            ...this.headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create voice: ${error}`);
    }
  }

  async editVoice(voiceId: string, name?: string, description?: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voices/${voiceId}/edit`,
        {
          name,
          description,
        },
        {
          headers: this.headers,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to edit voice: ${error}`);
    }
  }

  async deleteVoice(voiceId: string) {
    try {
      const response = await axios.delete(`${this.baseUrl}/voices/${voiceId}`, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete voice: ${error}`);
    }
  }

  async getModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error}`);
    }
  }

  async getSubscription() {
    try {
      const response = await axios.get(`${this.baseUrl}/user/subscription`, {
        headers: this.headers,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch subscription info: ${error}`);
    }
  }

  async getVoiceSettings(voiceId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/voices/${voiceId}/settings`,
        {
          headers: this.headers,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch voice settings: ${error}`);
    }
  }

  async updateVoiceSettings(voiceId: string, settings: VoiceSettings) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voices/${voiceId}/settings/edit`,
        settings,
        {
          headers: this.headers,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update voice settings: ${error}`);
    }
  }

  // Advanced Streaming
  async streamSpeech(
    text: string,
    voiceId: string,
    streamChunkSize: number = 2048,
    onChunk?: (chunk: Buffer) => void
  ): Promise<ReadableStream> {
    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
          }),
        }
      );

      if (onChunk) {
        const reader = response.body?.getReader();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            onChunk(Buffer.from(value));
          }
        }
      }

      return response.body as ReadableStream;
    } catch (error) {
      console.error("Error streaming speech:", error);
      throw error;
    }
  }

  // WebSocket Streaming
  async startWebSocketStream(
    voiceId: string,
    onAudio: (audio: Buffer) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      this.ws = new WebSocket(
        `${this.baseUrl}/text-to-speech/${voiceId}/stream`
      );

      this.ws.on("message", (data: Buffer) => {
        onAudio(data);
      });

      this.ws.on("error", (error) => {
        onError(error);
      });

      this.ws.on("close", () => {
        this.ws = null;
      });
    } catch (error) {
      console.error("Error starting WebSocket stream:", error);
      throw error;
    }
  }

  async sendTextToWebSocket(text: string): Promise<void> {
    if (!this.ws) throw new Error("WebSocket not connected");
    this.ws.send(JSON.stringify({ text }));
  }

  // Voice Cloning
  async cloneVoiceFromAudio(
    name: string,
    audioFiles: File[],
    description?: string
  ): Promise<Voice> {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (description) formData.append("description", description);
      audioFiles.forEach((file) => formData.append("files", file));

      const response = await axios.post(
        `${this.baseUrl}/voices/clone`,
        formData,
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error cloning voice from audio:", error);
      throw error;
    }
  }

  async cloneVoiceFromText(
    name: string,
    textSamples: string[],
    description?: string
  ): Promise<Voice> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voices/clone/text`,
        {
          name,
          description,
          text_samples: textSamples,
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
      console.error("Error cloning voice from text:", error);
      throw error;
    }
  }

  async cloneVoiceFromVideo(
    name: string,
    videoFile: File,
    description?: string
  ): Promise<Voice> {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (description) formData.append("description", description);
      formData.append("video", videoFile);

      const response = await axios.post(
        `${this.baseUrl}/voices/clone/video`,
        formData,
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error cloning voice from video:", error);
      throw error;
    }
  }

  // Speech-to-Text
  async transcribeAudio(audioFile: File): Promise<TranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append("audio", audioFile);

      const response = await axios.post(
        `${this.baseUrl}/speech-to-text`,
        formData,
        {
          headers: {
            "xi-api-key": this.apiKey,
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

  async startRealtimeTranscription(
    onTranscription: (text: string) => void,
    onError: (error: any) => void
  ): Promise<void> {
    try {
      this.ws = new WebSocket(`${this.baseUrl}/speech-to-text/stream`);

      this.ws.on("message", (data: string) => {
        const result = JSON.parse(data);
        onTranscription(result.text);
      });

      this.ws.on("error", (error) => {
        onError(error);
      });

      this.ws.on("close", () => {
        this.ws = null;
      });
    } catch (error) {
      console.error("Error starting realtime transcription:", error);
      throw error;
    }
  }

  // Voice Design
  async designVoice(
    name: string,
    settings: VoiceSettings,
    style?: string
  ): Promise<Voice> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voices/design`,
        {
          name,
          settings,
          style,
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
      console.error("Error designing voice:", error);
      throw error;
    }
  }

  async mixVoiceStyles(
    voiceId: string,
    styleWeights: { [key: string]: number }
  ): Promise<Voice> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/voices/${voiceId}/mix`,
        {
          style_weights: styleWeights,
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
      console.error("Error mixing voice styles:", error);
      throw error;
    }
  }

  // Batch Processing
  async batchTextToSpeech(
    texts: string[],
    voiceId: string,
    model: string = "eleven_multilingual_v2"
  ): Promise<BatchJob> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/batch/text-to-speech`,
        {
          texts,
          voice_id: voiceId,
          model_id: model,
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
      console.error("Error starting batch text-to-speech:", error);
      throw error;
    }
  }

  async getBatchJobStatus(jobId: string): Promise<BatchJob> {
    try {
      const response = await axios.get(`${this.baseUrl}/batch/${jobId}`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error getting batch job status:", error);
      throw error;
    }
  }

  // Voice Library Management
  async shareVoice(voiceId: string, userId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/voices/${voiceId}/share`,
        {
          user_id: userId,
        },
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error sharing voice:", error);
      throw error;
    }
  }

  async archiveVoice(voiceId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/voices/${voiceId}/archive`,
        {},
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error archiving voice:", error);
      throw error;
    }
  }

  async unarchiveVoice(voiceId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/voices/${voiceId}/unarchive`,
        {},
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error unarchiving voice:", error);
      throw error;
    }
  }

  // Voice Management
  async getAvailableVoices(): Promise<Voice[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });
      return response.data.voices;
    } catch (error) {
      console.error("Error fetching voices:", error);
      throw error;
    }
  }

  async createCustomVoice(
    name: string,
    files: File[],
    description?: string
  ): Promise<Voice> {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (description) formData.append("description", description);
      files.forEach((file) => formData.append("files", file));

      const response = await axios.post(`${this.baseUrl}/voices`, formData, {
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating custom voice:", error);
      throw error;
    }
  }

  // Usage and Projects
  async getUsageStats(): Promise<UsageStats> {
    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching usage stats:", error);
      throw error;
    }
  }

  async getProjects(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/projects`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });
      return response.data.projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  }

  // Advanced Features
  async addPronunciationRules(
    voiceId: string,
    rules: PronunciationRule[]
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/voices/${voiceId}/pronunciation-dictionary`,
        { rules },
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error adding pronunciation rules:", error);
      throw error;
    }
  }

  async createDubbing(sourceUrl: string, targetLanguage: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/dubbing`,
        {
          source_url: sourceUrl,
          target_language: targetLanguage,
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
      console.error("Error creating dubbing:", error);
      throw error;
    }
  }

  // Caching
  async cacheAudio(text: string, audio: Buffer): Promise<void> {
    try {
      const textHash = this.hashString(text);
      await this.supabase.from("voice_cache").insert({
        text_hash: textHash,
        audio: audio,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error caching audio:", error);
      throw error;
    }
  }

  async getCachedAudio(text: string): Promise<Buffer | null> {
    try {
      const textHash = this.hashString(text);
      const { data, error } = await this.supabase
        .from("voice_cache")
        .select("audio")
        .eq("text_hash", textHash)
        .single();

      if (error || !data) return null;
      return Buffer.from(data.audio);
    } catch (error) {
      console.error("Error retrieving cached audio:", error);
      return null;
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
}
