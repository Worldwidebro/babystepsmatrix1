import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface MonitorOptions {
  name: string;
  url: string;
  type: "http" | "keyword";
  keyword_type?: "exists" | "not_exists";
  keyword_value?: string;
  interval?: number;
  timeout?: number;
  retries?: number;
}

interface MonitorResponse {
  id: string;
  status: string;
  name: string;
  url: string;
  type: string;
  keyword_type?: string;
  keyword_value?: string;
}

export class UptimeRobotService {
  private readonly baseUrl = "https://api.uptimerobot.com/v2";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createMonitor(options: MonitorOptions): Promise<MonitorResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/newMonitor`, {
        api_key: this.apiKey,
        format: "json",
        type: options.type === "keyword" ? 2 : 1, // 1 for HTTP, 2 for Keyword
        name: options.name,
        url: options.url,
        keyword_type: options.keyword_type || "exists",
        keyword_value: options.keyword_value || '"status":"healthy"',
        interval: options.interval || 300, // 5 minutes
        timeout: options.timeout || 30,
        retries: options.retries || 2,
      });

      if (response.data.stat === "ok") {
        console.log(
          "✅ Monitor created successfully:",
          response.data.monitor.id
        );
        return response.data.monitor;
      } else {
        throw new Error(response.data.error.message);
      }
    } catch (error) {
      console.error("❌ Error creating monitor:", error);
      throw error;
    }
  }

  async getMonitors(): Promise<MonitorResponse[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/getMonitors`, {
        api_key: this.apiKey,
        format: "json",
      });

      if (response.data.stat === "ok") {
        return response.data.monitors;
      } else {
        throw new Error(response.data.error.message);
      }
    } catch (error) {
      console.error("❌ Error getting monitors:", error);
      throw error;
    }
  }

  async deleteMonitor(monitorId: string): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/deleteMonitor`, {
        api_key: this.apiKey,
        format: "json",
        id: monitorId,
      });

      if (response.data.stat === "ok") {
        console.log("✅ Monitor deleted successfully:", monitorId);
      } else {
        throw new Error(response.data.error.message);
      }
    } catch (error) {
      console.error("❌ Error deleting monitor:", error);
      throw error;
    }
  }
}

// Example usage:
export function createUptimeRobotService(): UptimeRobotService {
  return new UptimeRobotService(process.env.UPTIMEROBOT_API_KEY || "");
}
