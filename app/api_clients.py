import requests, os, json, hashlib, time
from app.config import SERPAPI_URL, SERPAPI_KEY, REQUEST_TIMEOUT, SOURCES

USD_TO_INR = 86.0
CACHE_DIR, CACHE_DURATION = os.path.join(os.getcwd(), 'cache'), 86400  # 24h

def get_cache_path(key):
    return os.path.join(CACHE_DIR, f"{hashlib.md5(key.encode()).hexdigest()}.json")

def get_from_cache(key):
    try:
        if os.path.exists(path := get_cache_path(key)) and time.time() - os.path.getmtime(path) < CACHE_DURATION:
            with open(path, 'r', encoding='utf-8') as f: return json.load(f)
    except: pass
    return None

def save_to_cache(key, data):
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(get_cache_path(key), 'w', encoding='utf-8') as f: json.dump(data, f)
    except: pass

def get_json(url, params=None, ua=True):
    try:
        headers = {"User-Agent": "Mozilla/5.0"} if ua else {}
        resp = requests.get(url, params=params, headers=headers, timeout=REQUEST_TIMEOUT)
        return resp.json() if resp.status_code == 200 else None
    except: return None

def clean_image_url(url):
    if not url or not isinstance(url, str) or not url.startswith('http'):
        return "https://placehold.co/300?text=No+Image"
    return url.strip().replace('["', '').replace('"]', '').replace('"', '')

def normalize(p, source):
    try:
        price = p.get("extracted_price") or float("".join(c for c in str(p.get("price", "0")) if c.isdigit() or c == '.') or 0)
        img, title = p.get("thumbnail", ""), p.get("title", "Unknown")
        
        return {
            "id": str(p.get("product_id") or f"serp_{p.get('position', 'u')}"),
            "name": title, 
            "price": round(price * USD_TO_INR, 2),
            "category": "General",
            "image": clean_image_url(img), 
            "source": SOURCES.get(source, source)
        }
    except: return None

def search_serpapi_products(query, source_label="serpapi"):
    if not SERPAPI_KEY or not query: return []
    # Cache key includes query and source to separate "laptop amazon" from "laptop bestbuy"
    if data := get_from_cache(key := f"{source_label}_{query}"): return data
    
    # Add site: filter if looking for specific store, unless it's a general search
    sites = {
        "amazon": "amazon.com", "bestbuy": "bestbuy.com", "walmart": "walmart.com",
        "ebay": "ebay.com", "target": "target.com", "newegg": "newegg.com"
    }
    search_q = f"{query} site:{sites[source_label]}" if source_label in sites else query
    
    data = get_json(SERPAPI_URL, {"engine": "google_shopping", "q": search_q, "api_key": SERPAPI_KEY}, False)
    # Force the source label on the results
    results = [n for p in (data.get("shopping_results", []) if data else []) if (n := normalize(p, source_label))]
    
    if results: save_to_cache(key, results)
    return results

# Store-specific fetchers (using SerpAPI under the hood)
fetch_amazon_products = lambda: search_serpapi_products("laptops", "amazon")
fetch_bestbuy_products = lambda: search_serpapi_products("laptops", "bestbuy")
fetch_walmart_products = lambda: search_serpapi_products("laptops", "walmart")
fetch_ebay_products = lambda: search_serpapi_products("laptops", "ebay")
fetch_target_products = lambda: search_serpapi_products("laptops", "target")
fetch_newegg_products = lambda: search_serpapi_products("laptops", "newegg")

# Default "featured" products (General Google Shopping)
def fetch_featured_products():
    return search_serpapi_products("best selling laptops 2025", "serpapi")
