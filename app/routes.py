from flask import jsonify, request, render_template, session
from werkzeug.security import generate_password_hash, check_password_hash
import concurrent.futures
import random
import datetime

# Import API fetchers
from app.api_clients import (
    fetch_featured_products, fetch_amazon_products, fetch_bestbuy_products, fetch_walmart_products,
    fetch_ebay_products, fetch_target_products, fetch_newegg_products,
    fetch_macys_products, fetch_nordstrom_products,
    fetch_sephora_products, fetch_barnes_products, fetch_dicks_products,
    fetch_homedepot_products, fetch_chewy_products, fetch_guitarcenter_products, fetch_staples_products,
    search_serpapi_products
)

# Import Database functions
from app.database import (
    create_user, get_user_by_username, create_order, get_user_orders, add_price_alert
)

def register_routes(app):
    """
    Register all the website routes (URLs) for the app.
    """

    # ---------------------------
    # Frontend Pages (HTML)
    # ---------------------------
    @app.route('/')
    def index(): 
        return render_template('index.html')

    @app.route('/products')
    def products_page(): 
        return render_template('products.html')

    @app.route('/login')
    def login_page(): 
        return render_template('login.html')

    @app.route('/register')
    def register_page(): 
        return render_template('register.html')

    @app.route('/cart')
    def cart_page(): 
        return render_template('cart.html')

    @app.route('/orders')
    def orders_page(): 
        return render_template('orders.html')

    @app.route('/about')
    def about_page(): 
        return render_template('about.html')

    # ---------------------------
    # User Authentication API
    # ---------------------------
    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json() or {}
        username = data.get("username", "").strip()
        password = data.get("password", "")

        # Validation
        if not username or len(username) < 3:
            return jsonify({"error": "Username must be at least 3 chars"}), 400
        if not password or len(password) < 6:
            return jsonify({"error": "Password must be at least 6 chars"}), 400
        
        # Check if user exists
        if get_user_by_username(username):
            return jsonify({"error": "User already exists"}), 400

        # Create user
        hashed_password = generate_password_hash(password)
        if create_user(username, hashed_password):
            return jsonify({"message": "Registration successful"}), 201
        else:
            return jsonify({"error": "Registration failed"}), 500

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json() or {}
        username = data.get("username", "").strip()
        password = data.get("password", "")

        user = get_user_by_username(username)
        
        if user and check_password_hash(user["password_hash"], password):
            # Save user info in session (cookies)
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            session["logged_in"] = True
            return jsonify({"message": "Login successful", "user": user})
        
        return jsonify({"error": "Invalid username or password"}), 401

    @app.route('/api/logout', methods=['POST'])
    def logout():
        session.clear()
        return jsonify({"message": "Logged out successfully"})

    @app.route('/api/auth/status')
    def auth_status():
        """Check if user is currently logged in."""
        return jsonify({
            "logged_in": session.get("logged_in", False), 
            "user": {"username": session.get("username")}
        })

    # ---------------------------
    # Product API
    # ---------------------------
    @app.route('/api/products')
    def get_products():
        """
        Fetch products from ALL stores simultaneously using parallel processing.
        This prevents the page from loading slowly.
        """
        # List of functions to call
        fetch_functions = [
            fetch_featured_products, 
            fetch_macys_products, 
            fetch_nordstrom_products,
            fetch_sephora_products,
            fetch_barnes_products,
            fetch_dicks_products,
            fetch_homedepot_products,
            fetch_chewy_products,
            fetch_guitarcenter_products,
            fetch_staples_products
        ]
        
        all_products = []
        
        # 'ThreadPoolExecutor' runs these functions at the same time (parallel)
        # instead of one by one. This is much faster!
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            # Start all tasks
            futures = [executor.submit(func) for func in fetch_functions]
            
            # Collect results as they finish
            for future in concurrent.futures.as_completed(futures):
                try:
                    products = future.result()
                    if products:
                        all_products.extend(products)
                except Exception as e:
                    print(f"Error fetching data: {e}")
                
        return jsonify({"products": all_products})

    @app.route('/api/products/<source>')
    def get_products_by_source(source):
        src = source.lower().strip()
        
        # Map source names to functions
        source_map = {
            "amazon": fetch_amazon_products,
            "bestbuy": fetch_bestbuy_products,
            "walmart": fetch_walmart_products,
            "ebay": fetch_ebay_products,
            "target": fetch_target_products,
            "newegg": fetch_newegg_products,
            "macys": fetch_macys_products,
            "nordstrom": fetch_nordstrom_products,
            "sephora": fetch_sephora_products,
            "barnesandnoble": fetch_barnes_products,
            "dicks": fetch_dicks_products,
            "homedepot": fetch_homedepot_products,
            "chewy": fetch_chewy_products,
            "guitarcenter": fetch_guitarcenter_products,
            "staples": fetch_staples_products,
            "serpapi": fetch_featured_products
        }
        
        if src not in source_map:
            return jsonify({"error": "Unknown source"}), 400
            
        products = source_map[src]()
        return jsonify({"source": src, "total": len(products), "products": products})

    @app.route('/api/search')
    def search_products():
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({"error": "Missing search query"}), 400
            
        # Define stores to check explicitly for comparison
        stores = ["serpapi", "amazon", "bestbuy", "walmart", "ebay", "target"]
        results = []

        # Helper function for parallel execution
        def fetch_store_results(store):
            try:
                # search_serpapi_products handles caching and 'site:' filtering
                return search_serpapi_products(query, store)
            except Exception as e:
                print(f"Error searching {store}: {e}")
                return []

        # Run searches in parallel to be fast
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            futures = [executor.submit(fetch_store_results, store) for store in stores]
            for future in concurrent.futures.as_completed(futures):
                store_results = future.result()
                if store_results:
                    results.extend(store_results)
        
        # Remove duplicates based on ID or strict title matching
        seen = set()
        unique_results = []
        for p in results:
            # Create a unique key (id is usually good, but let's be safe)
            key = p.get('id')
            if key not in seen:
                seen.add(key)
                unique_results.append(p)

        # Sort by price (lowest first) to show best deals at top
        sorted_results = sorted(unique_results, key=lambda x: x.get('price', float('inf')))
        
        return jsonify({"query": query, "total": len(sorted_results), "products": sorted_results})

    @app.route('/api/debug/serpapi')
    def debug_serpapi():
        import os
        key_exists = bool(os.getenv("SERPAPI_KEY"))
        return jsonify({
            "key_loaded": key_exists, 
            "test_result_count": len(search_serpapi_products("iphone")) if key_exists else 0
        })

    # ---------------------------
    # Cart API
    # ---------------------------
    @app.route('/api/cart/add', methods=['POST'])
    def add_to_cart():
        data = request.get_json() or {}
        product_id = str(data.get("id"))
        price = data.get("price")
        
        if not product_id or not price:
            return jsonify({"error": "Invalid product data"}), 400
        
        cart = session.get("cart", [])
        
        # Check if item already in cart
        found = False
        for item in cart:
            if item["id"] == product_id:
                item["quantity"] += data.get("quantity", 1)
                found = True
                break
        
        if not found:
            cart.append({
                "id": product_id, 
                "title": data.get("title"), 
                "price": float(price), 
                "quantity": int(data.get("quantity", 1))
            })
        
        session["cart"] = cart
        return jsonify({"message": "Added to cart", "cart": cart})

    @app.route('/api/cart')
    def get_cart():
        cart = session.get("cart", [])
        total = sum(item["price"] * item["quantity"] for item in cart)
        return jsonify({"cart": cart, "total_amount": round(total, 2)})

    @app.route('/api/cart/remove', methods=['POST'])
    def remove_from_cart():
        data = request.get_json() or {}
        product_id = str(data.get("id"))
        
        if not product_id:
            return jsonify({"error": "Missing product ID"}), 400
            
        # Keep items that don't match the ID
        cart = session.get("cart", [])
        session["cart"] = [item for item in cart if item["id"] != product_id]
        
        return jsonify({"message": "Removed from cart", "cart": session["cart"]})

    @app.route('/api/cart/clear', methods=['POST'])
    def clear_cart():
        session["cart"] = []
        return jsonify({"message": "Cart cleared"})

    @app.route('/api/cart/optimize')
    def optimize_cart():
        """Simulates finding a cheaper total price AND suggests related products."""
        cart = session.get("cart", [])
        if not cart:
            return jsonify({"error": "Cart is empty"}), 400
        
        # Simulate a 5-15% discount
        original_total = sum(item["price"] * item["quantity"] for item in cart)
        discount_factor = 0.85 + (random.random() * 0.1) # 0.85 to 0.95
        new_total = round(original_total * discount_factor, 2)

        # --- Generate Suggestions ---
        suggestions = []
        try:
            # Select up to 3 items from the cart to base suggestions on
            target_items = cart[:3]
            
            def get_suggestions_for_item(item):
                try:
                    title = item.get("title", "")
                    # Use the first 3 words to get a broad category match
                    search_term = " ".join(title.split()[:3])
                    results = search_serpapi_products(search_term, "serpapi")
                    # Return top 2 distinct items
                    return [p for p in results if p.get("id") != item.get("id")][:2]
                except:
                    return []

            # Run searches in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                futures = [executor.submit(get_suggestions_for_item, item) for item in target_items]
                for future in concurrent.futures.as_completed(futures):
                    suggestions.extend(future.result())
            
            # Shuffle and limit to 6 items to keep it fresh
            random.shuffle(suggestions)
            suggestions = suggestions[:6]
            
        except Exception as e:
            print(f"Suggestion error: {e}")
        
        return jsonify({
            "original_total": original_total,
            "new_total": new_total,
            "savings": round(original_total - new_total, 2),
            "message": "We found a better deal by combining sellers!",
            "suggestions": suggestions
        })

    # ---------------------------
    # Order & Checkout API
    # ---------------------------
    @app.route('/api/checkout', methods=['POST'])
    def checkout():
        if not session.get("logged_in"):
            return jsonify({"error": "Please login first"}), 401
            
        cart = session.get("cart", [])
        if not cart:
            return jsonify({"error": "Cart is empty"}), 400
            
        user_id = session["user_id"]
        total_amount = sum(item["price"] * item["quantity"] for item in cart)
        
        order_id, error_msg = create_order(user_id, total_amount, cart)
        if order_id:
            session["cart"] = [] # Clear cart
            return jsonify({"message": "Order placed successfully!", "order_id": order_id}), 201
        
        return jsonify({"error": f"Failed to place order: {error_msg}"}), 500

    @app.route('/api/orders')
    def get_orders():
        if not session.get("logged_in"):
            return jsonify({"error": "Please login first"}), 401
            
        orders = get_user_orders(session["user_id"])
        return jsonify({"orders": orders}), 200

    # ---------------------------
    # Extra Features (Price History, Alerts, AI)
    # ---------------------------
    @app.route('/api/price-history', methods=['POST'])
    def get_price_history():
        """Returns generated price history for the graph demo."""
        data = request.get_json() or {}
        try:
            current_price = float(data.get('price', 100))
        except:
            current_price = 100.0
        
        # Generate 30 days of fake history data
        history = []
        today = datetime.date.today()
        
        for i in range(30):
            date = (today - datetime.timedelta(days=30-i)).isoformat()
            # Fluctuate price by +/- 10%
            fluctuation = current_price * (1 + (random.random() * 0.2 - 0.1))
            history.append({"date": date, "price": round(fluctuation, 2)})
            
        return jsonify({"history": history, "current_price": current_price})

    @app.route('/api/set-alert', methods=['POST'])
    def set_price_alert():
        if not session.get("logged_in"):
            return jsonify({"error": "Please login first"}), 401
            
        data = request.get_json() or {}
        success = add_price_alert(
            session["user_id"], 
            data.get("title"), 
            float(data.get("target_price", 0)), 
            data.get("email")
        )
        
        if success:
            return jsonify({"message": "Price alert set!"})
        else:
            return jsonify({"error": "Failed to set alert"}), 500

    @app.route('/api/ai-summary', methods=['POST'])
    def get_ai_summary():
        """Simulates an AI review summary."""
        data = request.get_json() or {}
        title = data.get("title", "Product")
        
        # Placeholder summary logic
        summaries = [
            f"Buyers are raving about the {title}. Most users appreciate the build quality and value for money.",
            f"The {title} is a solid choice. Pros: excellent performance. Cons: shipping was slow for some.",
            f"Highly recommended! The features on this {title} beat the competition at this price point."
        ]
        
        return jsonify({"summary": random.choice(summaries)})
