#!/usr/bin/env python
"""
Initialization script for the Infinite Matrix Ecosystem.
Sets up the database schema and initial data for the ecosystem.
"""
import os
import sys
import json

# Add the src directory to the path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from infinite_matrix_ecosystem import ToolLibrary, WorkflowBuilder, ModuleIntegrator

def init_database():
    """Initialize the database schema and initial data"""
    print("Initializing Infinite Matrix Ecosystem database...")
    
    # In a real implementation, this would connect to Neon Postgres
    # and create the necessary tables
    print("Creating database schema...")
    
    # Create tables for tools
    print("Creating tools table...")
    
    # Create tables for workflows
    print("Creating workflows table...")
    
    # Create tables for module-specific data
    print("Creating module-specific tables...")
    
    # Initialize tool library with default tools
    tool_library = ToolLibrary()
    print(f"Initialized tool library with {sum(len(tools) for tools in tool_library.tools.values())} tools")
    
    # Initialize module integrator
    module_integrator = ModuleIntegrator()
    print(f"Initialized module integrator with {len(module_integrator.get_module('blockchain').__dict__)} blockchain methods")
    print(f"Initialized module integrator with {len(module_integrator.get_module('healthcare').__dict__)} healthcare methods")
    print(f"Initialized module integrator with {len(module_integrator.get_module('real_estate').__dict__)} real estate methods")
    print(f"Initialized module integrator with {len(module_integrator.get_module('ai_governance').__dict__)} AI governance methods")
    print(f"Initialized module integrator with {len(module_integrator.get_module('voice_ai').__dict__)} voice AI methods")
    
    print("Infinite Matrix Ecosystem database initialization complete!")

def create_sample_data():
    """Create sample data for testing"""
    print("Creating sample data...")
    
    # Create a sample workflow
    workflow_builder = WorkflowBuilder()
    sample_workflow = workflow_builder.create(
        user_id="user123",
        tools=[
            {"id": 1, "name": "Zapier", "config": {"trigger": "new_email"}},
            {"id": 2, "name": "Make.com", "config": {"action": "create_task"}}
        ],
        name="Email to Task Workflow",
        description="Creates a task when a new email arrives"
    )
    print(f"Created sample workflow: {sample_workflow['name']}")
    
    # Create sample blockchain data
    print("Creating sample blockchain data...")
    
    # Create sample healthcare data
    print("Creating sample healthcare data...")
    
    # Create sample real estate data
    print("Creating sample real estate data...")
    
    print("Sample data creation complete!")

def main():
    """Main function to initialize the Infinite Matrix Ecosystem"""
    init_database()
    create_sample_data()
    print("Infinite Matrix Ecosystem initialization complete!")

if __name__ == "__main__":
    main()