"""
Configuration Settings
"""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv(os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(__file__))), '.env'))

# API URLs
FAKESTORE_API_URL = "https://fakestoreapi.com/products"
DUMMYJSON_API_URL = "https://dummyjson.com/products"
FAKESHOP_API_URL = "https://api.escuelajs.co/api/v1/products"
SERPAPI_URL = "https://serpapi.com/search"

# Secrets
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")

# Settings
REQUEST_TIMEOUT = 10
SOURCES = {"fakestore": "FakeStore", "dummyjson": "DummyJSON", "fakeshop": "FakeShop", "serpapi": "SerpAPI"}

# Database
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "vinay")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ecommerce_db")