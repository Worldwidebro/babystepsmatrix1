import { WebScrapingService } from "../services/web-scraping-service";
import fs from "fs";
import path from "path";

async function testWebScraping() {
  try {
    const service = new WebScrapingService();

    // Test E-commerce scraping
    console.log("Testing E-commerce scraping...");
    const productContent = await service.scrapeEcommerceProduct(
      "https://example.com/product/123"
    );
    console.log("Product content:", productContent);

    // Test Job Board scraping
    console.log("\nTesting Job Board scraping...");
    const jobContent = await service.scrapeJobListing(
      "https://example.com/jobs/456"
    );
    console.log("Job content:", jobContent);

    // Test Real Estate scraping
    console.log("\nTesting Real Estate scraping...");
    const propertyContent = await service.scrapePropertyListing(
      "https://example.com/property/789"
    );
    console.log("Property content:", propertyContent);

    // Test Social Media scraping
    console.log("\nTesting Social Media scraping...");
    const socialContent = await service.scrapeSocialMediaPost(
      "https://example.com/post/101"
    );
    console.log("Social media content:", socialContent);

    // Test Financial Data scraping
    console.log("\nTesting Financial Data scraping...");
    const financialContent = await service.scrapeFinancialData(
      "https://example.com/stock/AAPL"
    );
    console.log("Financial content:", financialContent);

    // Test speech conversion for scraped content
    console.log("\nTesting speech conversion...");
    const voiceId = "your_voice_id"; // Replace with actual voice ID
    const contentWithSpeech = await service.convertToSpeech(
      productContent,
      voiceId
    );
    console.log("Content with speech:", contentWithSpeech);

    // Save audio to file
    if (contentWithSpeech.audio) {
      const outputPath = path.join(
        __dirname,
        "../../output/scraped-content.mp3"
      );
      fs.writeFileSync(outputPath, contentWithSpeech.audio);
      console.log("Audio saved to:", outputPath);
    }

    // Test batch processing with multiple pages
    console.log("\nTesting batch processing...");
    const batchResults = await service.batchProcessWithSpeech(
      {
        url: "https://example.com/products",
        selectors: {
          title: ".product-title",
          price: ".product-price",
          content: ".product-description",
        },
        maxPages: 2,
      },
      voiceId
    );
    console.log("Batch processing results:", batchResults);

    // Test caching
    console.log("\nTesting caching...");
    await service.cacheContent(
      "https://example.com/product/123",
      productContent
    );
    const cachedContent = await service.getCachedContent(
      "https://example.com/product/123"
    );
    console.log("Cached content:", cachedContent);

    // Test dynamic content scraping
    console.log("\nTesting dynamic content scraping...");
    const dynamicContent = await service.scrapeDynamicContent({
      url: "https://example.com/dynamic",
      selectors: {
        content: ".dynamic-content",
      },
    });
    console.log("Dynamic content:", dynamicContent);
  } catch (error) {
    console.error("Error testing web scraping:", error);
  }
}

testWebScraping();
