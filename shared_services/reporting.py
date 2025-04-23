from typing import Dict, List, Any, Optional
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta
import json
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

load_dotenv()

class ReportingService:
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_KEY", "")
        )

    async def generate_company_report(self, company_id: str, report_type: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate a comprehensive company report"""
        try:
            # Fetch company data
            company_data = await self.get_company_data(company_id)
            
            if not company_data:
                raise ValueError(f"No data found for company {company_id}")
            
            # Generate specific report based on type
            if report_type == "financial":
                report = await self.generate_financial_report(company_id, start_date, end_date)
            elif report_type == "operational":
                report = await self.generate_operational_report(company_id, start_date, end_date)
            elif report_type == "compliance":
                report = await self.generate_compliance_report(company_id, start_date, end_date)
            else:
                raise ValueError(f"Unknown report type: {report_type}")
            
            # Add metadata
            report["metadata"] = {
                "company_name": company_data.get("name"),
                "report_type": report_type,
                "generated_at": datetime.now().isoformat(),
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                }
            }
            
            # Store report
            await self.store_report(report)
            
            return report
            
        except Exception as e:
            print(f"Error generating report: {e}")
            return {"error": str(e)}

    async def get_company_data(self, company_id: str) -> Optional[Dict[str, Any]]:
        """Fetch company data from database"""
        try:
            response = await self.supabase.table("companies").select("*").eq("id", company_id).single().execute()
            return response.data
        except Exception as e:
            print(f"Error fetching company data: {e}")
            return None

    async def generate_financial_report(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate financial report"""
        # Fetch financial data
        transactions = await self.get_financial_data(company_id, start_date, end_date)
        
        # Process data using pandas
        df = pd.DataFrame(transactions)
        
        # Calculate key metrics
        revenue = df[df["type"] == "revenue"]["amount"].sum()
        expenses = df[df["type"] == "expense"]["amount"].sum()
        profit = revenue - expenses
        
        # Generate visualizations
        charts = self.generate_financial_charts(df)
        
        return {
            "type": "financial",
            "summary": {
                "revenue": revenue,
                "expenses": expenses,
                "profit": profit,
                "profit_margin": (profit / revenue * 100) if revenue > 0 else 0
            },
            "transactions": transactions,
            "charts": charts,
            "analysis": self.analyze_financial_data(df)
        }

    async def generate_operational_report(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate operational report"""
        # Fetch operational data
        operations = await self.get_operational_data(company_id, start_date, end_date)
        
        # Process data
        df = pd.DataFrame(operations)
        
        return {
            "type": "operational",
            "metrics": {
                "efficiency": self.calculate_efficiency_metrics(df),
                "productivity": self.calculate_productivity_metrics(df),
                "quality": self.calculate_quality_metrics(df)
            },
            "operations": operations,
            "analysis": self.analyze_operational_data(df)
        }

    async def generate_compliance_report(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Generate compliance report"""
        # Fetch compliance data
        compliance_records = await self.get_compliance_data(company_id, start_date, end_date)
        
        return {
            "type": "compliance",
            "compliance_status": self.assess_compliance_status(compliance_records),
            "violations": self.identify_compliance_violations(compliance_records),
            "recommendations": self.generate_compliance_recommendations(compliance_records),
            "records": compliance_records
        }

    async def get_financial_data(self, company_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Fetch financial transaction data"""
        try:
            response = await self.supabase.table("transactions").select("*").eq("company_id", company_id).gte("date", start_date.isoformat()).lte("date", end_date.isoformat()).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching financial data: {e}")
            return []

    async def get_operational_data(self, company_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Fetch operational data"""
        try:
            response = await self.supabase.table("operations").select("*").eq("company_id", company_id).gte("date", start_date.isoformat()).lte("date", end_date.isoformat()).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching operational data: {e}")
            return []

    async def get_compliance_data(self, company_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Fetch compliance records"""
        try:
            response = await self.supabase.table("compliance_records").select("*").eq("company_id", company_id).gte("date", start_date.isoformat()).lte("date", end_date.isoformat()).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching compliance data: {e}")
            return []

    def generate_financial_charts(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate financial visualizations"""
        # Create revenue vs expenses chart
        fig = make_subplots(rows=2, cols=2)
        
        # Revenue vs Expenses over time
        fig.add_trace(
            go.Scatter(x=df[df["type"] == "revenue"]["date"], 
                      y=df[df["type"] == "revenue"]["amount"],
                      name="Revenue"),
            row=1, col=1
        )
        fig.add_trace(
            go.Scatter(x=df[df["type"] == "expense"]["date"], 
                      y=df[df["type"] == "expense"]["amount"],
                      name="Expenses"),
            row=1, col=1
        )
        
        # Expense breakdown pie chart
        expense_by_category = df[df["type"] == "expense"].groupby("category")["amount"].sum()
        fig.add_trace(
            go.Pie(labels=expense_by_category.index, 
                   values=expense_by_category.values,
                   name="Expense Breakdown"),
            row=1, col=2
        )
        
        return {
            "revenue_expenses": fig.to_json(),
            "raw_data": {
                "revenue_trend": df[df["type"] == "revenue"].to_dict("records"),
                "expense_breakdown": expense_by_category.to_dict()
            }
        }

    def analyze_financial_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze financial data and provide insights"""
        analysis = {
            "trends": self.identify_trends(df),
            "anomalies": self.detect_anomalies(df),
            "recommendations": self.generate_recommendations(df)
        }
        return analysis

    def identify_trends(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify trends in financial data"""
        trends = []
        
        # Example trend analysis
        if len(df) > 0:
            revenue_trend = df[df["type"] == "revenue"]["amount"].pct_change().mean()
            trends.append({
                "type": "revenue",
                "direction": "up" if revenue_trend > 0 else "down",
                "magnitude": abs(revenue_trend)
            })
        
        return trends

    def detect_anomalies(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect anomalies in financial data"""
        anomalies = []
        
        # Example anomaly detection
        if len(df) > 0:
            mean = df["amount"].mean()
            std = df["amount"].std()
            threshold = 3
            
            anomalous_transactions = df[abs(df["amount"] - mean) > threshold * std]
            
            for _, transaction in anomalous_transactions.iterrows():
                anomalies.append({
                    "date": transaction["date"],
                    "amount": transaction["amount"],
                    "type": transaction["type"],
                    "deviation": abs((transaction["amount"] - mean) / std)
                })
        
        return anomalies

    def generate_recommendations(self, df: pd.DataFrame) -> List[str]:
        """Generate recommendations based on financial analysis"""
        recommendations = []
        
        if len(df) > 0:
            # Example recommendations
            expense_ratio = df[df["type"] == "expense"]["amount"].sum() / df[df["type"] == "revenue"]["amount"].sum()
            
            if expense_ratio > 0.7:
                recommendations.append("Consider cost reduction strategies as expenses are high relative to revenue")
            
            if expense_ratio < 0.3:
                recommendations.append("Consider reinvestment opportunities given strong profit margins")
        
        return recommendations

    async def store_report(self, report: Dict[str, Any]):
        """Store generated report in database"""
        try:
            await self.supabase.table("reports").insert({
                "type": report["type"],
                "content": json.dumps(report),
                "metadata": report["metadata"],
                "created_at": datetime.now().isoformat()
            }).execute()
        except Exception as e:
            print(f"Error storing report: {e}")
            raise e

if __name__ == "__main__":
    # Example usage
    import asyncio
    
    async def main():
        reporting_service = ReportingService()
        
        # Generate example report
        start_date = datetime.now() - timedelta(days=30)
        end_date = datetime.now()
        
        report = await reporting_service.generate_company_report(
            company_id="example_company",
            report_type="financial",
            start_date=start_date,
            end_date=end_date
        )
        
        print(json.dumps(report, indent=2))
    
    asyncio.run(main())
