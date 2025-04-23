import dotenv from "dotenv";
import { createStripeService } from "../services/stripe-service";

dotenv.config();

async function testStripe() {
  console.log("💳 Testing Stripe Integration...\n");

  // Verify environment variables
  const requiredVars = ["STRIPE_SECRET_KEY"];

  console.log("🔑 Checking environment variables:");
  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
      // Mask the value for security
      const maskedValue =
        value.substring(0, 4) + "..." + value.substring(value.length - 4);
      console.log(`✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  });

  try {
    const stripe = createStripeService();

    // Test creating a customer
    console.log("\n👤 Testing customer creation...");
    const customer = await stripe.createCustomer({
      email: "winnerscirclewcllc@gmail.com",
      name: "Test Customer",
      phone: "(855) 770-3291",
    });
    console.log("✅ Customer created:", customer.id);

    // Test creating a payment intent
    console.log("\n💰 Testing payment intent creation...");
    const paymentIntent = await stripe.createPaymentIntent({
      amount: 2000, // $20.00
      currency: "usd",
      customer: customer.id,
      description: "Test payment",
    });
    console.log("✅ Payment intent created:", paymentIntent.id);

    // Test retrieving customer
    console.log("\n🔍 Testing customer retrieval...");
    const retrievedCustomer = await stripe.getCustomer(customer.id);
    console.log("✅ Customer retrieved:", retrievedCustomer.id);

    // Test listing customers
    console.log("\n📋 Testing customer listing...");
    const customers = await stripe.listCustomers(5);
    console.log(`✅ Retrieved ${customers.length} customers`);

    console.log("\n✅ Stripe integration test completed successfully!");
  } catch (error) {
    console.error("\n❌ Error in Stripe test:", error);
  }
}

testStripe().catch(console.error);
