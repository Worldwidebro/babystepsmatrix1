#!/usr/bin/env python
"""
Initialization script for the Infinite Matrix Ecosystem

This script sets up the necessary database tables and initial data for the
Infinite Matrix Ecosystem. It should be run once during initial setup.
"""
import os
import sys
import psycopg2
from pathlib import Path

# Add the project root to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

def init_database():
    """Initialize the database with required tables"""
    print("Initializing Infinite Matrix Ecosystem database...")
    
    # Check for database credentials
    required_env = ['NEON_HOST', 'NEON_DB', 'NEON_USER', 'NEON_PW']
    missing_env = [env for env in required_env if not os.getenv(env)]
    
    if missing_env:
        print(f"Error: Missing environment variables: {', '.join(missing_env)}")
        print("Please set these variables before running this script.")
        return False
    
    try:
        # Connect to the database
        conn = psycopg2.connect(
            host=os.getenv('NEON_HOST'),
            database=os.getenv('NEON_DB'),
            user=os.getenv('NEON_USER'),
            password=os.getenv('NEON_PW')
        )
        
        # Execute the SQL migration file
        cursor = conn.cursor()
        
        # Get the migration file path
        migration_file = Path(__file__).parent.parent / 'migrations' / '20240602_infinite_matrix_ecosystem.sql'
        
        if not migration_file.exists():
            print(f"Error: Migration file not found at {migration_file}")
            return False
        
        # Read and execute the SQL file
        with open(migration_file, 'r') as f:
            sql = f.read()
            cursor.execute(sql)
        
        conn.commit()
        print("Database tables created successfully!")
        
        return True
    
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

def init_apis():
    """Check and initialize API connections"""
    print("Checking API connections...")
    
    apis_status = {
        "Stripe": os.getenv('STRIPE_KEY') is not None,
        "Supabase": os.getenv('SUPABASE_URL') is not None and os.getenv('SUPABASE_KEY') is not None,
        "Redis": os.getenv('REDIS_URL') is not None
    }
    
    for api, status in apis_status.items():
        print(f"  {api}: {'✓ Connected' if status else '✗ Not configured'}")
    
    return all(apis_status.values())

def main():
    """Main initialization function"""
    print("=== Infinite Matrix Ecosystem Initialization ===")
    
    # Initialize database
    db_success = init_database()
    
    # Check API connections
    apis_success = init_apis()
    
    if db_success:
        print("\n✓ Database initialization complete!")
    else:
        print("\n✗ Database initialization failed. Please check the error messages above.")
    
    if apis_success:
        print("✓ All API connections configured!")
    else:
        print("⚠ Some API connections are not configured. The system will work with limited functionality.")
    
    print("\nNext steps:")
    print("1. Start the Flask application: python src/app.py")
    print("2. Access the API at: http://localhost:8080/infinite-matrix/api/tools")

if __name__ == "__main__":
    main()