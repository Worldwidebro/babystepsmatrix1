#!/usr/bin/env python
"""
Test script for the Infinite Matrix Ecosystem

This script tests the core functionality of the Infinite Matrix Ecosystem
including the Tool Library, Workflow Builder, and API endpoints.
"""
import os
import sys
import json
import requests
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import the ecosystem components if running locally
try:
    from src.infinite_matrix_ecosystem import ToolLibrary, WorkflowBuilder, AnalyticsEngine
    LOCAL_TESTING = True
except ImportError:
    print("Warning: Could not import ecosystem components. Running API tests only.")
    LOCAL_TESTING = False

def test_tool_library():
    """Test the Tool Library functionality"""
    print("\n=== Testing Tool Library ===")
    
    if not LOCAL_TESTING:
        print("Skipping local component test.")
        return
    
    # Create a Tool Library instance
    tool_lib = ToolLibrary()
    
    # Test getting all tools
    all_tools = tool_lib.get_tools_by_category()
    print(f"Found {sum(len(tools) for tools in all_tools.values())} tools in {len(all_tools)} categories")
    
    # Test getting tools by category
    for category in all_tools.keys():
        tools = tool_lib.get_tools_by_category(category)
        print(f"Category '{category}' has {len(tools)} tools")
    
    # Test getting tool details
    tool_name = "Zapier"
    tool_details = tool_lib.get_tool_details(tool_name)
    if tool_details:
        print(f"Found details for {tool_name}: {tool_details}")
    else:
        print(f"Could not find details for {tool_name}")

def test_workflow_builder():
    """Test the Workflow Builder functionality"""
    print("\n=== Testing Workflow Builder ===")
    
    if not LOCAL_TESTING:
        print("Skipping local component test.")
        return
    
    # Create a Workflow Builder instance
    workflow_builder = WorkflowBuilder()
    
    # Test creating a workflow
    user_id = "test_user_123"
    tools = [
        {"id": 1, "name": "Zapier", "config": {"trigger": "new_email"}},
        {"id": 2, "name": "Make.com", "config": {"action": "create_task"}}
    ]
    
    workflow = workflow_builder.create(user_id, tools, "Test Workflow", "A test workflow")
    print(f"Created workflow: {workflow}")
    
    # Test getting workflow details
    if "workflow_id" in workflow:
        workflow_id = workflow["workflow_id"]
        workflow_details = workflow_builder.get_workflow(workflow_id)
        print(f"Retrieved workflow details: {workflow_details}")

def test_api_endpoints():
    """Test the API endpoints"""
    print("\n=== Testing API Endpoints ===")
    
    # Set the base URL (adjust if needed)
    base_url = "http://localhost:8080/infinite-matrix/api"
    
    try:
        # Test the tools endpoint
        print("Testing /tools endpoint...")
        response = requests.get(f"{base_url}/tools")
        if response.status_code == 200:
            tools = response.json()
            print(f"Successfully retrieved tools: {len(tools)} categories")
        else:
            print(f"Failed to retrieve tools: {response.status_code}")
        
        # Test creating a workflow
        print("\nTesting /workflows endpoint...")
        workflow_data = {
            "user_id": "test_user_123",
            "tools": [
                {"id": 1, "name": "Zapier", "config": {"trigger": "new_email"}},
                {"id": 2, "name": "Make.com", "config": {"action": "create_task"}}
            ],
            "name": "API Test Workflow",
            "description": "A workflow created via API"
        }
        
        response = requests.post(
            f"{base_url}/workflows",
            json=workflow_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            workflow = response.json()
            print(f"Successfully created workflow: {workflow}")
            
            # Test getting workflow details
            if "workflow_id" in workflow:
                workflow_id = workflow["workflow_id"]
                print(f"\nTesting /workflows/{workflow_id} endpoint...")
                response = requests.get(f"{base_url}/workflows/{workflow_id}")
                
                if response.status_code == 200:
                    workflow_details = response.json()
                    print(f"Successfully retrieved workflow details: {workflow_details}")
                else:
                    print(f"Failed to retrieve workflow details: {response.status_code}")
        else:
            print(f"Failed to create workflow: {response.status_code}")
        
        # Test analytics endpoint
        print("\nTesting /analytics endpoint...")
        response = requests.get(f"{base_url}/analytics")
        if response.status_code == 200:
            stats = response.json()
            print(f"Successfully retrieved analytics: {stats}")
        else:
            print(f"Failed to retrieve analytics: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print(f"Could not connect to {base_url}. Is the server running?")
    except Exception as e:
        print(f"Error testing API endpoints: {e}")

def main():
    """Main test function"""
    print("=== Infinite Matrix Ecosystem Tests ===")
    
    # Test the Tool Library
    test_tool_library()
    
    # Test the Workflow Builder
    test_workflow_builder()
    
    # Test the API endpoints
    test_api_endpoints()
    
    print("\n=== Test Complete ===")

if __name__ == "__main__":
    main()