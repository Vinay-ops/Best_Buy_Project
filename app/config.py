"""
Configuration settings for the application

This file stores all the URLs and settings we need to connect to external APIs.
Think of it as a central place where we keep all our "addresses" and "keys".
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ============================================================================
# EXTERNAL API ENDPOINTS
# ============================================================================
# These are the URLs where we can get product data from different services

# FakeStore API - A free fake REST API for testing
# Documentation: https://fakestoreapi.com/
FAKESTORE_API_URL = "https://fakestoreapi.com/products"

# DummyJSON API - Another free fake API for products
# Documentation: https://dummyjson.com/
DUMMYJSON_API_URL = "https://dummyjson.com/products"

# FakeShop API (Platzi Fake Store API) - Educational API
# Documentation: https://fakeapi.platzi.com/
FAKESHOP_API_URL = "https://api.escuelajs.co/api/v1/products"

# ============================================================================
# SERPAPI CONFIGURATION
# ============================================================================
# SerpAPI is used for searching products on Google Shopping
# You need to get a free API key from: https://serpapi.com/
# Then set it as an environment variable: SERPAPI_KEY=your_key_here
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")
SERPAPI_URL = "https://serpapi.com/search"

# ============================================================================
# REQUEST SETTINGS
# ============================================================================
# How long to wait (in seconds) before giving up on an API request
# If an API takes longer than this, we'll stop waiting and handle it as an error
REQUEST_TIMEOUT = 10

# ============================================================================
# API SOURCE NAMES
# ============================================================================
# Friendly names we use to identify which API a product came from
# This helps users know where each product originated
SOURCES = {
    "fakestore": "FakeStore",
    "dummyjson": "DummyJSON",
    "fakeshop": "FakeShop",
    "serpapi": "SerpAPI"
}

# ============================================================================
# MYSQL DATABASE CONFIGURATION
# ============================================================================
# MySQL connection settings
# You can set these as environment variables or change them here
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "vinay")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "ecommerce_db")
