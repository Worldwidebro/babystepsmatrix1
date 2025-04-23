import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface ReplitConfig {
  replId: string;
  apiKey: string;
}

interface RestartOptions {
  reason?: string;
  waitForReady?: boolean;
}

export class ReplitService {
  private readonly baseUrl = "https://api.replit.com/v0";
  private readonly replId: string;
  private readonly apiKey: string;

  constructor(config: ReplitConfig) {
    this.replId = config.replId;
    this.apiKey = config.apiKey;
  }

  async restartRepl(options: RestartOptions = {}): Promise<void> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/repls/${this.replId}/restart`,
        {
          reason: options.reason || "Auto-restart triggered by UptimeRobot",
          waitForReady: options.waitForReady || true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Replit restart initiated:", response.data);
    } catch (error) {
      console.error("❌ Error restarting Replit:", error);
      throw error;
    }
  }

  async getReplStatus(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/repls/${this.replId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("❌ Error getting Replit status:", error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const status = await this.getReplStatus();
      return status.state === "running";
    } catch (error) {
      console.error("❌ Error checking Replit health:", error);
      return false;
    }
  }
}

// Example usage:
export function createReplitService(): ReplitService {
  return new ReplitService({
    replId: process.env.REPLIT_REPL_ID || "",
    apiKey: process.env.REPLIT_API_KEY || "",
  });
}
