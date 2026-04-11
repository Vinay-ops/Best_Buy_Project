#!/usr/bin/env python3
import requests
import json

print("=" * 70)
print("🔍 Testing Vercel Deployment")
print("=" * 70)

# Common Vercel URLs
urls_to_test = [
    "https://best-buy-finder.vercel.app",
    "https://best-buy-finder-chi.vercel.app",
    "https://best-buy-finder-git-main.vercel.app",
]

print("\n🧪 Testing possible Vercel URLs...\n")

for base_url in urls_to_test:
    try:
        print(f"Testing: {base_url}/api/search?q=iphone")
        response = requests.get(f"{base_url}/api/search?q=iphone", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            total = data.get('total', 0)
            print(f"✅ SUCCESS! Found {total} products")
            print(f"   URL to use: {base_url}")
            break
        else:
            print(f"❌ HTTP {response.status_code}")
            
    except requests.exceptions.Timeout:
        print(f"⏱️  Timeout")
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection failed")
    except Exception as e:
        print(f"❌ Error: {str(e)[:50]}")

print("\n" + "=" * 70)
print("📝 IF NONE WORKED:")
print("=" * 70)
print("""
1. Go to: https://vercel.com/dashboard
2. Click on your "Best_Buy_Finder" project
3. Look at the TOP - you'll see the Deployment URL
4. Copy it and update in app_config.dart:

   static String get apiBaseUrl {
     return 'YOUR_VERCEL_URL_HERE';
   }

5. Rebuild and run the app
""")
