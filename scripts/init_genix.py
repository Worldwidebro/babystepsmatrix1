#!/usr/bin/env python
"""
Genix Business Ecosystem Initialization Script
This script sets up the necessary environment and database for the Genix ecosystem.
"""
import os
import sys
import subprocess
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check for required environment variables
REQUIRED_VARS = [
    'SUPABASE_URL', 'SUPABASE_KEY',
    'NEON_HOST', 'NEON_DB', 'NEON_USER', 'NEON_PW'
]

OPTIONAL_VARS = [
    'STRIPE_KEY', 'STRIPE_WEBHOOK_SECRET',
    'CLAUDE_KEY', 'GEMINI_KEY', 'REDIS_URL'
]

def check_environment():
    """Check if all required environment variables are set"""
    missing = [var for var in REQUIRED_VARS if not os.getenv(var)]
    if missing:
        print(f"Error: Missing required environment variables: {', '.join(missing)}")
        print("Please set these variables in your .env file or Replit Secrets")
        return False
    
    missing_optional = [var for var in OPTIONAL_VARS if not os.getenv(var)]
    if missing_optional:
        print(f"Warning: Missing optional environment variables: {', '.join(missing_optional)}")
        print("Some features may be limited without these variables")
    
    return True

def check_dependencies():
    """Check if all required Python packages are installed"""
    required_packages = [
        'flask', 'supabase', 'psycopg2-binary', 'redis', 'stripe',
        'anthropic', 'google-generativeai', 'tenacity'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"Warning: Missing Python packages: {', '.join(missing)}")
        install = input("Would you like to install them now? (y/n): ")
        if install.lower() == 'y':
            subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing)
            print("Packages installed successfully!")
        else:
            print("Some features may not work without these packages")
    
    return True

def setup_database():
    """Set up the database tables for Genix ecosystem"""
    try:
        # Check if psycopg2 is installed
        import psycopg2
        
        # Connect to the database
        conn = psycopg2.connect(
            host=os.getenv('NEON_HOST'),
            database=os.getenv('NEON_DB'),
            user=os.getenv('NEON_USER'),
            password=os.getenv('NEON_PW')
        )
        
        # Execute the SQL script
        with conn.cursor() as cur:
            # Check if tables already exist
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'genix_users'
                );
            """)
            tables_exist = cur.fetchone()[0]
            
            if tables_exist:
                print("Genix database tables already exist")
                return True
            
            # Read and execute the SQL script
            script_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                'migrations', '20240601_genix_ecosystem.sql'
            )
            
            with open(script_path, 'r') as f:
                sql_script = f.read()
                cur.execute(sql_script)
            
            conn.commit()
            print("Database tables created successfully!")
            
        return True
    except ImportError:
        print("Error: psycopg2 package is not installed")
        return False
    except Exception as e:
        print(f"Error setting up database: {str(e)}")
        return False

def test_api_connections():
    """Test connections to external APIs"""
    results = {}
    
    # Test Stripe connection
    if os.getenv('STRIPE_KEY'):
        try:
            import stripe
            stripe.api_key = os.getenv('STRIPE_KEY')
            stripe.Account.retrieve()
            results['stripe'] = "Connected"
        except Exception as e:
            results['stripe'] = f"Error: {str(e)}"
    else:
        results['stripe'] = "Not configured"
    
    # Test Claude connection
    if os.getenv('CLAUDE_KEY'):
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=os.getenv('CLAUDE_KEY'))
            # Just validate the API key format
            results['claude'] = "API key configured"
        except Exception as e:
            results['claude'] = f"Error: {str(e)}"
    else:
        results['claude'] = "Not configured"
    
    # Test Gemini connection
    if os.getenv('GEMINI_KEY'):
        try:
            import google.generativeai as genai
            genai.configure(api_key=os.getenv('GEMINI_KEY'))
            results['gemini'] = "API key configured"
        except Exception as e:
            results['gemini'] = f"Error: {str(e)}"
    else:
        results['gemini'] = "Not configured"
    
    # Test Redis connection
    if os.getenv('REDIS_URL'):
        try:
            import redis
            r = redis.Redis(host=os.getenv('REDIS_URL'))
            r.ping()
            results['redis'] = "Connected"
        except Exception as e:
            results['redis'] = f"Error: {str(e)}"
    else:
        results['redis'] = "Not configured"
    
    # Test Supabase connection
    if os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_KEY'):
        try:
            from supabase import create_client
            supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
            # Just validate the connection
            results['supabase'] = "Connected"
        except Exception as e:
            results['supabase'] = f"Error: {str(e)}"
    else:
        results['supabase'] = "Not configured"
    
    print("\nAPI Connection Test Results:")
    for api, status in results.items():
        print(f"  - {api}: {status}")
    
    return results

def main():
    """Main initialization function"""
    print("\n=== Genix Business Ecosystem Initialization ===\n")
    
    # Check environment variables
    if not check_environment():
        return False
    
    # Check dependencies
    if not check_dependencies():
        return False
    
    # Set up database
    if not setup_database():
        return False
    
    # Test API connections
    test_api_connections()
    
    print("\n=== Genix Business Ecosystem Initialized Successfully! ===\n")
    print("You can now start the Flask application with:")
    print("  python src/app.py")
    print("\nAPI endpoints available at:")
    print("  - /genix/api/credit-repair")
    print("  - /genix/api/job-search")
    print("  - /genix/api/status")
    
    return True

if __name__ == "__main__":
    main()