from flask import Flask
from flask_cors import CORS
import os
from app.routes import register_routes
from app.database import init_database

def create_app():
    """Create and configure the Flask app"""
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    CORS(app, supports_credentials=True, origins=["http://localhost:5000", "http://127.0.0.1:5000"])
    
    app.secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    app.config["SESSION_PERMANENT"] = False
    
    init_database()
    register_routes(app)
    
    return app
