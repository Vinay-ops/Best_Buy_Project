import requests
import os
import json
import hashlib
import time
from app.config import SERPAPI_URL, SERPAPI_KEY, REQUEST_TIMEOUT, SOURCES

# Constants
USD_TO_INR = 86.0
CACHE_DURATION = 86400  # 24 hours in seconds
CACHE_DIR = os.path.join(os.getcwd(), 'cache')

def get_cache_path(key):
    """Generate a unique filename for a cache key using MD5."""
    hashed_key = hashlib.md5(key.encode()).hexdigest()
    return os.path.join(CACHE_DIR, f"{hashed_key}.json")

def get_from_cache(key):
    """Retrieve data from the local JSON cache if it exists and is fresh."""
    try:
        path = get_cache_path(key)
        
        # Check if file exists
        if not os.path.exists(path):
            return None
            
        # Check if file is too old
        file_age = time.time() - os.path.getmtime(path)
        if file_age >= CACHE_DURATION:
            return None
            
        # Read data
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
            
    except Exception:
        # If any error occurs (e.g. corrupted file), ignore it
        return None

def save_to_cache(key, data):
    """Save data to a local JSON file."""
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        path = get_cache_path(key)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f)
    except Exception:
        pass

def get_json(url, params=None, use_ua=True):
    """Helper to make a GET request and return JSON."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"} if use_ua else {}
        response = requests.get(url, params=params, headers=headers, timeout=REQUEST_TIMEOUT)
        
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    return None

def clean_image_url(url):
    """Fix common issues with image URLs."""
    if not url or not isinstance(url, str) or not url.startswith('http'):
        return "https://placehold.co/300?text=No+Image"
        
    # Remove extra quotes often found in API data
    return url.strip().replace('["', '').replace('"]', '').replace('"', '')

def normalize(product_data, source):
    """
    Standardize product data from different sources into a common format.
    """
    try:
        # 1. Extract price
        raw_price = product_data.get("price", "0")
        extracted_price = product_data.get("extracted_price")
        
        if extracted_price:
            price = extracted_price
        else:
            # Manually extract numbers from string like "$1,299.99"
            digits = "".join(c for c in str(raw_price) if c.isdigit() or c == '.')
            price = float(digits) if digits else 0.0

        # 2. Extract other fields
        title = product_data.get("title", "Unknown Product")
        image = product_data.get("thumbnail", "")
        product_id = str(product_data.get("product_id") or f"serp_{product_data.get('position', 'u')}")
        
        # 3. Return standardized dictionary
        return {
            "id": product_id,
            "name": title, 
            "price": round(price * USD_TO_INR, 2),  # Convert to INR
            "category": "General",
            "image": clean_image_url(image), 
            "source": SOURCES.get(source, source)
        }
    except Exception: 
        return None

def search_serpapi_products(query, source_label="serpapi"):
    """
    Search for products using SerpAPI (Google Shopping).
    """
    if not SERPAPI_KEY or not query: 
        return []
    
    # 1. Check cache first to save API credits
    cache_key = f"{source_label}_{query}"
    cached_data = get_from_cache(cache_key)
    if cached_data: 
        return cached_data
    
    # 2. Define site-specific filters (Google Shopping 'site:' operator)
    sites = {
        "amazon": "amazon.com", 
        "bestbuy": "bestbuy.com", 
        "walmart": "walmart.com",
        "ebay": "ebay.com", 
        "target": "target.com", 
        "newegg": "newegg.com",
        "macys": "macys.com", 
        "nordstrom": "nordstrom.com",
        "sephora": "sephora.com", 
        "barnesandnoble": "barnesandnoble.com", 
        "dicks": "dickssportinggoods.com",
        "homedepot": "homedepot.com", 
        "chewy": "chewy.com", 
        "guitarcenter": "guitarcenter.com", 
        "staples": "staples.com"
    }
    
    # 3. Build search query
    search_query = query
    if source_label in sites:
        search_query = f"{query} site:{sites[source_label]}"
    
    # 4. Fetch from API
    params = {
        "engine": "google_shopping",
        "q": search_query,
        "api_key": SERPAPI_KEY
    }
    data = get_json(SERPAPI_URL, params, use_ua=False)
    
    if not data:
        return []

    # 5. Process results
    results = []
    raw_results = data.get("shopping_results", [])
    
    for p in raw_results:
        normalized_product = normalize(p, source_label)
        if normalized_product:
            results.append(normalized_product)
    
    # 6. Save to cache
    if results: 
        save_to_cache(cache_key, results)
        
    return results

# ---------------------------------------------------------
# Store-Specific Fetchers
# We create a specific function for each store to keep the code organized.
# ---------------------------------------------------------

def fetch_featured_products():
    return search_serpapi_products("trending products 2026", "serpapi")

def fetch_amazon_products():
    return search_serpapi_products("trending electronics", "amazon")

def fetch_bestbuy_products():
    return search_serpapi_products("smart home gadgets", "bestbuy")

def fetch_walmart_products():
    return search_serpapi_products("furniture and decor", "walmart")

def fetch_ebay_products():
    return search_serpapi_products("watches and sneakers", "ebay")

def fetch_target_products():
    return search_serpapi_products("men women clothing", "target")

def fetch_newegg_products():
    return search_serpapi_products("gaming accessories", "newegg")

def fetch_macys_products():
    return search_serpapi_products("fashion clothing sale", "macys")

def fetch_nordstrom_products():
    return search_serpapi_products("designer shoes", "nordstrom")

def fetch_sephora_products():
    return search_serpapi_products("skincare and makeup", "sephora")

def fetch_barnes_products():
    return search_serpapi_products("bestselling books", "barnesandnoble")

def fetch_dicks_products():
    return search_serpapi_products("sports equipment", "dicks")

def fetch_homedepot_products():
    return search_serpapi_products("tools and hardware", "homedepot")

def fetch_chewy_products():
    return search_serpapi_products("pet food and toys", "chewy")

def fetch_guitarcenter_products():
    return search_serpapi_products("musical instruments", "guitarcenter")

def fetch_staples_products():
    return search_serpapi_products("office supplies", "staples")
