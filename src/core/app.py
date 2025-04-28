from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

def create_app():
    """Create and configure the Flask application"""
    # Load environment variables
    load_dotenv()
    
    # Initialize Flask app
    app = Flask(__name__)
    
    # Enable CORS
    CORS(app)
    
    # Load configuration
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY', 'dev-key-change-in-prod'),
        DEBUG=os.getenv('APP_ENV') == 'development',
        JSON_SORT_KEYS=False
    )
    
    # Register blueprints
    from routes.api import api_bp
    from routes.auth import auth_bp
    from routes.antilibrary import antilibrary_bp
    
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(antilibrary_bp, url_prefix='/antilibrary')
    
    # Register error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def server_error(error):
        return {'error': 'Internal server error'}, 500
    
    return app 