import WebSocket from "ws";
import { EventEmitter } from "events";

interface StreamOptions {
  text: string;
  voice_id: string;
  model_id?: string;
  api_key: string;
}

interface StreamResponse {
  audio: Buffer;
  isFinal: boolean;
}

export class ElevenLabsStream extends EventEmitter {
  private ws: WebSocket | null = null;
  private readonly baseUrl = "wss://api.elevenlabs.io/v1/text-to-speech";

  constructor(private apiKey: string) {
    super();
  }

  async streamText(options: StreamOptions): Promise<void> {
    const { text, voice_id, model_id = "eleven_multilingual_v2" } = options;

    const url = `${this.baseUrl}/${voice_id}/stream-input`;

    this.ws = new WebSocket(url, {
      headers: {
        "xi-api-key": this.apiKey,
      },
    });

    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error("WebSocket not initialized"));

      this.ws.on("open", () => {
        // Send the initial message with text and model
        this.ws?.send(
          JSON.stringify({
            text,
            model_id,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          })
        );
      });

      this.ws.on("message", (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());

          if (response.audio) {
            this.emit("audio", {
              audio: Buffer.from(response.audio, "base64"),
              isFinal: response.is_final || false,
            });
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      });

      this.ws.on("error", (error) => {
        this.emit("error", error);
        reject(error);
      });

      this.ws.on("close", () => {
        this.emit("close");
        resolve();
      });
    });
  }

  stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Example usage:
export async function streamTextToSpeech(
  text: string,
  voiceId: string
): Promise<void> {
  const streamer = new ElevenLabsStream(process.env.ELEVENLABS_API_KEY || "");

  streamer.on("audio", (response: StreamResponse) => {
    if (response.isFinal) {
      console.log("Stream completed");
    }
    // Process audio chunk here
    console.log("Received audio chunk:", response.audio.length, "bytes");
  });

  streamer.on("error", (error) => {
    console.error("Stream error:", error);
  });

  try {
    await streamer.streamText({
      text,
      voice_id: voiceId,
      api_key: process.env.ELEVENLABS_API_KEY || "",
    });
  } catch (error) {
    console.error("Error streaming text:", error);
  } finally {
    streamer.stop();
  }
}
