from flask import Flask
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
    
    # Health check endpoint
    @app.route('/health')
    def health():
        return {'status': 'ok'}, 200
    
    @app.route('/')
    def index():
        return {'message': 'Best Buy Finder API - Running on Vercel'}, 200
    
    return app
