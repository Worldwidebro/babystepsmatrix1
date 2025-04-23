import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

interface PaymentIntentOptions {
  amount: number;
  currency: string;
  customer?: string;
  payment_method?: string;
  description?: string;
  metadata?: Record<string, string>;
}

interface CreateCustomerOptions {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2023-10-16",
    });
  }

  async createPaymentIntent(
    options: PaymentIntentOptions
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: options.amount,
        currency: options.currency,
        customer: options.customer,
        payment_method: options.payment_method,
        description: options.description,
        metadata: options.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log("✅ Payment intent created:", paymentIntent.id);
      return paymentIntent;
    } catch (error) {
      console.error("❌ Error creating payment intent:", error);
      throw error;
    }
  }

  async createCustomer(
    options: CreateCustomerOptions
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: options.email,
        name: options.name,
        phone: options.phone,
        metadata: options.metadata,
      });

      console.log("✅ Customer created:", customer.id);
      return customer;
    } catch (error) {
      console.error("❌ Error creating customer:", error);
      throw error;
    }
  }

  async getPaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error("❌ Error retrieving payment intent:", error);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer as Stripe.Customer;
    } catch (error) {
      console.error("❌ Error retrieving customer:", error);
      throw error;
    }
  }

  async listCustomers(limit: number = 10): Promise<Stripe.Customer[]> {
    try {
      const customers = await this.stripe.customers.list({ limit });
      return customers.data;
    } catch (error) {
      console.error("❌ Error listing customers:", error);
      throw error;
    }
  }
}

// Example usage:
export function createStripeService(): StripeService {
  return new StripeService(
    process.env.STRIPE_SECRET_KEY ||
      "pk_test_51RGtYs2c3DlTtJrZc8GgeSr7V0MlKocsaLUG2xPN2bdYUZE6EwdJAz24AlAGInoBz7J2l86F3q3EYerT7f3OpdfS00Poul9ZOS"
  );
}
