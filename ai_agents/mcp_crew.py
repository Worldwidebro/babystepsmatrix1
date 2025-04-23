from typing import List, Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import openai
from datetime import datetime
import json
from crewai import Agent, Task, Crew, Process
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_community.llms import OpenAI
import asyncio

# Load environment variables
load_dotenv()

class MCPCrew:
    def __init__(self):
        self.llm = OpenAI(temperature=0.7)
        self.search_tool = DuckDuckGoSearchRun()
        self.supabase = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_KEY", "")
        )
        self.openai = openai
        self.openai.api_key = os.getenv("OPENAI_API_KEY", "")
        self.agents: Dict[str, Any] = {}
        self.tasks: List[Dict[str, Any]] = []
        self.initialize_agents()

    def initialize_agents(self):
        """Initialize different types of AI agents"""
        self.agents = {
            "analyst": {
                "role": "Data Analyst",
                "goal": "Analyze company performance and identify optimization opportunities",
                "capabilities": ["data_analysis", "reporting", "forecasting"]
            },
            "legal": {
                "role": "Legal Assistant",
                "goal": "Handle legal document processing and compliance checks",
                "capabilities": ["document_review", "contract_analysis", "compliance_check"]
            },
            "finance": {
                "role": "Financial Manager",
                "goal": "Manage financial operations and reporting",
                "capabilities": ["transaction_monitoring", "budget_analysis", "risk_assessment"]
            },
            "operations": {
                "role": "Operations Manager",
                "goal": "Optimize business processes and workflow automation",
                "capabilities": ["process_automation", "resource_allocation", "efficiency_analysis"]
            }
        }

    async def assign_task(self, agent_type: str, task_details: Dict[str, Any]) -> str:
        """Assign a task to a specific agent"""
        if agent_type not in self.agents:
            raise ValueError(f"Unknown agent type: {agent_type}")

        task_id = f"task_{len(self.tasks) + 1}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        task = {
            "id": task_id,
            "agent": agent_type,
            "details": task_details,
            "status": "pending",
            "created_at": datetime.now().isoformat()
        }
        
        self.tasks.append(task)
        await self.execute_task(task)
        return task_id

    async def execute_task(self, task: Dict[str, Any]):
        """Execute a task using the appropriate agent"""
        try:
            agent = self.agents[task["agent"]]
            task["status"] = "in_progress"
            
            # Log task execution
            await self.log_activity(task["id"], f"Started task execution by {agent['role']}")
            
            # Execute task based on agent capabilities
            result = await self.process_task(agent, task["details"])
            
            task["status"] = "completed"
            task["result"] = result
            
            # Store task result in Supabase
            await self.store_task_result(task)
            
        except Exception as e:
            task["status"] = "failed"
            task["error"] = str(e)
            await self.log_activity(task["id"], f"Task execution failed: {str(e)}")

    async def process_task(self, agent: Dict[str, Any], task_details: Dict[str, Any]) -> Dict[str, Any]:
        """Process task based on agent capabilities"""
        if "data_analysis" in agent["capabilities"]:
            return await self.analyze_data(task_details)
        elif "document_review" in agent["capabilities"]:
            return await self.review_document(task_details)
        elif "transaction_monitoring" in agent["capabilities"]:
            return await self.monitor_transactions(task_details)
        elif "process_automation" in agent["capabilities"]:
            return await self.automate_process(task_details)
        else:
            raise ValueError(f"No matching capability found for task")

    async def analyze_data(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze data using OpenAI"""
        prompt = self.create_analysis_prompt(details)
        response = await self.openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}]
        )
        return {"analysis": response.choices[0].message.content}

    async def review_document(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Review legal documents"""
        # Implement document review logic
        return {"status": "reviewed", "recommendations": []}

    async def monitor_transactions(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Monitor financial transactions"""
        # Implement transaction monitoring logic
        return {"status": "monitored", "alerts": []}

    async def automate_process(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Automate business processes"""
        # Implement process automation logic
        return {"status": "automated", "workflow": []}

    async def store_task_result(self, task: Dict[str, Any]):
        """Store task result in Supabase"""
        try:
            await self.supabase.table("task_results").insert({
                "task_id": task["id"],
                "agent_type": task["agent"],
                "result": json.dumps(task["result"]),
                "status": task["status"],
                "created_at": task["created_at"]
            }).execute()
        except Exception as e:
            print(f"Error storing task result: {e}")

    async def log_activity(self, task_id: str, message: str):
        """Log activity to Supabase"""
        try:
            await self.supabase.table("activity_logs").insert({
                "task_id": task_id,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }).execute()
        except Exception as e:
            print(f"Error logging activity: {e}")

    def create_analysis_prompt(self, details: Dict[str, Any]) -> str:
        """Create a prompt for data analysis"""
        return f"""
        As a data analyst, analyze the following data:
        Context: {details.get('context', 'No context provided')}
        Data: {details.get('data', 'No data provided')}
        
        Please provide:
        1. Key insights
        2. Trends and patterns
        3. Recommendations
        4. Potential risks or concerns
        """

    def create_agents(self):
        """Create specialized AI agents"""
        
        financial_analyst = Agent(
            role='Financial Analyst',
            goal='Analyze company financial data and provide insights',
            backstory='Expert financial analyst with experience in business metrics',
            tools=[self.search_tool],
            llm=self.llm,
            verbose=True
        )

        legal_advisor = Agent(
            role='Legal Advisor',
            goal='Review legal documents and ensure compliance',
            backstory='Experienced legal professional specializing in business law',
            tools=[self.search_tool],
            llm=self.llm,
            verbose=True
        )

        operations_manager = Agent(
            role='Operations Manager',
            goal='Monitor and optimize business operations',
            backstory='Seasoned operations expert with focus on efficiency',
            tools=[self.search_tool],
            llm=self.llm,
            verbose=True
        )

        data_scientist = Agent(
            role='Data Scientist',
            goal='Analyze data patterns and provide predictive insights',
            backstory='Expert in data analysis and machine learning',
            tools=[self.search_tool],
            llm=self.llm,
            verbose=True
        )

        return {
            'financial_analyst': financial_analyst,
            'legal_advisor': legal_advisor,
            'operations_manager': operations_manager,
            'data_scientist': data_scientist
        }

    async def analyze_company(self, company_id: str):
        """Analyze a company using the AI crew"""
        agents = self.create_agents()

        # Financial Analysis Task
        financial_analysis = Task(
            description=f'Analyze financial data for company {company_id}',
            agent=agents['financial_analyst']
        )

        # Legal Compliance Task
        legal_compliance = Task(
            description=f'Review legal compliance for company {company_id}',
            agent=agents['legal_advisor']
        )

        # Operations Analysis Task
        operations_analysis = Task(
            description=f'Analyze operations efficiency for company {company_id}',
            agent=agents['operations_manager']
        )

        # Data Analysis Task
        data_analysis = Task(
            description=f'Perform data analysis for company {company_id}',
            agent=agents['data_scientist']
        )

        # Create and run the crew
        crew = Crew(
            agents=list(agents.values()),
            tasks=[financial_analysis, legal_compliance, operations_analysis, data_analysis],
            process=Process.sequential
        )

        result = await crew.kickoff()
        
        # Store results in Supabase
        await self.store_analysis_results(company_id, result)
        
        return result

    async def store_analysis_results(self, company_id: str, results: dict):
        """Store analysis results in Supabase"""
        task_result = {
            "task_id": f"company_analysis_{company_id}",
            "agent_type": "mcp_crew",
            "result": results,
            "status": "completed"
        }
        
        await self.supabase.table("task_results").insert(task_result).execute()

    async def monitor_companies(self):
        """Monitor all companies continuously"""
        while True:
            try:
                # Fetch all companies
                response = await self.supabase.table("companies").select("id").execute()
                companies = response.data

                # Analyze each company
                for company in companies:
                    await self.analyze_company(company["id"])

                # Wait for next monitoring cycle
                await asyncio.sleep(3600)  # 1 hour interval
                
            except Exception as e:
                print(f"Error in monitoring: {e}")
                await asyncio.sleep(300)  # 5 minutes retry interval

if __name__ == "__main__":
    mcp = MCPCrew()
    asyncio.run(mcp.monitor_companies()) 