from flask import Blueprint, request, jsonify
from database import User, History
import jwt
from datetime import datetime, timedelta
import os

auth_bp = Blueprint('auth', __name__)

# JWT Secret Key
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')

@auth_bp.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ['email', 'password', 'name']):
            return jsonify({"success": False, "error": "Missing required fields"}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        name = data['name'].strip()
        
        # Validate input
        if len(password) < 6:
            return jsonify({"success": False, "error": "Password must be at least 6 characters"}), 400
        
        if len(name) < 2:
            return jsonify({"success": False, "error": "Name must be at least 2 characters"}), 400
        
        # Create user
        result = User.create_user(email, password, name)
        
        if result["success"]:
            # Generate JWT token
            token = generate_jwt_token(result["user"])
            return jsonify({
                "success": True,
                "user": result["user"],
                "token": token,
                "message": "Registration successful"
            }), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({"success": False, "error": f"Registration failed: {str(e)}"}), 500

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ['email', 'password']):
            return jsonify({"success": False, "error": "Missing email or password"}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Authenticate user
        result = User.authenticate_user(email, password)
        
        if result["success"]:
            # Generate JWT token
            token = generate_jwt_token(result["user"])
            return jsonify({
                "success": True,
                "user": result["user"],
                "token": token,
                "message": "Login successful"
            }), 200
        else:
            return jsonify(result), 401
            
    except Exception as e:
        return jsonify({"success": False, "error": f"Login failed: {str(e)}"}), 500

@auth_bp.route('/api/verify-token', methods=['POST'])
def verify_token():
    """Verify JWT token"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({"success": False, "error": "No token provided"}), 400
        
        # Decode token
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return jsonify({
            "success": True,
            "user": decoded,
            "message": "Token is valid"
        }), 200
        
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "error": "Token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"success": False, "error": f"Token verification failed: {str(e)}"}), 500

def generate_jwt_token(user):
    """Generate JWT token for user"""
    payload = {
        'user_id': user['_id'],
        'email': user['email'],
        'name': user['name'],
        'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_jwt_token(token):
    """Verify and decode JWT token"""
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return decoded
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
