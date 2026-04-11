#!/usr/bin/env python3
"""Test API endpoints directly"""
import requests
import json

BASE_URL = "http://localhost:5000"

print("=" * 60)
print("Testing Flask API Endpoints")
print("=" * 60)

# Test 1: Health check
print("\n1️⃣  Testing /api/products endpoint...")
try:
    response = requests.get(f"{BASE_URL}/api/products", timeout=5)
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2)[:200]}...")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Search endpoint
print("\n2️⃣  Testing /api/search endpoint...")
try:
    response = requests.get(f"{BASE_URL}/api/search?q=iphone", timeout=10)
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Found: {data.get('total', 0)} products")
    if data.get('products'):
        print(f"First product: {data['products'][0]}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Check if server is running
print("\n3️⃣  Checking if Flask server is running...")
try:
    response = requests.get(f"{BASE_URL}/", timeout=5)
    print(f"✅ Flask server is running")
except Exception as e:
    print(f"❌ Flask server not running: {e}")
    print("\nStart Flask server with: python run.py")
