import axios from "axios";
import { ElevenLabsService } from "./elevenlabs-service";
import { JSDOM } from "jsdom";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { Element, HTMLImageElement, HTMLAnchorElement } from "jsdom";

dotenv.config();

interface ScrapingConfig {
  url: string;
  selectors: {
    title?: string;
    content?: string;
    images?: string;
    links?: string;
    price?: string;
    rating?: string;
    reviews?: string;
    stock?: string;
    company?: string;
    contact?: string;
    date?: string;
  };
  maxPages?: number;
  delay?: number;
}

interface ScrapedContent {
  title?: string;
  content?: string;
  images?: string[];
  links?: string[];
  audio?: Buffer;
  price?: string;
  rating?: string;
  reviews?: string[];
  stock?: string;
  company?: string;
  contact?: string;
  date?: string;
}

export class WebScrapingService {
  private elevenLabs: ElevenLabsService;
  private supabase: any;
  private proxyConfig: any;

  constructor() {
    this.elevenLabs = new ElevenLabsService();
    this.supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || ""
    );
    this.proxyConfig = {
      proxy: process.env.PROXY_URL,
      auth: {
        username: process.env.PROXY_USERNAME,
        password: process.env.PROXY_PASSWORD,
      },
    };
  }

  // E-commerce Scraping
  async scrapeEcommerceProduct(url: string): Promise<ScrapedContent> {
    const config: ScrapingConfig = {
      url,
      selectors: {
        title: "h1.product-title",
        price: ".product-price",
        rating: ".product-rating",
        reviews: ".product-review",
        stock: ".product-stock",
        images: ".product-image",
      },
    };
    return this.scrapeContent(config);
  }

  // Job Board Scraping
  async scrapeJobListing(url: string): Promise<ScrapedContent> {
    const config: ScrapingConfig = {
      url,
      selectors: {
        title: ".job-title",
        company: ".company-name",
        content: ".job-description",
        date: ".posting-date",
        contact: ".contact-info",
      },
    };
    return this.scrapeContent(config);
  }

  // Real Estate Scraping
  async scrapePropertyListing(url: string): Promise<ScrapedContent> {
    const config: ScrapingConfig = {
      url,
      selectors: {
        title: ".property-title",
        price: ".property-price",
        content: ".property-description",
        images: ".property-image",
        date: ".listing-date",
      },
    };
    return this.scrapeContent(config);
  }

  // Social Media Scraping
  async scrapeSocialMediaPost(url: string): Promise<ScrapedContent> {
    const config: ScrapingConfig = {
      url,
      selectors: {
        content: ".post-content",
        date: ".post-date",
        images: ".post-image",
        links: ".post-link",
      },
    };
    return this.scrapeContent(config);
  }

  // Financial Data Scraping
  async scrapeFinancialData(url: string): Promise<ScrapedContent> {
    const config: ScrapingConfig = {
      url,
      selectors: {
        title: ".stock-title",
        price: ".stock-price",
        content: ".financial-data",
        date: ".data-date",
      },
    };
    return this.scrapeContent(config);
  }

  // Basic Web Scraping
  async scrapeContent(config: ScrapingConfig): Promise<ScrapedContent> {
    try {
      const response = await axios.get(config.url, this.proxyConfig);
      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      const content: ScrapedContent = {};

      if (config.selectors.title) {
        content.title = document
          .querySelector(config.selectors.title)
          ?.textContent?.trim();
      }

      if (config.selectors.content) {
        content.content = document
          .querySelector(config.selectors.content)
          ?.textContent?.trim();
      }

      if (config.selectors.price) {
        content.price = document
          .querySelector(config.selectors.price)
          ?.textContent?.trim();
      }

      if (config.selectors.rating) {
        content.rating = document
          .querySelector(config.selectors.rating)
          ?.textContent?.trim();
      }

      if (config.selectors.reviews) {
        content.reviews = Array.from(
          document.querySelectorAll(config.selectors.reviews)
        )
          .map((review: Element) => review.textContent?.trim())
          .filter((text): text is string => text !== undefined);
      }

      if (config.selectors.stock) {
        content.stock = document
          .querySelector(config.selectors.stock)
          ?.textContent?.trim();
      }

      if (config.selectors.company) {
        content.company = document
          .querySelector(config.selectors.company)
          ?.textContent?.trim();
      }

      if (config.selectors.contact) {
        content.contact = document
          .querySelector(config.selectors.contact)
          ?.textContent?.trim();
      }

      if (config.selectors.date) {
        content.date = document
          .querySelector(config.selectors.date)
          ?.textContent?.trim();
      }

      if (config.selectors.images) {
        content.images = Array.from(
          document.querySelectorAll(config.selectors.images)
        )
          .map((img: Element) => (img as HTMLImageElement).getAttribute("src"))
          .filter((src): src is string => src !== null);
      }

      if (config.selectors.links) {
        content.links = Array.from(
          document.querySelectorAll(config.selectors.links)
        )
          .map((link: Element) =>
            (link as HTMLAnchorElement).getAttribute("href")
          )
          .filter((href): href is string => href !== null);
      }

      return content;
    } catch (error) {
      console.error("Error scraping content:", error);
      throw error;
    }
  }

  // Multi-page Scraping with Pagination
  async scrapeMultiplePages(config: ScrapingConfig): Promise<ScrapedContent[]> {
    try {
      const results: ScrapedContent[] = [];
      let currentPage = 1;
      const maxPages = config.maxPages || 1;

      while (currentPage <= maxPages) {
        const pageUrl = `${config.url}?page=${currentPage}`;
        const content = await this.scrapeContent({ ...config, url: pageUrl });
        results.push(content);

        if (config.delay) {
          await new Promise((resolve) => setTimeout(resolve, config.delay));
        }

        currentPage++;
      }

      return results;
    } catch (error) {
      console.error("Error scraping multiple pages:", error);
      throw error;
    }
  }

  // Convert Scraped Content to Speech
  async convertToSpeech(
    content: ScrapedContent,
    voiceId: string
  ): Promise<ScrapedContent> {
    try {
      if (content.content) {
        const audioBuffer = await this.elevenLabs.generateSpeech(
          content.content,
          voiceId
        );
        content.audio = audioBuffer;
      }
      return content;
    } catch (error) {
      console.error("Error converting content to speech:", error);
      throw error;
    }
  }

  // Batch Processing with Speech Conversion
  async batchProcessWithSpeech(
    config: ScrapingConfig,
    voiceId: string
  ): Promise<ScrapedContent[]> {
    try {
      const contents = await this.scrapeMultiplePages(config);
      const processedContents = await Promise.all(
        contents.map((content) => this.convertToSpeech(content, voiceId))
      );
      return processedContents;
    } catch (error) {
      console.error("Error in batch processing:", error);
      throw error;
    }
  }

  // Cache Scraped Content
  async cacheContent(url: string, content: ScrapedContent): Promise<void> {
    try {
      await this.supabase.from("scraped_content").insert({
        url,
        title: content.title,
        content: content.content,
        images: content.images,
        links: content.links,
        audio: content.audio,
        price: content.price,
        rating: content.rating,
        reviews: content.reviews,
        stock: content.stock,
        company: content.company,
        contact: content.contact,
        date: content.date,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error caching content:", error);
      throw error;
    }
  }

  // Get Cached Content
  async getCachedContent(url: string): Promise<ScrapedContent | null> {
    try {
      const { data, error } = await this.supabase
        .from("scraped_content")
        .select("*")
        .eq("url", url)
        .single();

      if (error || !data) return null;

      return {
        title: data.title,
        content: data.content,
        images: data.images,
        links: data.links,
        audio: data.audio ? Buffer.from(data.audio) : undefined,
        price: data.price,
        rating: data.rating,
        reviews: data.reviews,
        stock: data.stock,
        company: data.company,
        contact: data.contact,
        date: data.date,
      };
    } catch (error) {
      console.error("Error retrieving cached content:", error);
      return null;
    }
  }

  // Handle Dynamic Content (JavaScript-heavy sites)
  async scrapeDynamicContent(config: ScrapingConfig): Promise<ScrapedContent> {
    try {
      // Use a headless browser or service like ScrapingBee
      const response = await axios.post(
        "https://app.scrapingbee.com/api/v1/",
        {
          url: config.url,
          render_js: true,
          wait_for: config.selectors.content,
        },
        {
          headers: {
            "api-key": process.env.SCRAPINGBEE_API_KEY,
          },
        }
      );

      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      return this.scrapeContent({ ...config, url: response.data });
    } catch (error) {
      console.error("Error scraping dynamic content:", error);
      throw error;
    }
  }
}
