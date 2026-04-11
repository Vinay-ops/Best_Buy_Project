import os
import requests
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, '.env'))

SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")

def test_search():
    if not SERPAPI_KEY:
        print("❌ Error: SERPAPI_KEY not found in .env file.")
        return

    print(f"Testing SerpAPI with key: {SERPAPI_KEY[:5]}...{SERPAPI_KEY[-5:]}")

    url = "https://serpapi.com/search"
    params = {
        "engine": "google_shopping",
        "q": "iphone 15",
        "api_key": SERPAPI_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            results = data.get("shopping_results", [])
            print(f"Success! Found {len(results)} products.")
            if results:
                first = results[0]
                print(f"Sample Product: {first.get('title')} - {first.get('price')}")
        else:
            print(f"API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_search()
