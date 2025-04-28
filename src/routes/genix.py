from flask import Blueprint, request, jsonify
import os
from src.genix_ecosystem import CreditRepair, AIBossHub, AutomationEngine, init_apis

# Create blueprint
genix_routes = Blueprint('genix_routes', __name__)

@genix_routes.route('/credit-repair', methods=['POST'])
def credit_repair():
    """Generate a credit dispute letter for $99"""
    data = request.json
    if not data or 'issue' not in data:
        return jsonify({"error": "Missing required field: issue"}), 400
        
    apis = init_apis()
    service = CreditRepair(apis)
    result = service.generate_dispute(data['issue'])
    return jsonify(result)

@genix_routes.route('/job-search', methods=['POST'])
def job_search():
    """Find jobs matching a resume for $29/mo subscription"""
    data = request.json
    if not data or 'resume' not in data:
        return jsonify({"error": "Missing required field: resume"}), 400
        
    apis = init_apis()
    hub = AIBossHub(apis)
    jobs = hub.job_search(data['resume'])
    return jsonify(jobs)

@genix_routes.route('/webhook/stripe', methods=['POST'])
def stripe_webhook():
    """Handle Stripe payment webhooks"""
    apis = init_apis()
    
    # Check if Stripe is configured
    try:
        import stripe
        if not apis.get('stripe'):
            return jsonify({"error": "Stripe not configured"}), 400
            
        event = stripe.Webhook.construct_event(
            request.data, 
            request.headers['Stripe-Signature'],
            os.getenv('STRIPE_WEBHOOK_SECRET')
        )
        
        if event['type'] == 'payment_intent.succeeded':
            automation = AutomationEngine(apis)
            automation.automate_workflow("subscription_payment", event['data'])
        
        return jsonify({"status": "success"}), 200
    except ImportError:
        return jsonify({"error": "Stripe package not installed"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@genix_routes.route('/status', methods=['GET'])
def status():
    """Check the status of Genix ecosystem services"""
    apis = init_apis()
    status = {
        "stripe": "available" if apis.get('stripe') else "unavailable",
        "claude": "available" if apis.get('claude') else "unavailable",
        "gemini": "available" if apis.get('gemini') else "unavailable",
        "redis": "available" if apis.get('redis') else "unavailable",
        "supabase": "available" if apis.get('supabase') else "unavailable",
        "postgres": "available" if apis.get('pg_conn') else "unavailable"
    }
    return jsonify(status)