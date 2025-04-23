import { FinancialDashboardService } from "../services/financial-dashboard-service";
import fs from "fs";
import path from "path";

async function testFinancialDashboard() {
  try {
    const dashboard = new FinancialDashboardService();

    // Test bank transactions
    console.log("Testing bank transactions...");
    const bankTransactions = await dashboard.fetchBankTransactions(
      process.env.PLAID_ACCESS_TOKEN || "",
      "2024-01-01",
      "2024-03-01"
    );
    console.log("Bank transactions:", bankTransactions);

    // Test Stripe revenue
    console.log("\nTesting Stripe revenue...");
    const stripeTransactions = await dashboard.fetchStripeRevenue();
    console.log("Stripe transactions:", stripeTransactions);

    // Test metrics update
    console.log("\nTesting metrics update...");
    await dashboard.updateMetrics();
    const metrics = dashboard.getMetrics();
    console.log("Current metrics:", metrics);

    // Test report generation
    console.log("\nTesting report generation...");
    const report = await dashboard.generateReport();
    console.log("Financial report:", report);

    // Save report to file
    const outputPath = path.join(
      __dirname,
      "../../output/financial-report.json"
    );
    fs.writeFileSync(outputPath, report);
    console.log("Report saved to:", outputPath);

    // Test caching
    console.log("\nTesting caching...");
    const cachedMetrics = await dashboard.getCachedMetrics();
    console.log("Cached metrics:", cachedMetrics);

    // Test event listeners
    dashboard.on("metricsUpdate", (metrics) => {
      console.log("Metrics update:", metrics);
    });

    // Simulate some updates
    await dashboard.updateMetrics();
  } catch (error) {
    console.error("Error testing financial dashboard:", error);
  }
}

testFinancialDashboard();
