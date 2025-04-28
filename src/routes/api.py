from flask import Blueprint

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    return {'status': 'healthy'} 