from flask import Flask, jsonify
from flask_cors import CORS
import os
from app.routes import register_routes
from app.database import init_database

def create_app():
    """Create and configure the Flask app for both local and Vercel deployment"""
    # Define template and static folders (will be None on Vercel, which is fine for API-only)
    app = Flask(__name__, template_folder=None, static_folder=None)
    
    # Allow CORS for all domains - needed for Flutter app to access API
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})
    
    app.secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    app.config["SESSION_PERMANENT"] = False
    
    # Initialize database (handles Vercel environment)
    try:
        init_database()
    except Exception as e:
        print(f"⚠️  Database warning: {e}")
        # Continue anyway - database might be initializing
    
    # Register all API routes
    register_routes(app)
    
    # Global error handlers to return JSON instead of HTML
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        print(f"❌ Server Error: {error}")
        return jsonify({"error": "Internal server error", "details": str(error)}), 500
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        print(f"❌ Unhandled Exception: {e}")
        return jsonify({"error": "An error occurred", "details": str(e)}), 500
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'ok'}, 200
    
    @app.route('/')
    def index():
        return {'message': 'Best Buy Finder API - Running on Vercel'}, 200
    
    return app
