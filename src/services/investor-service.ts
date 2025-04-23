import axios from "axios";
import { ServicesConfig } from "../config/services";

interface RiskAnalysis {
  score: number;
  factors: string[];
  recommendations: string[];
}

interface PortfolioData {
  companies: Array<{
    name: string;
    performance: {
      revenue: number;
      growth: number;
      risk: number;
    };
    metrics: Record<string, any>;
  }>;
  totalValue: number;
  riskScore: number;
}

export class InvestorService {
  private ibmWatson = ServicesConfig.investor.ibmWatson;
  private capitalIQ = ServicesConfig.investor.capitalIQ;
  private complianceAI = ServicesConfig.investor.complianceAI;

  async analyzeRisk(portfolioData: any): Promise<RiskAnalysis> {
    try {
      const response = await axios.post(
        `${this.ibmWatson.baseUrl}/analyze-risk`,
        {
          portfolio: portfolioData,
          instanceId: this.ibmWatson.instanceId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.ibmWatson.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error analyzing risk:", error);
      throw error;
    }
  }

  async getPortfolioData(investorId: string): Promise<PortfolioData> {
    try {
      const response = await axios.get(
        `${this.capitalIQ.baseUrl}/portfolio/${investorId}`,
        {
          headers: {
            Authorization: `Bearer ${this.capitalIQ.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
      throw error;
    }
  }

  async checkCompliance(transaction: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.complianceAI.baseUrl}/check`,
        transaction,
        {
          headers: {
            Authorization: `Bearer ${this.complianceAI.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error checking compliance:", error);
      throw error;
    }
  }

  async generateInvestorReport(investorId: string): Promise<any> {
    try {
      const portfolioData = await this.getPortfolioData(investorId);
      const riskAnalysis = await this.analyzeRisk(portfolioData);

      return {
        portfolio: portfolioData,
        risk: riskAnalysis,
        timestamp: new Date().toISOString(),
        summary: {
          totalValue: portfolioData.totalValue,
          overallRisk: riskAnalysis.score,
          recommendations: riskAnalysis.recommendations,
        },
      };
    } catch (error) {
      console.error("Error generating investor report:", error);
      throw error;
    }
  }

  async matchInvestorToOpportunities(investorProfile: any): Promise<any> {
    try {
      const response = await axios.post(
        `${this.ibmWatson.baseUrl}/match-opportunities`,
        {
          profile: investorProfile,
          instanceId: this.ibmWatson.instanceId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.ibmWatson.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error matching investor to opportunities:", error);
      throw error;
    }
  }
}
