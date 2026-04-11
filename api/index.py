from app import create_app
import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = create_app()

# Vercel Serverless Function Entry Point - Flask app is deployed here
# The 'app' variable is what Vercel's WSGI handler will use
if __name__ == "__main__":
    app.run()
