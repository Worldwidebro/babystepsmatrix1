import { supabase } from "../config/supabase";
import { createReplitService } from "./replit-service";
import { createStripeService } from "./stripe-service";
import { createResendService } from "./resend-service";
import { createTwilioService } from "./twilio-service";

interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  timestamp: string;
  components: {
    database: {
      status: "healthy" | "unhealthy";
      message?: string;
    };
    replit: {
      status: "healthy" | "unhealthy";
      message?: string;
    };
    stripe: {
      status: "healthy" | "unhealthy";
      message?: string;
    };
    email: {
      status: "healthy" | "unhealthy";
      message?: string;
    };
    sms: {
      status: "healthy" | "unhealthy";
      message?: string;
    };
  };
}

export class HealthService {
  async checkHealth(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      components: {
        database: { status: "unhealthy" },
        replit: { status: "unhealthy" },
        stripe: { status: "unhealthy" },
        email: { status: "unhealthy" },
        sms: { status: "unhealthy" },
      },
    };

    try {
      // Check Supabase connection
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("count")
          .limit(1);
        if (error) throw error;
        result.components.database = {
          status: "healthy",
          message: "Database connection successful",
        };
      } catch (error) {
        result.components.database = {
          status: "unhealthy",
          message: "Database connection failed",
        };
      }

      // Check Replit status
      try {
        const replit = createReplitService();
        const isHealthy = await replit.checkHealth();
        result.components.replit = {
          status: isHealthy ? "healthy" : "unhealthy",
          message: isHealthy ? "Replit is running" : "Replit is not running",
        };
      } catch (error) {
        result.components.replit = {
          status: "unhealthy",
          message: "Replit health check failed",
        };
      }

      // Check Stripe connection
      try {
        const stripe = createStripeService();
        await stripe.listCustomers(1);
        result.components.stripe = {
          status: "healthy",
          message: "Stripe connection successful",
        };
      } catch (error) {
        result.components.stripe = {
          status: "unhealthy",
          message: "Stripe connection failed",
        };
      }

      // Check Resend (email) connection
      try {
        const resend = createResendService();
        await resend.sendEmail({
          to: "test@example.com",
          subject: "Health Check",
          html: "<p>This is a health check email</p>",
        });
        result.components.email = {
          status: "healthy",
          message: "Email service is working",
        };
      } catch (error) {
        result.components.email = {
          status: "unhealthy",
          message: "Email service check failed",
        };
      }

      // Check Twilio (SMS) connection
      try {
        const twilio = createTwilioService();
        await twilio.getMessageHistory(1);
        result.components.sms = {
          status: "healthy",
          message: "SMS service is working",
        };
      } catch (error) {
        result.components.sms = {
          status: "unhealthy",
          message: "SMS service check failed",
        };
      }

      // Set overall status
      result.status = Object.values(result.components).every(
        (component) => component.status === "healthy"
      )
        ? "healthy"
        : "unhealthy";

      return result;
    } catch (error) {
      console.error("Health check failed:", error);
      result.status = "unhealthy";
      return result;
    }
  }
}

// Example usage:
export function createHealthService(): HealthService {
  return new HealthService();
}
