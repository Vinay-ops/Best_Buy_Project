"""
Configuration Settings
"""
import os
from dotenv import load_dotenv

# 1. Load environment variables from .env file
# This finds the project root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))

# 2. API Configuration
SERPAPI_URL = "https://serpapi.com/search"
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
REQUEST_TIMEOUT = 10  # Seconds to wait for API response

# 3. Supported Stores (Source ID -> Display Name)
SOURCES = {
    "amazon": "Amazon", 
    "bestbuy": "Best Buy", 
    "walmart": "Walmart", 
    "ebay": "eBay",
    "target": "Target",
    "newegg": "Newegg",
    "macys": "Macy's",
    "nordstrom": "Nordstrom",
    "serpapi": "Google Shopping"
}

# 4. Database Configuration
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "vinay")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ecommerce_db")
