from flask import jsonify, request, render_template, session
from werkzeug.security import generate_password_hash, check_password_hash
from app.api_clients import (
    fetch_fakestore_products, fetch_dummyjson_products, fetch_fakeshop_products,
    search_serpapi_products, search_dummyjson_products, search_fakeshop_products
)
from app.database import create_user, get_user_by_username, create_order, get_user_orders

def register_routes(app):
    
    # --- Frontend Pages ---
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

    # --- Auth Routes ---
    
    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        if not data: return jsonify({"error": "No data"}), 400
        
        username = data.get("username", "").strip()
        password = data.get("password", "")
        
        if not username or len(username) < 3: return jsonify({"error": "Username too short"}), 400
        if len(password) < 6: return jsonify({"error": "Password too short"}), 400
        if get_user_by_username(username): return jsonify({"error": "User exists"}), 400
        
        if create_user(username, generate_password_hash(password)):
            return jsonify({"message": "Registered successfully"}), 201
        return jsonify({"error": "Registration failed"}), 500

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        if not data: return jsonify({"error": "No data"}), 400
        
        user = get_user_by_username(data.get("username", "").strip())
        if user and check_password_hash(user["password_hash"], data.get("password", "")):
            session.update({"user_id": user["id"], "username": user["username"], "logged_in": True})
            return jsonify({"message": "Login successful", "user": user}), 200
        return jsonify({"error": "Invalid credentials"}), 401

    @app.route('/api/logout', methods=['POST'])
    def logout():
        session.clear()
        return jsonify({"message": "Logged out"}), 200

    @app.route('/api/auth/status')
    def auth_status():
        return jsonify({"logged_in": session.get("logged_in", False), "user": {"username": session.get("username")}}), 200

    # --- Product Routes ---

    @app.route('/api/products')
    def get_all_products():
        # Fetch normalized products directly
        p1 = fetch_fakestore_products()
        p2 = fetch_dummyjson_products()
        p3 = fetch_fakeshop_products()
        all_products = p1 + p2 + p3
        return jsonify({"total": len(all_products), "products": all_products}), 200

    @app.route('/api/products/<source>')
    def get_products_by_source(source):
        source = source.lower().strip()
        if source == "fakestore": p = fetch_fakestore_products()
        elif source == "dummyjson": p = fetch_dummyjson_products()
        elif source == "fakeshop": p = fetch_fakeshop_products()
        else: return jsonify({"error": "Unknown source"}), 400
        return jsonify({"source": source, "total": len(p), "products": p}), 200

    @app.route('/api/search')
    def search_products():
        query = request.args.get('q', '').strip()
        if not query: return jsonify({"error": "Missing query"}), 400
        
        # Search all sources (Google -> Dummy -> FakeShop)
        results = search_serpapi_products(query) + search_dummyjson_products(query) + search_fakeshop_products(query)
        
        # Sort results by price (ascending) to show lowest price first
        results.sort(key=lambda x: x.get('price', float('inf')))
        
        return jsonify({"query": query, "total": len(results), "products": results}), 200

    # --- Cart Routes ---

    @app.route('/api/cart/add', methods=['POST'])
    def add_to_cart():
        data = request.get_json()
        if not data or not data.get("id") or not data.get("price"):
            return jsonify({"error": "Invalid data"}), 400
            
        cart = session.get("cart", [])
        product_id = str(data["id"])
        
        # Update quantity if exists, else add new
        for item in cart:
            if item["id"] == product_id:
                item["quantity"] += data.get("quantity", 1)
                break
        else:
            cart.append({
                "id": product_id, "title": data.get("title", ""),
                "price": float(data["price"]), "quantity": int(data.get("quantity", 1))
            })
        
        session["cart"] = cart
        return jsonify({"message": "Added to cart", "cart": cart}), 200

    @app.route('/api/cart')
    def get_cart():
        cart = session.get("cart", [])
        total = sum(item["price"] * item["quantity"] for item in cart)
        return jsonify({"cart": cart, "total_amount": round(total, 2)}), 200

    @app.route('/api/cart/remove', methods=['POST'])
    def remove_from_cart():
        pid = request.get_json().get("id")
        if not pid: return jsonify({"error": "Missing ID"}), 400
        
        cart = [item for item in session.get("cart", []) if item["id"] != str(pid)]
        session["cart"] = cart
        return jsonify({"message": "Removed", "cart": cart}), 200
        
    @app.route('/api/cart/clear', methods=['POST'])
    def clear_cart():
        session["cart"] = []
        return jsonify({"message": "Cart cleared"}), 200

    # --- Order Routes ---

    @app.route('/api/checkout', methods=['POST'])
    def checkout():
        if not session.get("logged_in"): return jsonify({"error": "Login required"}), 401
        cart = session.get("cart", [])
        if not cart: return jsonify({"error": "Cart empty"}), 400
        
        if order_id := create_order(session["user_id"], cart):
            session["cart"] = []
            return jsonify({"message": "Order placed", "order_id": order_id}), 201
        return jsonify({"error": "Order failed"}), 500

    @app.route('/api/orders')
    def get_orders():
        if not session.get("logged_in"): return jsonify({"error": "Login required"}), 401
        return jsonify({"orders": get_user_orders(session["user_id"])}), 200
