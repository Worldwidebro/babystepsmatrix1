import { IntegrationService } from "../services/integration-service";

async function testIntegration() {
  try {
    // Initialize integration service with all services enabled
    const integration = new IntegrationService({
      services: {
        banking: true,
        payments: true,
        ai: true,
        automation: true,
        scraping: true,
        analytics: true,
      },
      credentials: {},
    });

    // Test service status updates
    console.log("Testing service status updates...");
    integration.updateServiceStatus("plaid", "running");
    integration.updateServiceStatus("stripe", "completed");
    integration.updateServiceStatus(
      "openai",
      "error",
      "API rate limit exceeded"
    );

    // Get all service statuses
    const statuses = integration.getAllServiceStatuses();
    console.log("Service statuses:", statuses);

    // Test workflow execution
    console.log("\nTesting workflow execution...");
    const workflow = {
      steps: [
        {
          service: "plaid",
          action: "transactionsGet",
          params: {
            access_token: process.env.PLAID_ACCESS_TOKEN,
            start_date: "2024-01-01",
            end_date: "2024-03-01",
          },
        },
        {
          service: "stripe",
          action: "invoices.list",
          params: {
            limit: 100,
            status: "paid",
          },
        },
        {
          service: "openai",
          action: "chat.completions.create",
          params: {
            model: "gpt-4",
            messages: [
              {
                role: "user",
                content:
                  "Analyze these transactions and suggest optimizations.",
              },
            ],
          },
        },
      ],
    };

    const results = await integration.executeWorkflow(workflow);
    console.log("Workflow results:", results);

    // Test activity logging
    console.log("\nTesting activity logging...");
    await integration.logActivity("plaid", "transactions_fetched", {
      count: 100,
      date: new Date().toISOString(),
    });

    await integration.logActivity("stripe", "invoices_processed", {
      count: 50,
      total: 5000,
    });

    await integration.logActivity("openai", "analysis_completed", {
      model: "gpt-4",
      tokens: 1000,
    });

    // Get activity log
    const activityLog = await integration.getActivityLog();
    console.log("Activity log:", activityLog);

    // Get system health
    console.log("\nTesting system health...");
    const health = await integration.getSystemHealth();
    console.log("System health:", health);

    // Test event listeners
    integration.on("statusUpdate", (status) => {
      console.log("Status update:", status);
    });

    // Simulate some updates
    integration.updateServiceStatus("plaid", "completed");
    integration.updateServiceStatus("stripe", "running");
  } catch (error) {
    console.error("Error testing integration:", error);
  }
}

testIntegration();
