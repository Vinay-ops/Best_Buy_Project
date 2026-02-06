from flask import jsonify, request, render_template, session
from werkzeug.security import generate_password_hash, check_password_hash
from app.api_clients import (
    fetch_featured_products, fetch_amazon_products, fetch_bestbuy_products, fetch_walmart_products,
    fetch_ebay_products, fetch_target_products, fetch_newegg_products,
    search_serpapi_products
)
from app.database import create_user, get_user_by_username, create_order, get_user_orders

def register_routes(app):
    # --- Frontend ---
    @app.route('/')
    def index(): return render_template('index.html')
    @app.route('/products')
    def products_page(): return render_template('products.html')
    @app.route('/login')
    def login_page(): return render_template('login.html')
    @app.route('/register')
    def register_page(): return render_template('register.html')
    @app.route('/cart')
    def cart_page(): return render_template('cart.html')
    @app.route('/orders')
    def orders_page(): return render_template('orders.html')

    # --- Auth ---
    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json() or {}
        user, pwd = data.get("username", "").strip(), data.get("password", "")
        if not user or len(user) < 3 or len(pwd) < 6: return jsonify({"error": "Invalid input"}), 400
        if get_user_by_username(user): return jsonify({"error": "User exists"}), 400
        return (jsonify({"message": "Registered"}), 201) if create_user(user, generate_password_hash(pwd)) else (jsonify({"error": "Failed"}), 500)

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json() or {}
        user = get_user_by_username(data.get("username", "").strip())
        if user and check_password_hash(user["password_hash"], data.get("password", "")):
            session.update({"user_id": user["id"], "username": user["username"], "logged_in": True})
            return jsonify({"message": "Success", "user": user})
        return jsonify({"error": "Invalid credentials"}), 401

    @app.route('/api/logout', methods=['POST'])
    def logout():
        session.clear()
        return jsonify({"message": "Logged out"})

    @app.route('/api/auth/status')
    def auth_status():
        return jsonify({"logged_in": session.get("logged_in", False), "user": {"username": session.get("username")}})

    # --- Products ---
    @app.route('/api/products')
    def get_products():
        # Combine featured results + specific store results
        all_products = (
            fetch_featured_products() + 
            fetch_amazon_products() + 
            fetch_bestbuy_products() + 
            fetch_walmart_products() +
            fetch_ebay_products() +
            fetch_target_products() +
            fetch_newegg_products()
        )
        return jsonify({"products": all_products})

    @app.route('/api/products/<source>')
    def get_products_by_source(source):
        src = source.lower().strip()
        funcs = {
            "amazon": fetch_amazon_products,
            "bestbuy": fetch_bestbuy_products,
            "walmart": fetch_walmart_products,
            "ebay": fetch_ebay_products,
            "target": fetch_target_products,
            "newegg": fetch_newegg_products,
            "serpapi": fetch_featured_products
        }
        if src not in funcs: return jsonify({"error": "Unknown source"}), 400
        p = funcs[src]()
        return jsonify({"source": src, "total": len(p), "products": p})

    @app.route('/api/search')
    def search_products():
        if not (q := request.args.get('q', '').strip()): return jsonify({"error": "Missing query"}), 400
        # Search everywhere using SerpAPI
        res = search_serpapi_products(q, "serpapi") 
        return jsonify({"query": q, "total": len(res), "products": sorted(res, key=lambda x: x.get('price', float('inf')))})

    @app.route('/api/debug/serpapi')
    def debug_serpapi():
        import os
        return jsonify({"key_loaded": bool(os.getenv("SERPAPI_KEY")), "test_result_count": len(search_serpapi_products("iphone"))})

    # --- Cart ---
    @app.route('/api/cart/add', methods=['POST'])
    def add_to_cart():
        d = request.get_json() or {}
        if not d.get("id") or not d.get("price"): return jsonify({"error": "Invalid data"}), 400
        
        cart, pid = session.get("cart", []), str(d["id"])
        for item in cart:
            if item["id"] == pid: item["quantity"] += d.get("quantity", 1); break
        else:
            cart.append({"id": pid, "title": d.get("title"), "price": float(d["price"]), "quantity": int(d.get("quantity", 1))})
        
        session["cart"] = cart
        return jsonify({"message": "Added", "cart": cart})

    @app.route('/api/cart')
    def get_cart():
        c = session.get("cart", [])
        return jsonify({"cart": c, "total_amount": round(sum(i["price"] * i["quantity"] for i in c), 2)})

    @app.route('/api/cart/remove', methods=['POST'])
    def remove_from_cart():
        if not (pid := request.get_json().get("id")): return jsonify({"error": "Missing ID"}), 400
        session["cart"] = [i for i in session.get("cart", []) if i["id"] != str(pid)]
        return jsonify({"message": "Removed", "cart": session["cart"]})

    @app.route('/api/cart/clear', methods=['POST'])
    def clear_cart():
        session["cart"] = []
        return jsonify({"message": "Cleared"})

    # --- Orders ---
    @app.route('/api/checkout', methods=['POST'])
    def checkout():
        if not session.get("logged_in"): return jsonify({"error": "Login required"}), 401
        if not (cart := session.get("cart", [])): return jsonify({"error": "Cart empty"}), 400
        if oid := create_order(session["user_id"], cart):
            session["cart"] = []
            return jsonify({"message": "Order placed", "order_id": oid}), 201
        return jsonify({"error": "Order failed"}), 500

    @app.route('/api/orders')
    def get_orders():
        return (jsonify({"orders": get_user_orders(session["user_id"])}), 200) if session.get("logged_in") else (jsonify({"error": "Login required"}), 401)