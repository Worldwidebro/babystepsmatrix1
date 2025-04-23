import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";
import { ElevenLabsClient } from "../services/elevenlabs-service";
import { Stripe } from "stripe";
import { PlaidApi, Configuration as PlaidConfig } from "plaid";

dotenv.config();

// Environment configuration
const config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_SERVICE_KEY!,
    options: {
      db: {
        schema: "public",
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY!,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
    modelId: process.env.ELEVENLABS_MODEL_ID,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    options: {
      apiVersion: "2023-10-16",
    },
  },
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID!,
    secret: process.env.PLAID_SECRET!,
    env: process.env.PLAID_ENV as "sandbox" | "development" | "production",
  },
  aws: {
    region: process.env.AWS_REGION || "us-east-1",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  monitoring: {
    datadog: {
      apiKey: process.env.DD_API_KEY!,
      appKey: process.env.DD_APP_KEY!,
    },
    sentry: {
      dsn: process.env.SENTRY_DSN!,
    },
  },
};

// Service clients
export const supabase = createClient(
  config.supabase.url,
  config.supabase.key,
  config.supabase.options
);

export const openai = new OpenAIApi(
  new Configuration({
    apiKey: config.openai.apiKey,
  })
);

export const elevenlabs = new ElevenLabsClient({
  apiKey: config.elevenlabs.apiKey,
  voiceId: config.elevenlabs.voiceId,
  modelId: config.elevenlabs.modelId,
});

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: config.stripe.options.apiVersion,
});

export const plaid = new PlaidApi(
  new PlaidConfig({
    basePath:
      config.plaid.env === "production"
        ? "https://production.plaid.com"
        : config.plaid.env === "development"
          ? "https://development.plaid.com"
          : "https://sandbox.plaid.com",
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": config.plaid.clientId,
        "PLAID-SECRET": config.plaid.secret,
      },
    },
  })
);

export default config;
