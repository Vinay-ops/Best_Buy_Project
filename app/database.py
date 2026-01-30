import mysql.connector
from mysql.connector import Error
from app.config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT

def get_db_connection():
    """Connect to MySQL database"""
    try:
        return mysql.connector.connect(
            host=MYSQL_HOST, user=MYSQL_USER, password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE, port=MYSQL_PORT
        )
    except Error as e:
        print(f"❌ Connection failed: {e}")
        return None

def init_database():
    """Create tables if needed"""
    if not (conn := get_db_connection()): return
    
    cursor = conn.cursor()
    try:
        # 1. Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 2. Orders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        
        # 3. Order Items table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                product_id VARCHAR(255) NOT NULL,
                product_title VARCHAR(500) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                quantity INT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        """)
        conn.commit()
        print("✅ Database ready")
    except Error as e:
        print(f"❌ Init error: {e}")
    finally:
        cursor.close()
        conn.close()

def create_user(username, password_hash):
    """Add new user"""
    if not (conn := get_db_connection()): return None
    
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (%s, %s)",
            (username, password_hash)
        )
        conn.commit()
        return cursor.lastrowid
    except Error: return None
    finally:
        cursor.close()
        conn.close()

def get_user_by_username(username):
    """Find user by username"""
    if not (conn := get_db_connection()): return None
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, username, password_hash FROM users WHERE username = %s", (username,))
        return cursor.fetchone()
    except Error: return None
    finally:
        cursor.close()
        conn.close()

def create_order(user_id, cart_items):
    """Save order and items"""
    if not (conn := get_db_connection()): return None
    
    cursor = conn.cursor()
    try:
        total = sum(item["price"] * item["quantity"] for item in cart_items)
        
        # Save Order
        cursor.execute("INSERT INTO orders (user_id, total_amount) VALUES (%s, %s)", (user_id, total))
        order_id = cursor.lastrowid
        
        # Save Items
        for item in cart_items:
            title = item.get("name") or item.get("title") or "Unknown"
            cursor.execute(
                """INSERT INTO order_items (order_id, product_id, product_title, price, quantity) 
                   VALUES (%s, %s, %s, %s, %s)""",
                (order_id, item["id"], title, item["price"], item["quantity"])
            )
        
        conn.commit()
        return order_id
    except Error as e:
        print(f"❌ Order error: {e}")
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()

def get_user_orders(user_id):
    """Get user's order history"""
    if not (conn := get_db_connection()): return []
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, total_amount, created_at FROM orders WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,)
        )
        orders = cursor.fetchall()
        
        for order in orders:
            cursor.execute(
                "SELECT product_title, price, quantity FROM order_items WHERE order_id = %s",
                (order["id"],)
            )
            order["items"] = cursor.fetchall()
            
            # Format types
            order["total_amount"] = float(order["total_amount"])
            order["created_at"] = str(order["created_at"])
            for item in order["items"]: item["price"] = float(item["price"])
            
        return orders
    except Error: return []
    finally:
        cursor.close()
        conn.close()
