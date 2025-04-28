from flask import Blueprint, request, jsonify
from datetime import datetime
from uuid import uuid4
from services.antilibrary import AntilibraryService, UnknownEntry

antilibrary_bp = Blueprint('antilibrary', __name__)
service = AntilibraryService()

@antilibrary_bp.route('/unknown', methods=['POST'])
def add_unknown():
    """Add a new unknown entry to the antilibrary"""
    data = request.json
    
    entry = UnknownEntry(
        id=str(uuid4()),
        company_id=data['company_id'],
        category=data['category'],
        description=data['description'],
        potential_impact=float(data['potential_impact']),
        discovery_date=datetime.now(),
        last_updated=datetime.now(),
        related_companies=data.get('related_companies', []),
        exploration_status='new',
        tags=data.get('tags', [])
    )
    
    if service.add_unknown(entry):
        return {'id': entry.id, 'status': 'created'}, 201
    return {'error': 'Failed to create entry'}, 500

@antilibrary_bp.route('/company/<company_id>/unknowns', methods=['GET'])
def get_company_unknowns(company_id):
    """Get all unknown entries for a company"""
    entries = service.get_company_unknowns(company_id)
    return jsonify([vars(entry) for entry in entries])

@antilibrary_bp.route('/unknowns/related', methods=['GET'])
def find_related_unknowns():
    """Find related unknowns by tags"""
    tags = request.args.getlist('tags')
    threshold = float(request.args.get('threshold', 0.5))
    entries = service.find_related_unknowns(tags, threshold)
    return jsonify([vars(entry) for entry in entries])

@antilibrary_bp.route('/unknown/<entry_id>/status', methods=['PUT'])
def update_status(entry_id):
    """Update the exploration status of an unknown entry"""
    new_status = request.json.get('status')
    if not new_status:
        return {'error': 'Status not provided'}, 400
        
    if service.update_exploration_status(entry_id, new_status):
        return {'status': 'updated'}
    return {'error': 'Entry not found'}, 404

@antilibrary_bp.route('/unknowns/high-impact', methods=['GET'])
def get_high_impact():
    """Get high impact unknown entries"""
    threshold = float(request.args.get('threshold', 0.8))
    entries = service.get_high_impact_unknowns(threshold)
    return jsonify([vars(entry) for entry in entries])

@antilibrary_bp.route('/company/<company_id>/synergies', methods=['GET'])
def get_synergies(company_id):
    """Get potential synergies for a company"""
    synergies = service.get_company_synergies(company_id)
    return jsonify(synergies) 