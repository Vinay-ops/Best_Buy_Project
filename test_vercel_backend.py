#!/usr/bin/env python3
"""Test Vercel backend is working"""
import requests

print("Testing Vercel Backend: https://best-buy-finder.vercel.app")
print("=" * 60)

try:
    print("\n1️⃣  Testing /api/search endpoint...")
    response = requests.get(
        'https://best-buy-finder.vercel.app/api/search?q=iphone',
        timeout=10
    )
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Found {data.get('total', 0)} products")
        if data.get('products'):
            first = data['products'][0]
            print(f"   📱 First product: {first.get('title', 'N/A')}")
            print(f"   💰 Price: ₹{first.get('price', 'N/A')}")
    else:
        print(f"   ❌ Error: {response.text}")
        
except Exception as e:
    print(f"   ❌ Connection error: {e}")
    print("\n   Make sure you've deployed to Vercel with:")
    print("   1. vercel login")
    print("   2. vercel deploy")

print("\n" + "=" * 60)
print("If this works, your Flutter app should now fetch products!")
