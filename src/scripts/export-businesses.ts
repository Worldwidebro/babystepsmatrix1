import { writeFileSync } from "fs";
import { join } from "path";
import { siteConfig } from "../website/config";
import {
  exportToCSV,
  exportToJSON,
  exportToMarkdown,
  exportToNotion,
  exportToTraeAI,
} from "../website/utils/exporters";

const outputDir = join(__dirname, "../../exports");

// Export CSV
writeFileSync(
  join(outputDir, "businesses.csv"),
  exportToCSV(siteConfig.directory.businesses),
);

// Export JSON
writeFileSync(
  join(outputDir, "businesses.json"),
  exportToJSON(siteConfig.directory.businesses),
);

// Export Markdown
writeFileSync(
  join(outputDir, "businesses.md"),
  exportToMarkdown(siteConfig.directory.businesses),
);

// Export Notion format
writeFileSync(
  join(outputDir, "businesses-notion.json"),
  JSON.stringify(exportToNotion(siteConfig.directory.businesses), null, 2),
);

// Export Trae.ai format
writeFileSync(
  join(outputDir, "businesses-trae.json"),
  JSON.stringify(exportToTraeAI(siteConfig.directory.businesses), null, 2),
);

console.log("Exports generated successfully in the exports directory!");
