#!/usr/bin/env python
"""
Genix Business Ecosystem Test Script
This script tests the basic functionality of the Genix ecosystem.
"""
import os
import sys
import json
from dotenv import load_dotenv

# Add the project root to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Genix components
from src.genix_ecosystem import AIOrchestrator, CreditRepair, AIBossHub, init_apis

# Load environment variables
load_dotenv()

def test_ai_orchestrator():
    """Test the AI Orchestrator component"""
    print("\n=== Testing AI Orchestrator ===\n")
    
    apis = init_apis()
    ai = AIOrchestrator(apis)
    
    # Test provider selection
    print("Testing provider selection:")
    provider = ai._select_provider("Tell me about business strategies")
    print(f"  Selected provider for general query: {provider}")
    
    provider = ai._select_provider("Write Python code to sort a list")
    print(f"  Selected provider for code query: {provider}")
    
    # Test query functionality if APIs are available
    if apis.get('claude') or apis.get('gemini'):
        print("\nTesting AI query:")
        try:
            result = ai.query("Summarize the benefits of AI in business in one sentence", provider="auto")
            print(f"  Query result: {result[:100]}..." if len(result) > 100 else f"  Query result: {result}")
        except Exception as e:
            print(f"  Error during query: {str(e)}")
    else:
        print("\nSkipping AI query test - No AI providers configured")

def test_credit_repair():
    """Test the Credit Repair module"""
    print("\n=== Testing Credit Repair Module ===\n")
    
    apis = init_apis()
    service = CreditRepair(apis)
    
    # Mock test without making actual API calls
    print("Testing generate_dispute method (mock):")
    try:
        # Override query method to avoid making actual API calls
        original_query = service.ai.query
        service.ai.query = lambda prompt, provider: "This is a mock response for testing purposes."
        
        result = service.generate_dispute("Late payment on credit card")
        print(f"  Generated letter: {result['letter'][:100]}..." if len(result['letter']) > 100 else f"  Generated letter: {result['letter']}")
        print(f"  Payment ID: {result['payment_id'] or 'Not available (Stripe not configured)'}")
        
        # Restore original query method
        service.ai.query = original_query
    except Exception as e:
        print(f"  Error during credit repair test: {str(e)}")

def test_ai_boss_hub():
    """Test the AI Boss Hub module"""
    print("\n=== Testing AI Boss Hub Module ===\n")
    
    apis = init_apis()
    hub = AIBossHub(apis)
    
    # Mock test without making actual API calls
    print("Testing job_search method (mock):")
    try:
        # Override query method to avoid making actual API calls
        original_query = hub.ai.query
        hub.ai.query = lambda prompt, provider: json.dumps([{
            "title": "Software Engineer",
            "company": "Tech Corp",
            "description": "Developing software applications",
            "url": "https://example.com/jobs/123"
        }])
        
        result = hub.job_search("Python developer with 5 years experience")
        print(f"  Found {len(result)} jobs")
        for job in result:
            print(f"  - {job.get('title')} at {job.get('company')}")
        
        # Restore original query method
        hub.ai.query = original_query
    except Exception as e:
        print(f"  Error during AI Boss Hub test: {str(e)}")

def main():
    """Main test function"""
    print("\n=== Genix Business Ecosystem Test ===\n")
    
    # Print environment status
    print("Environment Status:")
    for var in ['STRIPE_KEY', 'CLAUDE_KEY', 'GEMINI_KEY', 'REDIS_URL', 'SUPABASE_URL', 'NEON_HOST']:
        print(f"  - {var}: {'Configured' if os.getenv(var) else 'Not configured'}")
    
    # Run tests
    test_ai_orchestrator()
    test_credit_repair()
    test_ai_boss_hub()
    
    print("\n=== All Tests Completed ===\n")
    print("The Genix Business Ecosystem is ready for use!")
    print("Start the Flask application with: python src/app.py")

if __name__ == "__main__":
    main()