import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

load_dotenv()

class SupabaseInitializer:
    def __init__(self):
        self.supabase: Client = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_KEY", "")
        )

    async def initialize_database(self):
        """Initialize database with sample data"""
        try:
            # Create sample company
            company = await self.create_sample_company()
            
            # Create sample users
            await self.create_sample_users(company["id"])
            
            # Create sample transactions
            await self.create_sample_transactions(company["id"])
            
            # Create sample operations
            await self.create_sample_operations(company["id"])
            
            # Create sample compliance records
            await self.create_sample_compliance_records(company["id"])
            
            print("Database initialized successfully!")
            
        except Exception as e:
            print(f"Error initializing database: {e}")
            raise e

    async def create_sample_company(self):
        """Create a sample company"""
        company_data = {
            "name": "Tech Innovators Inc.",
            "category": "Technology",
            "revenue_stream": "SaaS",
            "contact_email": "contact@techinnovators.com",
            "brand_colors": json.dumps({
                "primary": "#007AFF",
                "secondary": "#5856D6"
            }),
            "target_audience": "Enterprise businesses",
            "key_performance_indicators": json.dumps({
                "revenue_growth": "20%",
                "customer_retention": "95%",
                "user_satisfaction": "4.8/5"
            })
        }
        
        response = await self.supabase.table("companies").insert(company_data).execute()
        return response.data[0]

    async def create_sample_users(self, company_id: str):
        """Create sample users for the company"""
        users = [
            {
                "email": "admin@techinnovators.com",
                "encrypted_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFO8y1K47csbjNy",  # "admin123"
                "role": "admin",
                "company_id": company_id,
                "metadata": json.dumps({
                    "department": "Management",
                    "hire_date": "2024-01-01"
                })
            },
            {
                "email": "analyst@techinnovators.com",
                "encrypted_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFO8y1K47csbjNy",  # "analyst123"
                "role": "analyst",
                "company_id": company_id,
                "metadata": json.dumps({
                    "department": "Analytics",
                    "hire_date": "2024-01-15"
                })
            }
        ]
        
        await self.supabase.table("users").insert(users).execute()

    async def create_sample_transactions(self, company_id: str):
        """Create sample financial transactions"""
        transactions = []
        current_date = datetime.now()
        
        # Generate 30 days of transactions
        for i in range(30):
            date = current_date - timedelta(days=i)
            
            # Revenue transaction
            transactions.append({
                "company_id": company_id,
                "type": "revenue",
                "amount": 5000 + (i % 5) * 1000,  # Varying revenue
                "category": "subscription",
                "date": date.isoformat(),
                "description": "Monthly subscription revenue",
                "metadata": json.dumps({
                    "payment_method": "stripe",
                    "subscription_tier": "enterprise"
                })
            })
            
            # Expense transaction
            transactions.append({
                "company_id": company_id,
                "type": "expense",
                "amount": 2000 + (i % 3) * 500,  # Varying expenses
                "category": "operations",
                "date": date.isoformat(),
                "description": "Operating expenses",
                "metadata": json.dumps({
                    "department": "Engineering",
                    "expense_type": "cloud_services"
                })
            })
        
        await self.supabase.table("transactions").insert(transactions).execute()

    async def create_sample_operations(self, company_id: str):
        """Create sample operations records"""
        operations = []
        current_date = datetime.now()
        
        for i in range(10):
            date = current_date - timedelta(days=i)
            
            operations.append({
                "company_id": company_id,
                "type": "system_performance",
                "status": "completed",
                "metrics": json.dumps({
                    "cpu_usage": 65 + (i % 10),
                    "memory_usage": 70 + (i % 15),
                    "response_time": 120 + (i % 30)
                }),
                "date": date.isoformat()
            })
        
        await self.supabase.table("operations").insert(operations).execute()

    async def create_sample_compliance_records(self, company_id: str):
        """Create sample compliance records"""
        compliance_records = []
        current_date = datetime.now()
        
        compliance_types = ["data_privacy", "security_audit", "code_review"]
        
        for i in range(5):
            date = current_date - timedelta(days=i * 7)
            
            compliance_records.append({
                "company_id": company_id,
                "type": compliance_types[i % len(compliance_types)],
                "status": "passed",
                "details": json.dumps({
                    "auditor": "Internal Compliance Team",
                    "findings": "No critical issues found",
                    "recommendations": ["Update security policies", "Enhance monitoring"]
                }),
                "date": date.isoformat()
            })
        
        await self.supabase.table("compliance_records").insert(compliance_records).execute()

if __name__ == "__main__":
    initializer = SupabaseInitializer()
    asyncio.run(initializer.initialize_database()) 