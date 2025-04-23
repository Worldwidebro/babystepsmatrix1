import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { EventEmitter } from "events";

dotenv.config();

interface ServiceStatus {
  name: string;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  lastUpdate: Date;
  error?: string;
}

interface DashboardMetrics {
  elevenLabs: {
    totalVoices: number;
    totalCharacters: number;
    usageLimit: number;
  };
  webScraping: {
    totalPages: number;
    totalItems: number;
    cacheSize: number;
  };
  whisper: {
    totalTranscriptions: number;
    totalDuration: number;
    usageLimit: number;
  };
}

export class DashboardService extends EventEmitter {
  private supabase: any;
  private statuses: Map<string, ServiceStatus>;
  private metrics: DashboardMetrics;

  constructor() {
    super();
    this.supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || ""
    );
    this.statuses = new Map();
    this.metrics = {
      elevenLabs: {
        totalVoices: 0,
        totalCharacters: 0,
        usageLimit: 0,
      },
      webScraping: {
        totalPages: 0,
        totalItems: 0,
        cacheSize: 0,
      },
      whisper: {
        totalTranscriptions: 0,
        totalDuration: 0,
        usageLimit: 0,
      },
    };
  }

  // Update Service Status
  updateServiceStatus(
    serviceName: string,
    status: ServiceStatus["status"],
    progress: number = 0,
    error?: string
  ): void {
    const serviceStatus: ServiceStatus = {
      name: serviceName,
      status,
      progress,
      lastUpdate: new Date(),
      error,
    };

    this.statuses.set(serviceName, serviceStatus);
    this.emit("statusUpdate", serviceStatus);
  }

  // Get Service Status
  getServiceStatus(serviceName: string): ServiceStatus | undefined {
    return this.statuses.get(serviceName);
  }

  // Get All Service Statuses
  getAllServiceStatuses(): ServiceStatus[] {
    return Array.from(this.statuses.values());
  }

  // Update Metrics
  async updateMetrics(): Promise<void> {
    try {
      // Update ElevenLabs metrics
      const { data: elevenLabsData } = await this.supabase
        .from("elevenlabs_usage")
        .select("*")
        .single();
      if (elevenLabsData) {
        this.metrics.elevenLabs = {
          totalVoices: elevenLabsData.total_voices,
          totalCharacters: elevenLabsData.total_characters,
          usageLimit: elevenLabsData.usage_limit,
        };
      }

      // Update Web Scraping metrics
      const { data: scrapingData } = await this.supabase
        .from("scraped_content")
        .select("count");
      if (scrapingData) {
        this.metrics.webScraping = {
          totalPages: scrapingData.length,
          totalItems: scrapingData.reduce(
            (acc: number, curr: any) => acc + curr.count,
            0
          ),
          cacheSize: await this.getCacheSize(),
        };
      }

      // Update Whisper metrics
      const { data: whisperData } = await this.supabase
        .from("transcription_cache")
        .select("*");
      if (whisperData) {
        this.metrics.whisper = {
          totalTranscriptions: whisperData.length,
          totalDuration: whisperData.reduce(
            (acc: number, curr: any) => acc + curr.duration,
            0
          ),
          usageLimit: 1000000, // Example limit
        };
      }

      this.emit("metricsUpdate", this.metrics);
    } catch (error) {
      console.error("Error updating metrics:", error);
      throw error;
    }
  }

  // Get Current Metrics
  getMetrics(): DashboardMetrics {
    return this.metrics;
  }

  // Get Cache Size
  private async getCacheSize(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from("scraped_content")
        .select("audio");

      if (error) throw error;

      return data.reduce((acc: number, curr: any) => {
        return acc + (curr.audio ? Buffer.from(curr.audio).length : 0);
      }, 0);
    } catch (error) {
      console.error("Error getting cache size:", error);
      return 0;
    }
  }

  // Log Activity
  async logActivity(
    serviceName: string,
    action: string,
    details: any
  ): Promise<void> {
    try {
      await this.supabase.from("activity_log").insert({
        service_name: serviceName,
        action,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error logging activity:", error);
      throw error;
    }
  }

  // Get Activity Log
  async getActivityLog(
    serviceName?: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      let query = this.supabase
        .from("activity_log")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (serviceName) {
        query = query.eq("service_name", serviceName);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error getting activity log:", error);
      throw error;
    }
  }

  // Get System Health
  async getSystemHealth(): Promise<any> {
    try {
      const statuses = this.getAllServiceStatuses();
      const metrics = this.getMetrics();
      const recentActivity = await this.getActivityLog(undefined, 10);

      return {
        status: statuses.every((s) => s.status !== "error")
          ? "healthy"
          : "unhealthy",
        services: statuses,
        metrics,
        recentActivity,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting system health:", error);
      throw error;
    }
  }
}
