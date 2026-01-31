"""
Main Entry Point for the Flask Application

This is the file you run to start the server.
Run it with: python app.py

The server will start on http://localhost:5000
"""
from app import create_app

# Create the Flask application
app = create_app()

# This code only runs when you execute this file directly
# (not when it's imported as a module)
if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Starting E-commerce API Aggregator Server")
    print("=" * 60)
    print("📍 Server running at: http://localhost:5000")
    print("📚 Available endpoints:")
    print("   - GET http://localhost:5000/health")
    print("   - GET http://localhost:5000/products")
    print("   - GET http://localhost:5000/products/<source>")
    print("   - GET http://localhost:5000/search?q=<keyword>")
    print("=" * 60)
    print("💡 Press CTRL+C to stop the server")
    print("=" * 60)
    
    # Run Flask development server
    # debug=True: Shows detailed error messages (useful for development)
    # host='0.0.0.0': Makes server accessible from other devices on your network
    # port=5000: Server runs on port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
