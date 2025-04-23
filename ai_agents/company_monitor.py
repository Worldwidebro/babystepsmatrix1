import os
import yaml
import ollama
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from typing import Dict, List, Any
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CompanyMonitor:
    def __init__(self):
        self.config = self._load_config()
        self.ai_agents = self._initialize_agents()
        
    def _load_config(self) -> Dict:
        try:
            with open("companies/config.yaml", "r") as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return {}

    def _initialize_agents(self) -> Dict[str, AssistantAgent]:
        agents = {}
        
        # Financial Analysis Agent
        agents["financial"] = AssistantAgent(
            name="Financial_Analyst",
            llm_config={
                "config_list": [{"model": "ollama/mistral", "api_key": "ollama"}],
                "seed": 42,
                "temperature": 0.7
            },
            system_message="You are a financial analyst monitoring company performance."
        )
        
        # Compliance Monitor Agent
        agents["compliance"] = AssistantAgent(
            name="Compliance_Monitor",
            llm_config={
                "config_list": [{"model": "ollama/mistral", "api_key": "ollama"}],
                "seed": 42,
                "temperature": 0.5
            },
            system_message="You monitor regulatory compliance and risk factors."
        )
        
        # Operations Monitor Agent
        agents["operations"] = AssistantAgent(
            name="Operations_Monitor",
            llm_config={
                "config_list": [{"model": "ollama/mistral", "api_key": "ollama"}],
                "seed": 42,
                "temperature": 0.6
            },
            system_message="You monitor operational efficiency and resource utilization."
        )
        
        return agents

    async def analyze_company(self, company_data: Dict) -> Dict[str, Any]:
        try:
            results = {}
            
            # Financial Analysis
            financial_prompt = f"Analyze financial performance for {company_data['name']}: {company_data}"
            financial_response = ollama.generate(
                model='mistral:7b-instruct',
                prompt=financial_prompt
            )
            results["financial"] = financial_response
            
            # Compliance Check
            compliance_prompt = f"Check compliance status for {company_data['name']}: {company_data}"
            compliance_response = ollama.generate(
                model='mistral:7b-instruct',
                prompt=compliance_prompt
            )
            results["compliance"] = compliance_response
            
            # Operations Analysis
            operations_prompt = f"Analyze operational efficiency for {company_data['name']}: {company_data}"
            operations_response = ollama.generate(
                model='mistral:7b-instruct',
                prompt=operations_prompt
            )
            results["operations"] = operations_response
            
            return results
        except Exception as e:
            logger.error(f"Error analyzing company {company_data['name']}: {e}")
            return {}

    async def generate_report(self, company_id: str, analysis_results: Dict) -> str:
        try:
            report_prompt = f"""
            Generate a comprehensive report based on the following analysis:
            Financial Analysis: {analysis_results.get('financial', 'No data')}
            Compliance Status: {analysis_results.get('compliance', 'No data')}
            Operations Analysis: {analysis_results.get('operations', 'No data')}
            """
            
            report_response = ollama.generate(
                model='mistral:7b-instruct',
                prompt=report_prompt
            )
            
            # Save report
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_path = f"reports/{company_id}_{timestamp}.txt"
            os.makedirs("reports", exist_ok=True)
            
            with open(report_path, "w") as f:
                f.write(report_response)
            
            return report_path
        except Exception as e:
            logger.error(f"Error generating report for company {company_id}: {e}")
            return ""

    async def watch_all_companies(self):
        try:
            for company in self.config.get("companies", []):
                logger.info(f"Monitoring company: {company['name']}")
                
                # Analyze company
                analysis_results = await self.analyze_company(company)
                
                # Generate report
                report_path = await self.generate_report(company["company_id"], analysis_results)
                
                if report_path:
                    logger.info(f"Report generated for {company['name']}: {report_path}")
                else:
                    logger.warning(f"Failed to generate report for {company['name']}")
                
        except Exception as e:
            logger.error(f"Error in watch_all_companies: {e}")

if __name__ == "__main__":
    import asyncio
    
    monitor = CompanyMonitor()
    asyncio.run(monitor.watch_all_companies())
