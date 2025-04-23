import axios from "axios";
import { ServicesConfig } from "../config/services";

interface LegalDocument {
  templateId: string;
  variables: Record<string, any>;
  metadata: {
    createdAt: Date;
    createdBy: string;
    status: "draft" | "pending" | "completed";
  };
}

export class LegalService {
  private lawBlocks = ServicesConfig.legal.lawBlocks;
  private paxtonAI = ServicesConfig.legal.paxtonAI;
  private legalSifter = ServicesConfig.legal.legalSifter;

  async generateDocument(
    templateId: string,
    variables: Record<string, any>
  ): Promise<LegalDocument> {
    try {
      const response = await axios.post(
        `${this.lawBlocks.baseUrl}/documents/generate`,
        {
          templateId,
          variables,
        },
        {
          headers: {
            Authorization: `Bearer ${this.lawBlocks.apiKey}`,
          },
        }
      );

      return {
        templateId,
        variables,
        metadata: {
          createdAt: new Date(),
          createdBy: "system",
          status: "completed",
        },
        ...response.data,
      };
    } catch (error) {
      console.error("Error generating legal document:", error);
      throw error;
    }
  }

  async analyzeDocument(documentContent: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.paxtonAI.baseUrl}/analyze`,
        {
          content: documentContent,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paxtonAI.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error analyzing document:", error);
      throw error;
    }
  }

  async fileDocument(document: LegalDocument): Promise<any> {
    try {
      const response = await axios.post(
        `${this.legalSifter.baseUrl}/file`,
        document,
        {
          headers: {
            Authorization: `Bearer ${this.legalSifter.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error filing document:", error);
      throw error;
    }
  }

  async generateNDA(
    partyA: string,
    partyB: string,
    effectiveDate: Date
  ): Promise<LegalDocument> {
    return this.generateDocument(this.lawBlocks.templates.nda, {
      disclosing_party: partyA,
      receiving_party: partyB,
      effective_date: effectiveDate.toISOString(),
    });
  }

  async generateLOI(
    buyer: string,
    seller: string,
    terms: Record<string, any>
  ): Promise<LegalDocument> {
    return this.generateDocument(this.lawBlocks.templates.loi, {
      buyer,
      seller,
      terms,
      date: new Date().toISOString(),
    });
  }

  async generateComplianceDoc(
    companyData: Record<string, any>
  ): Promise<LegalDocument> {
    return this.generateDocument(this.lawBlocks.templates.compliance, {
      company: companyData,
      generated_date: new Date().toISOString(),
    });
  }
}
