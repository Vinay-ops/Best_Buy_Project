import mysql.connector
from mysql.connector import Error
from app.config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT

def get_db_connection():
    try:
        return mysql.connector.connect(host=MYSQL_HOST, user=MYSQL_USER, password=MYSQL_PASSWORD, database=MYSQL_DATABASE, port=MYSQL_PORT)
    except Error as e:
        print(f"❌ Connection failed: {e}")
        return None

def init_database():
    if not (conn := get_db_connection()): return
    cur = conn.cursor()
    try:
        cur.execute("CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
        cur.execute("CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, total_amount DECIMAL(10, 2) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)")
        cur.execute("CREATE TABLE IF NOT EXISTS order_items (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT NOT NULL, product_id VARCHAR(255) NOT NULL, product_title VARCHAR(500) NOT NULL, price DECIMAL(10, 2) NOT NULL, quantity INT NOT NULL, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE)")
        conn.commit(); print("✅ Database ready")
    except Error as e: print(f"❌ Init error: {e}")
    finally: cur.close(); conn.close()

def create_user(username, password_hash):
    if not (conn := get_db_connection()): return None
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s)", (username, password_hash))
        conn.commit(); return cur.lastrowid
    except Error: return None
    finally: cur.close(); conn.close()

def get_user_by_username(username):
    if not (conn := get_db_connection()): return None
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT id, username, password_hash FROM users WHERE username = %s", (username,))
        return cur.fetchone()
    except Error: return None
    finally: cur.close(); conn.close()

def create_order(user_id, cart):
    if not (conn := get_db_connection()): return None
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO orders (user_id, total_amount) VALUES (%s, %s)", (user_id, sum(i["price"] * i["quantity"] for i in cart)))
        oid = cur.lastrowid
        for i in cart:
            cur.execute("INSERT INTO order_items (order_id, product_id, product_title, price, quantity) VALUES (%s, %s, %s, %s, %s)", (oid, i["id"], i.get("title") or i.get("name") or "Unknown", i["price"], i["quantity"]))
        conn.commit(); return oid
    except Error as e: print(f"❌ Order error: {e}"); conn.rollback(); return None
    finally: cur.close(); conn.close()

def get_user_orders(user_id):
    if not (conn := get_db_connection()): return []
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute("SELECT id, total_amount, created_at FROM orders WHERE user_id = %s ORDER BY created_at DESC", (user_id,))
        orders = cur.fetchall()
        for o in orders:
            cur.execute("SELECT product_title, price, quantity FROM order_items WHERE order_id = %s", (o["id"],))
            o["items"] = cur.fetchall()
            o["total_amount"], o["created_at"] = float(o["total_amount"]), str(o["created_at"])
            for i in o["items"]: i["price"] = float(i["price"])
        return orders
    except Error: return []
    finally: cur.close(); conn.close()