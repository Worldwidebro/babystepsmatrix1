from flask import Flask
from routes.api import api_bp
from routes.auth import auth_bp
from routes.genix import genix_routes
from routes.infinite_matrix import infinite_matrix_routes
from src.genix_ecosystem import register_genix_blueprint
from src.infinite_matrix_ecosystem import register_infinite_matrix_blueprint

def create_app():
    app = Flask(__name__)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(genix_routes, url_prefix='/genix/api')
    app.register_blueprint(infinite_matrix_routes, url_prefix='/infinite-matrix/api')
    
    # Register Genix ecosystem
    register_genix_blueprint(app)
    
    # Register Infinite Matrix ecosystem
    register_infinite_matrix_blueprint(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=8080)