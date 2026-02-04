import requests, os, json, hashlib, time
from app.config import FAKESTORE_API_URL, DUMMYJSON_API_URL, FAKESHOP_API_URL, SERPAPI_URL, SERPAPI_KEY, REQUEST_TIMEOUT, SOURCES

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
    if not url or not isinstance(url, str) or "placeimg.com" in url or "api.escuelajs.co" in url or not url.startswith('http'):
        return "https://placehold.co/300?text=No+Image"
    return url.strip().replace('["', '').replace('"]', '').replace('"', '')

def normalize(p, source):
    try:
        price, img, title = 0, "", p.get("title", "")
        if source == "fakestore":
            price, img = float(p.get("price", 0)), p.get("image", "")
        elif source == "dummyjson":
            price, img = float(p.get("price", 0)), p.get("thumbnail", "")
        elif source == "fakeshop":
            price = float(p.get("price", 0))
            img = p.get("images", [""])[0] if isinstance(p.get("images"), list) else ""
        elif source == "serpapi":
            price = p.get("extracted_price") or float("".join(c for c in str(p.get("price", "0")) if c.isdigit() or c == '.') or 0)
            img, title = p.get("thumbnail", ""), p.get("title", "Unknown")
            
        return {
            "id": str(p.get("id") or p.get("product_id") or f"serp_{p.get('position', 'u')}"),
            "name": title, "price": round(price * USD_TO_INR, 2),
            "category": p.get("category", {}).get("name") if isinstance(p.get("category"), dict) else p.get("category", "General"),
            "image": clean_image_url(img), "source": SOURCES.get(source, source)
        }
    except: return None

def fetch_products(url, source):
    data = get_json(url)
    items = data.get("products", []) if isinstance(data, dict) else (data or [])
    return [n for p in items if (n := normalize(p, source))]

fetch_fakestore_products = lambda: fetch_products(FAKESTORE_API_URL, "fakestore")
fetch_dummyjson_products = lambda: fetch_products(DUMMYJSON_API_URL, "dummyjson")
fetch_fakeshop_products = lambda: fetch_products(FAKESHOP_API_URL, "fakeshop")

def search_serpapi_products(query):
    if not SERPAPI_KEY or not query: return []
    if data := get_from_cache(key := f"serpapi_{query}"): return data
    
    data = get_json(SERPAPI_URL, {"engine": "google_shopping", "q": query, "api_key": SERPAPI_KEY}, False)
    results = [n for p in (data.get("shopping_results", []) if data else []) if (n := normalize(p, "serpapi"))]
    
    if results: save_to_cache(key, results)
    return results

def fetch_featured_products():
    return search_serpapi_products("best selling laptops 2025")

def search_dummyjson_products(q):
    return [n for p in (get_json(f"{DUMMYJSON_API_URL}/search", {"q": q}) or {}).get("products", []) if (n := normalize(p, "dummyjson"))]

def search_fakeshop_products(q):
    return [n for p in (get_json(FAKESHOP_API_URL, {"title": q}) or []) if (n := normalize(p, "fakeshop"))]