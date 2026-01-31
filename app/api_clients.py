import requests
from app.config import (
    FAKESTORE_API_URL, DUMMYJSON_API_URL, FAKESHOP_API_URL,
    SERPAPI_URL, SERPAPI_KEY, REQUEST_TIMEOUT, SOURCES
)

# --- Helpers ---

def get_json(url, params=None):
    try:
        # Add a User-Agent to look like a real browser (fixes 403 Forbidden errors)
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        response = requests.get(url, params=params, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"⚠️ API error ({url}): {e}")
        return None

def normalize(product, source):
    """Convert different API formats to our standard format"""
    try:
        if source == "fakestore":
            return {
                "id": str(product.get("id", "")),
                "name": product.get("title", ""),
                "price": float(product.get("price", 0)),
                "category": product.get("category", ""),
                "image": product.get("image", ""),
                "source": SOURCES["fakestore"]
            }
        elif source == "dummyjson":
            return {
                "id": str(product.get("id", "")),
                "name": product.get("title", ""),
                "price": float(product.get("price", 0)),
                "category": product.get("category", ""),
                "image": product.get("thumbnail", ""),
                "source": SOURCES["dummyjson"]
            }
        elif source == "fakeshop":
            cat = product.get("category", {})
            img = product.get("images", [])
            return {
                "id": str(product.get("id", "")),
                "name": product.get("title", ""),
                "price": float(product.get("price", 0)),
                "category": cat.get("name", "") if isinstance(cat, dict) else str(cat),
                "image": img[0] if isinstance(img, list) and img else "",
                "source": SOURCES["fakeshop"]
            }
        elif source == "serpapi":
            # Try to get pre-extracted price first, then parse string
            price = product.get("extracted_price")
            if price is None:
                price_str = str(product.get("price", "0")).replace("$", "").replace(",", "").strip()
                try: price = float(price_str)
                except: price = 0.0
            
            return {
                "id": str(product.get("product_id") or product.get("position") or ""),
                "name": product.get("title", ""),
                "price": float(price),
                "category": "Google Shopping",
                "image": product.get("thumbnail", ""),
                "source": SOURCES["serpapi"]
            }
    except Exception: return None
    return None

# --- Fetch Products (Normalized) ---

def fetch_fakestore_products():
    data = get_json(FAKESTORE_API_URL)
    return [n for p in data if (n := normalize(p, "fakestore"))] if data else []

def fetch_dummyjson_products():
    data = get_json(DUMMYJSON_API_URL)
    products = data.get("products", []) if data else []
    return [n for p in products if (n := normalize(p, "dummyjson"))]

def fetch_fakeshop_products():
    data = get_json(FAKESHOP_API_URL)
    return [n for p in data if (n := normalize(p, "fakeshop"))] if data else []

# --- Search Products (Normalized) ---

def search_serpapi_products(query):
    if not SERPAPI_KEY or not query: return []
    params = {"engine": "google_shopping", "q": query, "api_key": SERPAPI_KEY}
    data = get_json(SERPAPI_URL, params)
    return [n for p in data.get("shopping_results", []) if (n := normalize(p, "serpapi"))] if data else []

def search_dummyjson_products(query):
    url = f"{DUMMYJSON_API_URL}/search"
    data = get_json(url, {"q": query})
    return [n for p in data.get("products", []) if (n := normalize(p, "dummyjson"))] if data else []

def search_fakeshop_products(query):
    data = get_json(FAKESHOP_API_URL, {"title": query})
    return [n for p in data if (n := normalize(p, "fakeshop"))] if data else []
