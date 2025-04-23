import { Business } from "../types";

export const exportToCSV = (businesses: Business[]): string => {
  const headers = [
    "Name",
    "Category",
    "Description",
    "Status",
    "Launch Date",
    "Revenue Type",
    "Revenue Potential",
    "Automation Level",
    "Startup Cost",
    "Time to Profit",
    "Key Features",
    "Requirements",
    "Integrations",
  ].join(",");

  const rows = businesses.map((business) =>
    [
      `"${business.name}"`,
      business.category,
      `"${business.description}"`,
      business.status,
      business.launchDate || "",
      business.revenue?.type || "",
      business.revenue?.potential || "",
      business.automationLevel,
      business.startupCost,
      business.timeToProfit,
      `"${business.keyFeatures.join("; ")}"`,
      `"${business.requirements?.join("; ") || ""}"`,
      `"${business.integrations?.join("; ") || ""}"`,
    ].join(","),
  );

  return [headers, ...rows].join("\n");
};

export const exportToJSON = (businesses: Business[]): string => {
  return JSON.stringify(businesses, null, 2);
};

export const exportToMarkdown = (businesses: Business[]): string => {
  const categoryGroups = businesses.reduce(
    (acc, business) => {
      if (!acc[business.category]) {
        acc[business.category] = [];
      }
      acc[business.category].push(business);
      return acc;
    },
    {} as Record<string, Business[]>,
  );

  const sections = Object.entries(categoryGroups).map(
    ([category, categoryBusinesses]) => {
      const header = `### ${category}\n\n`;
      const table =
        `| Name | Status | Automation Level | Time to Profit | Startup Cost |\n` +
        `|------|--------|------------------|----------------|---------------|\n` +
        categoryBusinesses
          .map(
            (b) =>
              `| ${b.name} | ${b.status} | ${b.automationLevel} | ${b.timeToProfit} | ${b.startupCost} |`,
          )
          .join("\n");
      return header + table + "\n\n";
    },
  );

  return `# AI Boss Holdings Business Directory\n\n${sections.join("")}`;
};

export const exportToNotion = (
  businesses: Business[],
): Record<string, unknown>[] => {
  return businesses.map((business) => ({
    Name: { title: [{ text: { content: business.name } }] },
    Category: { select: { name: business.category } },
    Description: { rich_text: [{ text: { content: business.description } }] },
    Status: { select: { name: business.status } },
    "Launch Date": {
      date: business.launchDate ? { start: business.launchDate } : null,
    },
    "Automation Level": { select: { name: business.automationLevel } },
    "Startup Cost": { select: { name: business.startupCost } },
    "Time to Profit": { select: { name: business.timeToProfit } },
    "Key Features": {
      multi_select: business.keyFeatures.map((f) => ({ name: f })),
    },
  }));
};

export const exportToTraeAI = (
  businesses: Business[],
): Record<string, unknown> => {
  return {
    blueprint: {
      name: "AI Boss Holdings Empire",
      version: "1.0",
      categories: Object.values(
        businesses.reduce(
          (acc, business) => {
            if (!acc[business.category]) {
              acc[business.category] = {
                name: business.category,
                businesses: [],
              };
            }
            acc[business.category].businesses.push({
              name: business.name,
              description: business.description,
              metrics: {
                automationLevel: business.automationLevel,
                startupCost: business.startupCost,
                timeToProfit: business.timeToProfit,
                revenueType: business.revenue?.type,
                revenuePotential: business.revenue?.potential,
              },
              features: business.keyFeatures,
              requirements: business.requirements || [],
              integrations: business.integrations || [],
            });
            return acc;
          },
          {} as Record<string, any>,
        ),
      ),
    },
  };
};
