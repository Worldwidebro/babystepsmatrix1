import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { EventEmitter } from "events";
import axios from "axios";
import Stripe from "stripe";
import { PlaidClient, Configuration, PlaidApi } from "plaid";
import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { Perplexity } from "@perplexity/sdk";
import { Grok } from "@grok/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DeepSeek } from "@deepseek/sdk";
import { HuggingFace } from "@huggingface/sdk";
import { MonkeyLearn } from "@monkeylearn/sdk";
import { MeaningCloud } from "@meaningcloud/sdk";
import { Klippa } from "@klippa/sdk";
import { Zapier } from "@zapier/sdk";
import { Make } from "@make/sdk";
import { Pipedream } from "@pipedream/sdk";
import { N8n } from "@n8n/sdk";
import { AWS } from "aws-sdk";
import { GoogleCloud } from "@google-cloud/sdk";
import { Firebase } from "@firebase/sdk";
import { Airtable } from "airtable";
import { DataHawk } from "@datahawk/sdk";
import { Price2Spy } from "@price2spy/sdk";
import { Audiense } from "@audiense/sdk";
import { Socialgrep } from "@socialgrep/sdk";
import { SerpAPI } from "@serpapi/sdk";
import { Estated } from "@estated/sdk";
import { Jobspresso } from "@jobspresso/sdk";
import { Tabula } from "@tabula/sdk";
import { Bubble } from "@bubble/sdk";
import { Retool } from "@retool/sdk";
import { Redis } from "ioredis";
import { Docker } from "@docker/sdk";
import { Pandas } from "@pandas/sdk";
import { Plotly } from "@plotly/sdk";
import { Puppeteer } from "puppeteer";
import { BeautifulSoup } from "beautifulsoup4";
import { Selenium } from "selenium-webdriver";

dotenv.config();

interface IntegrationConfig {
  services: {
    banking?: boolean;
    payments?: boolean;
    ai?: boolean;
    automation?: boolean;
    scraping?: boolean;
    analytics?: boolean;
  };
  credentials: {
    [key: string]: string;
  };
}

interface ServiceStatus {
  name: string;
  status: "idle" | "running" | "completed" | "error";
  lastUpdate: Date;
  error?: string;
}

export class IntegrationService extends EventEmitter {
  private supabase: any;
  private config: IntegrationConfig;
  private services: Map<string, any>;
  private statuses: Map<string, ServiceStatus>;

  constructor(config: IntegrationConfig) {
    super();
    this.supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || ""
    );
    this.config = config;
    this.services = new Map();
    this.statuses = new Map();
    this.initializeServices();
  }

  // Initialize Services
  private async initializeServices(): Promise<void> {
    try {
      // Banking & Payments
      if (this.config.services.banking) {
        this.services.set(
          "plaid",
          new PlaidApi(
            new Configuration({
              basePath:
                process.env.PLAID_ENV === "sandbox" ? "sandbox" : "development",
              baseOptions: {
                headers: {
                  "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
                  "PLAID-SECRET": process.env.PLAID_SECRET,
                },
              },
            })
          )
        );

        this.services.set(
          "stripe",
          new Stripe(process.env.STRIPE_SECRET_KEY || "", {
            apiVersion: "2023-10-16",
          })
        );
      }

      // AI Services
      if (this.config.services.ai) {
        this.services.set(
          "openai",
          new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          })
        );

        this.services.set(
          "anthropic",
          new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
          })
        );

        this.services.set(
          "perplexity",
          new Perplexity({
            apiKey: process.env.PERPLEXITY_API_KEY,
          })
        );

        this.services.set(
          "grok",
          new Grok({
            apiKey: process.env.GROK_API_KEY,
          })
        );

        this.services.set(
          "gemini",
          new GoogleGenerativeAI({
            apiKey: process.env.GEMINI_API_KEY,
          })
        );

        this.services.set(
          "deepseek",
          new DeepSeek({
            apiKey: process.env.DEEPSEEK_API_KEY,
          })
        );

        this.services.set(
          "huggingface",
          new HuggingFace({
            apiKey: process.env.HUGGINGFACE_API_KEY,
          })
        );

        this.services.set(
          "monkeylearn",
          new MonkeyLearn({
            apiKey: process.env.MONKEYLEARN_API_KEY,
          })
        );

        this.services.set(
          "meaningcloud",
          new MeaningCloud({
            apiKey: process.env.MEANINGCLOUD_API_KEY,
          })
        );

        this.services.set(
          "klippa",
          new Klippa({
            apiKey: process.env.KLIPPA_API_KEY,
          })
        );
      }

      // Automation Services
      if (this.config.services.automation) {
        this.services.set(
          "zapier",
          new Zapier({
            apiKey: process.env.ZAPIER_API_KEY,
          })
        );

        this.services.set(
          "make",
          new Make({
            apiKey: process.env.MAKE_API_KEY,
          })
        );

        this.services.set(
          "pipedream",
          new Pipedream({
            apiKey: process.env.PIPEDREAM_API_KEY,
          })
        );

        this.services.set(
          "n8n",
          new N8n({
            apiKey: process.env.N8N_API_KEY,
          })
        );
      }

      // Cloud Services
      this.services.set(
        "aws",
        new AWS({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION,
        })
      );

      this.services.set(
        "gcloud",
        new GoogleCloud({
          projectId: process.env.GCLOUD_PROJECT_ID,
          credentials: JSON.parse(process.env.GCLOUD_CREDENTIALS || "{}"),
        })
      );

      this.services.set(
        "firebase",
        new Firebase({
          projectId: process.env.FIREBASE_PROJECT_ID,
          credentials: JSON.parse(process.env.FIREBASE_CREDENTIALS || "{}"),
        })
      );

      // Database Services
      this.services.set(
        "airtable",
        new Airtable({
          apiKey: process.env.AIRTABLE_API_KEY,
        })
      );

      this.services.set("redis", new Redis(process.env.REDIS_URL));

      // Analytics Services
      if (this.config.services.analytics) {
        this.services.set(
          "datahawk",
          new DataHawk({
            apiKey: process.env.DATAHAWK_API_KEY,
          })
        );

        this.services.set(
          "price2spy",
          new Price2Spy({
            apiKey: process.env.PRICE2SPY_API_KEY,
          })
        );

        this.services.set(
          "audiense",
          new Audiense({
            apiKey: process.env.AUDIENSE_API_KEY,
          })
        );

        this.services.set(
          "socialgrep",
          new Socialgrep({
            apiKey: process.env.SOCIALGREP_API_KEY,
          })
        );

        this.services.set(
          "serpapi",
          new SerpAPI({
            apiKey: process.env.SERPAPI_API_KEY,
          })
        );

        this.services.set(
          "estated",
          new Estated({
            apiKey: process.env.ESTATED_API_KEY,
          })
        );

        this.services.set(
          "jobspresso",
          new Jobspresso({
            apiKey: process.env.JOBSPRESSO_API_KEY,
          })
        );
      }

      // Scraping Services
      if (this.config.services.scraping) {
        this.services.set("puppeteer", await Puppeteer.launch());
        this.services.set("beautifulsoup", new BeautifulSoup());
        this.services.set("selenium", await new Selenium.Builder().build());
      }

      // Visualization Services
      this.services.set(
        "plotly",
        new Plotly({
          apiKey: process.env.PLOTLY_API_KEY,
        })
      );

      // Container Services
      this.services.set("docker", new Docker());

      // Data Processing
      this.services.set("pandas", new Pandas());

      // Update service statuses
      for (const [name, service] of this.services.entries()) {
        this.updateServiceStatus(name, "idle");
      }
    } catch (error) {
      console.error("Error initializing services:", error);
      throw error;
    }
  }

  // Update Service Status
  updateServiceStatus(
    serviceName: string,
    status: ServiceStatus["status"],
    error?: string
  ): void {
    const serviceStatus: ServiceStatus = {
      name: serviceName,
      status,
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

  // Get Service
  getService<T>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T;
  }

  // Execute Workflow
  async executeWorkflow(workflow: {
    steps: {
      service: string;
      action: string;
      params: any;
    }[];
  }): Promise<any> {
    try {
      const results = [];
      for (const step of workflow.steps) {
        const service = this.getService(step.service);
        if (!service) {
          throw new Error(`Service ${step.service} not found`);
        }

        this.updateServiceStatus(step.service, "running");
        const result = await service[step.action](step.params);
        results.push(result);
        this.updateServiceStatus(step.service, "completed");
      }
      return results;
    } catch (error) {
      console.error("Error executing workflow:", error);
      throw error;
    }
  }

  // Log Activity
  async logActivity(
    serviceName: string,
    action: string,
    details: any
  ): Promise<void> {
    try {
      await this.supabase.from("integration_logs").insert({
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
        .from("integration_logs")
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
      const recentActivity = await this.getActivityLog(undefined, 10);

      return {
        status: statuses.every((s) => s.status !== "error")
          ? "healthy"
          : "unhealthy",
        services: statuses,
        recentActivity,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error getting system health:", error);
      throw error;
    }
  }
}
