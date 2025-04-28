import os
import sys
from pathlib import Path

def setup_environment():
    """Configure environment variables and paths"""
    # Add src directory to Python path
    src_path = str(Path(__file__).parent.parent.absolute())
    if src_path not in sys.path:
        sys.path.insert(0, src_path)
    
    # Set default environment variables if not present
    os.environ.setdefault('LOG_LEVEL', 'INFO')
    os.environ.setdefault('APP_ENV', 'development')

def initialize_services():
    """Initialize core services and dependencies"""
    try:
        # Import core services
        from services.database import init_db
        from services.cache import init_cache
        from services.auth import init_auth
        
        # Initialize in order
        init_db()
        init_cache()
        init_auth()
        
        return True
    except Exception as e:
        print(f"Failed to initialize services: {str(e)}")
        return False

def start_application():
    """Start the main application loop"""
    try:
        # Import and start main application
        from core.app import create_app
        
        app = create_app()
        app.run(host='0.0.0.0', port=8080)
    except Exception as e:
        print(f"Failed to start application: {str(e)}")
        sys.exit(1)

def main():
    """Main entry point"""
    print("Starting Infinite Ecosystem bootstrapper...")
    
    # Setup environment
    setup_environment()
    
    # Initialize services
    if not initialize_services():
        print("Failed to initialize required services")
        sys.exit(1)
    
    # Start application
    start_application()

if __name__ == '__main__':
    main() 