import os
from pymongo import MongoClient
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import email_validator
from bson import ObjectId

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Connect to MongoDB"""
        try:
            mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/codesculptor')
            self.client = MongoClient(mongodb_uri)
            self.db = self.client.get_database()
            print("✅ Connected to MongoDB successfully")
            return True
        except Exception as e:
            print(f"❌ MongoDB connection error: {e}")
            return False
    
    def test_connection(self):
        """Test MongoDB connection"""
        try:
            self.db.command('ping')
            return True
        except Exception:
            return False
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("MongoDB connection closed")

# Initialize MongoDB instance
mongo = MongoDB()

# Collections
users_collection = None
history_collection = None

def init_collections():
    """Initialize MongoDB collections"""
    global users_collection, history_collection
    if mongo.db is not None:
        users_collection = mongo.db.users
        history_collection = mongo.db.history
        
        # Create indexes for better performance
        users_collection.create_index("email", unique=True)
        history_collection.create_index([("user_email", 1), ("timestamp", -1)])
        history_collection.create_index("user_email")
        
        print("✅ MongoDB collections initialized with indexes")

class User:
    @staticmethod
    def create_user(email, password, name):
        """Create a new user in MongoDB"""
        try:
            # Validate email
            if not email_validator.validate_email(email):
                return {"success": False, "error": "Invalid email format"}
            
            # Check if user already exists
            if users_collection.find_one({"email": email}):
                return {"success": False, "error": "Email already registered"}
            
            # Hash password
            hashed_password = generate_password_hash(password)
            
            # Create user document
            user_doc = {
                "email": email,
                "password": hashed_password,
                "name": name,
                "created_at": datetime.utcnow(),
                "last_login": None,
                "is_active": True
            }
            
            result = users_collection.insert_one(user_doc)
            user_doc["_id"] = str(result.inserted_id)
            
            # Remove password from response
            user_doc.pop("password", None)
            
            return {"success": True, "user": user_doc}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to create user: {str(e)}"}
    
    @staticmethod
    def authenticate_user(email, password):
        """Authenticate user credentials"""
        try:
            user = users_collection.find_one({"email": email})
            
            if not user:
                return {"success": False, "error": "User not found"}
            
            if not user.get("is_active", True):
                return {"success": False, "error": "Account is deactivated"}
            
            if check_password_hash(user["password"], password):
                # Update last login
                users_collection.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"last_login": datetime.utcnow()}}
                )
                
                # Remove password from response
                user.pop("password", None)
                user["_id"] = str(user["_id"])
                
                return {"success": True, "user": user}
            else:
                return {"success": False, "error": "Invalid password"}
                
        except Exception as e:
            return {"success": False, "error": f"Authentication failed: {str(e)}"}
    
    @staticmethod
    def get_user_by_email(email):
        """Get user by email"""
        try:
            user = users_collection.find_one({"email": email})
            if user:
                user.pop("password", None)
                user["_id"] = str(user["_id"])
            return user
        except Exception as e:
            print(f"Error getting user: {e}")
            return None

class History:
    @staticmethod
    def add_history_item(user_email, history_data):
        """Add a history item for a user"""
        try:
            history_item = {
                "user_email": user_email,
                "input": history_data.get("input", ""),
                "pseudocode": history_data.get("pseudocode", ""),
                "generated_code": history_data.get("generatedCode", ""),
                "language": history_data.get("language", "pseudocode"),
                "timestamp": datetime.utcnow(),
                "duration": history_data.get("duration", 0),
                "success": history_data.get("success", True),
                "error": history_data.get("error", None)
            }
            
            result = history_collection.insert_one(history_item)
            history_item["_id"] = str(result.inserted_id)
            
            return {"success": True, "history_item": history_item}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to save history: {str(e)}"}
    
    @staticmethod
    def get_user_history(user_email, page=1, per_page=10, search_term="", filters=None):
        """Get user's history with pagination and search"""
        try:
            # Build query
            query = {"user_email": user_email}
            
            # Add search filter
            if search_term:
                query["$or"] = [
                    {"input": {"$regex": search_term, "$options": "i"}},
                    {"pseudocode": {"$regex": search_term, "$options": "i"}},
                    {"generated_code": {"$regex": search_term, "$options": "i"}},
                    {"language": {"$regex": search_term, "$options": "i"}}
                ]
            
            # Add additional filters
            if filters:
                if filters.get("language"):
                    query["language"] = filters["language"]
                if filters.get("has_code"):
                    query["generated_code"] = {"$ne": ""}
                if filters.get("has_pseudocode"):
                    query["pseudocode"] = {"$ne": ""}
                if filters.get("date_range"):
                    date_filter = History._get_date_filter(filters["date_range"])
                    if date_filter:
                        query["timestamp"] = {"$gte": date_filter}
            
            # Get total count
            total_count = history_collection.count_documents(query)
            
            # Get paginated results
            skip = (page - 1) * per_page
            history_items = list(history_collection.find(query)
                .sort("timestamp", -1)
                .skip(skip)
                .limit(per_page))
            
            # Convert ObjectId to string
            for item in history_items:
                item["_id"] = str(item["_id"])
                if "timestamp" in item:
                    item["timestamp"] = item["timestamp"].isoformat()
            
            return {
                "success": True,
                "history": history_items,
                "total": total_count,
                "page": page,
                "per_page": per_page,
                "total_pages": (total_count + per_page - 1) // per_page
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get history: {str(e)}"}
    
    @staticmethod
    def delete_history_item(user_email, item_id):
        """Delete a specific history item"""
        try:
            result = history_collection.delete_one({
                "_id": ObjectId(item_id),
                "user_email": user_email
            })
            
            if result.deleted_count > 0:
                return {"success": True, "message": "History item deleted"}
            else:
                return {"success": False, "error": "History item not found"}
                
        except Exception as e:
            return {"success": False, "error": f"Failed to delete history: {str(e)}"}
    
    @staticmethod
    def clear_user_history(user_email):
        """Clear all history for a user"""
        try:
            result = history_collection.delete_many({"user_email": user_email})
            return {
                "success": True, 
                "message": f"Cleared {result.deleted_count} history items"
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to clear history: {str(e)}"}
    
    @staticmethod
    def get_user_stats(user_email):
        """Get user's history statistics"""
        try:
            pipeline = [
                {"$match": {"user_email": user_email}},
                {"$group": {
                    "_id": "$user_email",
                    "total_items": {"$sum": 1},
                    "avg_duration": {"$avg": "$duration"},
                    "language_counts": {"$push": "$language"}
                }},
                {"$project": {
                    "total_items": 1,
                    "avg_duration": {"$round": ["$avg_duration", 0]},
                    "language_counts": 1
                }}
            ]
            
            stats = list(history_collection.aggregate(pipeline))
            
            if stats:
                result = stats[0]
                # Calculate language distribution
                lang_dist = {}
                for lang in result["language_counts"]:
                    lang_dist[lang] = lang_dist.get(lang, 0) + 1
                
                result["language_distribution"] = lang_dist
                
                # Get monthly stats
                current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                monthly_count = history_collection.count_documents({
                    "user_email": user_email,
                    "timestamp": {"$gte": current_month}
                })
                
                result["monthly_items"] = monthly_count
                
                return {"success": True, "stats": result}
            else:
                return {"success": True, "stats": {
                    "total_items": 0,
                    "avg_duration": 0,
                    "language_distribution": {},
                    "monthly_items": 0
                }}
                
        except Exception as e:
            return {"success": False, "error": f"Failed to get stats: {str(e)}"}
    
    @staticmethod
    def _get_date_filter(date_range):
        """Get date filter based on range string"""
        now = datetime.utcnow()
        
        if date_range == "today":
            return now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif date_range == "week":
            from datetime import timedelta
            return now - timedelta(days=7)
        elif date_range == "month":
            return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif date_range == "year":
            return now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        return None

# Initialize collections when module is imported
init_collections()
