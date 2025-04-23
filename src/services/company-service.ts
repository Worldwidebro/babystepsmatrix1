import { supabase } from "../config/services";
import { MCPCrew } from "../../ai_agents/mcp_crew";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";

interface CompanyData {
  id: string;
  name: string;
  category: string;
  type: string;
  services: string[];
  revenue_model: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface CompanyConfig {
  company_info: CompanyData;
  integrations: any;
  infrastructure: any;
  security: any;
  automation: any;
  analytics: any;
  support: any;
  development: any;
}

export class CompanyService {
  private mcp: MCPCrew;
  private configPath: string;

  constructor() {
    this.mcp = new MCPCrew();
    this.configPath = path.join(process.cwd(), "companies/configurations");
  }

  async createCompany(
    data: Omit<CompanyData, "id" | "created_at" | "updated_at">
  ) {
    try {
      // Create company record in database
      const { data: company, error } = await supabase
        .from("companies")
        .insert({
          ...data,
          status: "initializing",
        })
        .select()
        .single();

      if (error) throw error;

      // Generate company configuration
      await this.generateCompanyConfig(company);

      // Initialize company resources
      await this.initializeCompanyResources(company.id);

      // Start MCP monitoring
      await this.mcp.analyze_company(company.id);

      return company;
    } catch (error) {
      console.error("Error creating company:", error);
      throw error;
    }
  }

  async getCompany(id: string) {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching company:", error);
      throw error;
    }
  }

  async updateCompany(id: string, data: Partial<CompanyData>) {
    try {
      const { data: company, error } = await supabase
        .from("companies")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update company configuration if necessary
      if (data.category || data.type || data.services) {
        await this.updateCompanyConfig(company);
      }

      return company;
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  }

  async deleteCompany(id: string) {
    try {
      // Delete company resources
      await this.cleanupCompanyResources(id);

      // Delete company record
      const { error } = await supabase.from("companies").delete().eq("id", id);

      if (error) throw error;

      // Delete company configuration
      await this.deleteCompanyConfig(id);

      return true;
    } catch (error) {
      console.error("Error deleting company:", error);
      throw error;
    }
  }

  async listCompanies(category?: string) {
    try {
      let query = supabase.from("companies").select("*");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error listing companies:", error);
      throw error;
    }
  }

  private async generateCompanyConfig(company: CompanyData) {
    try {
      // Load template configuration
      const templatePath = path.join(
        process.cwd(),
        "companies/businesses.yaml"
      );
      const template = yaml.load(fs.readFileSync(templatePath, "utf8")) as any;

      // Create company-specific configuration
      const config: CompanyConfig = {
        company_info: company,
        ...template.business_config_template,
      };

      // Customize configuration based on company type
      this.customizeConfig(config);

      // Save configuration
      const configFile = path.join(this.configPath, `${company.id}.yaml`);
      fs.writeFileSync(configFile, yaml.dump(config));

      return config;
    } catch (error) {
      console.error("Error generating company configuration:", error);
      throw error;
    }
  }

  private customizeConfig(config: CompanyConfig) {
    const type = config.company_info.type.toLowerCase();

    // Customize AI models for AI companies
    if (type.includes("artificial intelligence")) {
      config.integrations.ai_agents.models.push("llama2", "falcon");
    }

    // Enhance security for financial companies
    if (type.includes("blockchain") || type.includes("cryptocurrency")) {
      config.security.compliance.standards.push("PCI-DSS");
    }

    // Add analytics for marketing companies
    if (type.includes("marketing")) {
      config.analytics.metrics.push(
        "campaign_performance",
        "conversion_rate",
        "roi"
      );
    }

    // Customize infrastructure for data companies
    if (type.includes("data")) {
      config.infrastructure.hosting.services.push("Redshift", "EMR", "Glue");
    }
  }

  private async initializeCompanyResources(companyId: string) {
    try {
      // Create company database schema
      await supabase.rpc("create_company_schema", { company_id: companyId });

      // Initialize storage bucket
      await supabase.storage.createBucket(`company-${companyId}`, {
        public: false,
        allowedMimeTypes: ["image/*", "application/pdf"],
      });

      // Set up authentication roles
      await supabase.rpc("setup_company_roles", { company_id: companyId });

      return true;
    } catch (error) {
      console.error("Error initializing company resources:", error);
      throw error;
    }
  }

  private async cleanupCompanyResources(companyId: string) {
    try {
      // Delete company schema
      await supabase.rpc("drop_company_schema", { company_id: companyId });

      // Delete storage bucket
      await supabase.storage.deleteBucket(`company-${companyId}`);

      // Clean up authentication roles
      await supabase.rpc("cleanup_company_roles", { company_id: companyId });

      return true;
    } catch (error) {
      console.error("Error cleaning up company resources:", error);
      throw error;
    }
  }

  private async updateCompanyConfig(company: CompanyData) {
    try {
      const configFile = path.join(this.configPath, `${company.id}.yaml`);
      const config = yaml.load(
        fs.readFileSync(configFile, "utf8")
      ) as CompanyConfig;

      config.company_info = company;
      this.customizeConfig(config);

      fs.writeFileSync(configFile, yaml.dump(config));
      return config;
    } catch (error) {
      console.error("Error updating company configuration:", error);
      throw error;
    }
  }

  private async deleteCompanyConfig(companyId: string) {
    try {
      const configFile = path.join(this.configPath, `${companyId}.yaml`);
      fs.unlinkSync(configFile);
      return true;
    } catch (error) {
      console.error("Error deleting company configuration:", error);
      throw error;
    }
  }
}
