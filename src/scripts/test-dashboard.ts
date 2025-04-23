import { DashboardService } from "../services/dashboard-service";

async function testDashboard() {
  try {
    const dashboard = new DashboardService();

    // Test service status updates
    console.log("Testing service status updates...");
    dashboard.updateServiceStatus("elevenLabs", "running", 50);
    dashboard.updateServiceStatus("webScraping", "completed", 100);
    dashboard.updateServiceStatus(
      "whisper",
      "error",
      0,
      "API rate limit exceeded"
    );

    // Get all service statuses
    const statuses = dashboard.getAllServiceStatuses();
    console.log("Service statuses:", statuses);

    // Test metrics updates
    console.log("\nTesting metrics updates...");
    await dashboard.updateMetrics();
    const metrics = dashboard.getMetrics();
    console.log("Current metrics:", metrics);

    // Test activity logging
    console.log("\nTesting activity logging...");
    await dashboard.logActivity("elevenLabs", "voice_generation", {
      voiceId: "123",
      text: "Hello world",
      duration: 5.2,
    });

    await dashboard.logActivity("webScraping", "page_scraped", {
      url: "https://example.com",
      items: 10,
    });

    await dashboard.logActivity("whisper", "transcription_completed", {
      audioId: "456",
      duration: 30,
      language: "en",
    });

    // Get activity log
    const activityLog = await dashboard.getActivityLog();
    console.log("Activity log:", activityLog);

    // Get system health
    console.log("\nTesting system health...");
    const health = await dashboard.getSystemHealth();
    console.log("System health:", health);

    // Test event listeners
    dashboard.on("statusUpdate", (status) => {
      console.log("Status update:", status);
    });

    dashboard.on("metricsUpdate", (metrics) => {
      console.log("Metrics update:", metrics);
    });

    // Simulate some updates
    dashboard.updateServiceStatus("elevenLabs", "completed", 100);
    await dashboard.updateMetrics();
  } catch (error) {
    console.error("Error testing dashboard:", error);
  }
}

testDashboard();
