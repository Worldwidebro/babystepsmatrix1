import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { EventEmitter } from "events";
import axios from "axios";
import Stripe from "stripe";
import { PlaidClient, Configuration, PlaidApi } from "plaid";

dotenv.config();

interface FinancialMetrics {
  cashFlow: {
    income: number;
    expenses: number;
    netCashFlow: number;
  };
  revenue: {
    total: number;
    bySource: { [key: string]: number };
    growth: number;
  };
  expenses: {
    total: number;
    byCategory: { [key: string]: number };
    optimization: { [key: string]: number };
  };
  investments: {
    total: number;
    returns: number;
    allocation: { [key: string]: number };
  };
}

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
  type: "income" | "expense";
  source: string;
}

export class FinancialDashboardService extends EventEmitter {
  private supabase: any;
  private stripe: Stripe;
  private plaid: PlaidApi;
  private metrics: FinancialMetrics;

  constructor() {
    super();
    this.supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_KEY || ""
    );

    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Plaid
    const plaidConfig = new Configuration({
      basePath: process.env.PLAID_ENV === "sandbox" ? "sandbox" : "development",
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
        },
      },
    });
    this.plaid = new PlaidApi(plaidConfig);

    this.metrics = {
      cashFlow: {
        income: 0,
        expenses: 0,
        netCashFlow: 0,
      },
      revenue: {
        total: 0,
        bySource: {},
        growth: 0,
      },
      expenses: {
        total: 0,
        byCategory: {},
        optimization: {},
      },
      investments: {
        total: 0,
        returns: 0,
        allocation: {},
      },
    };
  }

  // Fetch Bank Transactions
  async fetchBankTransactions(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    try {
      const response = await this.plaid.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      });

      return response.data.transactions.map((t) => ({
        id: t.transaction_id,
        date: new Date(t.date),
        amount: t.amount,
        category: t.category?.[0] || "uncategorized",
        description: t.name,
        type: t.amount > 0 ? "income" : "expense",
        source: "bank",
      }));
    } catch (error) {
      console.error("Error fetching bank transactions:", error);
      throw error;
    }
  }

  // Fetch Stripe Revenue
  async fetchStripeRevenue(): Promise<Transaction[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        limit: 100,
        status: "paid",
      });

      return invoices.data.map((i) => ({
        id: i.id,
        date: new Date(i.created * 1000),
        amount: i.amount_paid / 100,
        category: "revenue",
        description: i.description || "Stripe payment",
        type: "income",
        source: "stripe",
      }));
    } catch (error) {
      console.error("Error fetching Stripe revenue:", error);
      throw error;
    }
  }

  // Update Financial Metrics
  async updateMetrics(): Promise<void> {
    try {
      // Fetch all transactions
      const bankTransactions = await this.fetchBankTransactions(
        process.env.PLAID_ACCESS_TOKEN || "",
        "2024-01-01",
        "2024-03-01"
      );
      const stripeTransactions = await this.fetchStripeRevenue();

      // Combine and process transactions
      const allTransactions = [...bankTransactions, ...stripeTransactions];

      // Calculate metrics
      this.metrics.cashFlow = this.calculateCashFlow(allTransactions);
      this.metrics.revenue = this.calculateRevenue(allTransactions);
      this.metrics.expenses = this.calculateExpenses(allTransactions);
      this.metrics.investments = await this.calculateInvestments();

      // Emit update event
      this.emit("metricsUpdate", this.metrics);

      // Cache metrics
      await this.cacheMetrics();
    } catch (error) {
      console.error("Error updating metrics:", error);
      throw error;
    }
  }

  // Calculate Cash Flow
  private calculateCashFlow(
    transactions: Transaction[]
  ): FinancialMetrics["cashFlow"] {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income,
      expenses,
      netCashFlow: income - expenses,
    };
  }

  // Calculate Revenue
  private calculateRevenue(
    transactions: Transaction[]
  ): FinancialMetrics["revenue"] {
    const incomeTransactions = transactions.filter((t) => t.type === "income");
    const total = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

    const bySource = incomeTransactions.reduce(
      (acc, t) => {
        acc[t.source] = (acc[t.source] || 0) + t.amount;
        return acc;
      },
      {} as { [key: string]: number }
    );

    // Calculate growth (simplified)
    const growth = 0; // TODO: Implement growth calculation

    return {
      total,
      bySource,
      growth,
    };
  }

  // Calculate Expenses
  private calculateExpenses(
    transactions: Transaction[]
  ): FinancialMetrics["expenses"] {
    const expenseTransactions = transactions.filter(
      (t) => t.type === "expense"
    );
    const total = expenseTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );

    const byCategory = expenseTransactions.reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      },
      {} as { [key: string]: number }
    );

    // Calculate optimization suggestions
    const optimization = this.calculateExpenseOptimization(byCategory);

    return {
      total,
      byCategory,
      optimization,
    };
  }

  // Calculate Expense Optimization
  private calculateExpenseOptimization(expenses: { [key: string]: number }): {
    [key: string]: number;
  } {
    // TODO: Implement AI-powered expense optimization
    return {};
  }

  // Calculate Investments
  private async calculateInvestments(): Promise<
    FinancialMetrics["investments"]
  > {
    // TODO: Implement investment tracking
    return {
      total: 0,
      returns: 0,
      allocation: {},
    };
  }

  // Cache Metrics
  private async cacheMetrics(): Promise<void> {
    try {
      await this.supabase.from("financial_metrics").insert({
        metrics: this.metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error caching metrics:", error);
      throw error;
    }
  }

  // Get Cached Metrics
  async getCachedMetrics(): Promise<FinancialMetrics | null> {
    try {
      const { data, error } = await this.supabase
        .from("financial_metrics")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data.metrics;
    } catch (error) {
      console.error("Error getting cached metrics:", error);
      return null;
    }
  }

  // Get Current Metrics
  getMetrics(): FinancialMetrics {
    return this.metrics;
  }

  // Generate Financial Report
  async generateReport(): Promise<string> {
    try {
      const metrics = this.getMetrics();
      const report = {
        summary: {
          netCashFlow: metrics.cashFlow.netCashFlow,
          totalRevenue: metrics.revenue.total,
          totalExpenses: metrics.expenses.total,
          investmentReturns: metrics.investments.returns,
        },
        details: metrics,
        recommendations: await this.generateRecommendations(),
        timestamp: new Date().toISOString(),
      };

      return JSON.stringify(report, null, 2);
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  }

  // Generate Recommendations
  private async generateRecommendations(): Promise<string[]> {
    // TODO: Implement AI-powered recommendations
    return [];
  }
}
