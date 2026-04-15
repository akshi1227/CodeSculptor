from flask import Blueprint, request, jsonify, send_file
from database import History
from auth_routes import verify_jwt_token
import io
import json
from datetime import datetime

history_bp = Blueprint('history', __name__)

@history_bp.route('/api/history', methods=['GET'])
def get_history():
    """Get user's history with pagination and search"""
    try:
        # Get token from header
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "error": "No token provided"}), 401
        
        # Verify token
        user_data = verify_jwt_token(token)
        if not user_data:
            return jsonify({"success": False, "error": "Invalid token"}), 401
        
        # Get query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        search_term = request.args.get('search', '')
        
        # Get filters
        filters = {}
        if request.args.get('language'):
            filters['language'] = request.args.get('language')
        if request.args.get('has_code') == 'true':
            filters['has_code'] = True
        if request.args.get('has_pseudocode') == 'true':
            filters['has_pseudocode'] = True
        if request.args.get('date_range'):
            filters['date_range'] = request.args.get('date_range')
        
        # Get history from MongoDB
        result = History.get_user_history(
            user_email=user_data['email'],
            page=page,
            per_page=per_page,
            search_term=search_term,
            filters=filters
        )
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to get history: {str(e)}"}), 500

@history_bp.route('/api/history', methods=['POST'])
def add_history():
    """Add a history item"""
    try:
        # Get token from header
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "error": "No token provided"}), 401
        
        # Verify token
        user_data = verify_jwt_token(token)
        if not user_data:
            return jsonify({"success": False, "error": "Invalid token"}), 401
        
        # Get history data
        history_data = request.get_json()
        if not history_data:
            return jsonify({"success": False, "error": "No history data provided"}), 400
        
        # Add to MongoDB
        result = History.add_history_item(user_data['email'], history_data)
        
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to add history: {str(e)}"}), 500

@history_bp.route('/api/history/<item_id>', methods=['DELETE'])
def delete_history_item(item_id):
    """Delete a specific history item"""
    try:
        # Get token from header
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "error": "No token provided"}), 401
        
        # Verify token
        user_data = verify_jwt_token(token)
        if not user_data:
            return jsonify({"success": False, "error": "Invalid token"}), 401
        
        # Delete from MongoDB
        result = History.delete_history_item(user_data['email'], item_id)
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to delete history: {str(e)}"}), 500

@history_bp.route('/api/history/clear', methods=['DELETE'])
def clear_history():
    """Clear all user history"""
    try:
        # Get token from header
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "error": "No token provided"}), 401
        
        # Verify token
        user_data = verify_jwt_token(token)
        if not user_data:
            return jsonify({"success": False, "error": "Invalid token"}), 401
        
        # Clear from MongoDB
        result = History.clear_user_history(user_data['email'])
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to clear history: {str(e)}"}), 500

@history_bp.route('/api/history/stats', methods=['GET'])
def get_history_stats():
    """Get user's history statistics"""
    try:
        # Get token from header
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "error": "No token provided"}), 401
        
        # Verify token
        user_data = verify_jwt_token(token)
        if not user_data:
            return jsonify({"success": False, "error": "Invalid token"}), 401
        
        # Get stats from MongoDB
        result = History.get_user_stats(user_data['email'])
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to get stats: {str(e)}"}), 500

@history_bp.route('/api/history/download/<item_id>', methods=['GET'])
def download_history_item(item_id):
    """Download a history item as file"""
    try:
        # Get token from header
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "error": "No token provided"}), 401
        
        # Verify token
        user_data = verify_jwt_token(token)
        if not user_data:
            return jsonify({"success": False, "error": "Invalid token"}), 401
        
        # Get specific history item
        result = History.get_user_history(
            user_email=user_data['email'],
            page=1,
            per_page=1000,  # Get all items to find the specific one
            search_term=item_id
        )
        
        if not result["success"] or not result["history"]:
            return jsonify({"success": False, "error": "History item not found"}), 404
        
        # Find the specific item
        history_item = None
        for item in result["history"]:
            if item.get("_id") == item_id:
                history_item = item
                break
        
        if not history_item:
            return jsonify({"success": False, "error": "History item not found"}), 404
        
        # Determine file type and content
        file_type = request.args.get('type', 'json')
        language = history_item.get('language', 'pseudocode').lower()
        
        if file_type == 'pseudocode' and history_item.get('pseudocode'):
            content = history_item['pseudocode']
            filename = f"pseudocode_{item_id}.txt"
            mimetype = 'text/plain'
        elif file_type == 'code' and history_item.get('generated_code'):
            content = history_item['generated_code']
            # Determine file extension based on language
            extensions = {
                'python': 'py',
                'javascript': 'js',
                'java': 'java',
                'cpp': 'cpp',
                'c': 'c'
            }
            ext = extensions.get(language, 'txt')
            filename = f"code_{item_id}.{ext}"
            mimetype = 'text/plain'
        else:
            # Default to JSON
            content = json.dumps(history_item, indent=2)
            filename = f"history_{item_id}.json"
            mimetype = 'application/json'
        
        # Create file in memory
        file_stream = io.StringIO(content)
        file_stream.seek(0)
        
        return send_file(
            io.BytesIO(content.encode('utf-8')),
            as_attachment=True,
            download_name=filename,
            mimetype=mimetype
        )
        
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to download: {str(e)}"}), 500

@history_bp.route('/api/history/export', methods=['GET'])
def export_user_history():
    """Export all user history as JSON"""
    try:
        # Get token from header
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({"success": False, "error": "No token provided"}), 401
        
        # Verify token
        user_data = verify_jwt_token(token)
        if not user_data:
            return jsonify({"success": False, "error": "Invalid token"}), 401
        
        # Get all history
        result = History.get_user_history(
            user_email=user_data['email'],
            page=1,
            per_page=10000  # Get all items
        )
        
        if not result["success"]:
            return jsonify(result), 500
        
        # Create export data
        export_data = {
            "user": {
                "email": user_data['email'],
                "name": user_data.get('name', 'User'),
                "export_date": datetime.utcnow().isoformat()
            },
            "history": result["history"],
            "total_items": len(result["history"])
        }
        
        # Create file in memory
        content = json.dumps(export_data, indent=2)
        filename = f"codesculptor_history_{user_data['email']}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        return send_file(
            io.BytesIO(content.encode('utf-8')),
            as_attachment=True,
            download_name=filename,
            mimetype='application/json'
        )
        
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to export: {str(e)}"}), 500
