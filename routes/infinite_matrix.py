from flask import Blueprint, request, jsonify
from src.infinite_matrix_ecosystem import ToolLibrary, WorkflowBuilder

# Create a Blueprint for Infinite Matrix routes
infinite_matrix_routes = Blueprint('infinite_matrix_routes', __name__)

@infinite_matrix_routes.route('/tools', methods=['GET'])
def get_tools():
    """Get all tools or tools by category"""
    tool_lib = ToolLibrary()
    category = request.args.get('category')
    tools = tool_lib.get_tools_by_category(category)
    return jsonify(tools)

@infinite_matrix_routes.route('/workflows', methods=['POST'])
def create_workflow():
    """Create a new workflow"""
    workflow_builder = WorkflowBuilder()
    
    user_id = request.json.get('user_id')
    tools = request.json.get('tools', [])
    name = request.json.get('name', 'New Workflow')
    description = request.json.get('description', '')
    
    workflow = workflow_builder.create(user_id, tools, name, description)
    return jsonify(workflow)

@infinite_matrix_routes.route('/workflows/<workflow_id>', methods=['GET'])
def get_workflow(workflow_id):
    """Get workflow details"""
    workflow_builder = WorkflowBuilder()
    workflow = workflow_builder.get_workflow(workflow_id) if hasattr(workflow_builder, 'get_workflow') else None
    
    if workflow:
        return jsonify(workflow)
    return jsonify({"error": "Workflow not found"}), 404