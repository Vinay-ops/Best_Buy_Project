import mysql.connector
from mysql.connector import Error
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT

def get_db_connection():
    """Create a connection to the database (MySQL or PostgreSQL)."""
    # Try PostgreSQL (Supabase) first if port matches standard Postgres ports
    if MYSQL_PORT in [5432, 6543]:
        try:
            conn = psycopg2.connect(
                host=MYSQL_HOST,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                dbname=MYSQL_DATABASE,
                port=MYSQL_PORT,
                sslmode='require'
            )
            return conn
        except Exception as e:
            print(f"❌ PostgreSQL Connection failed: {e}")
            return None
    
    # Fallback to MySQL
    try:
        return mysql.connector.connect(
            host=MYSQL_HOST, 
            user=MYSQL_USER, 
            password=MYSQL_PASSWORD, 
            database=MYSQL_DATABASE, 
            port=MYSQL_PORT
        )
    except Error as e:
        print(f"❌ MySQL Connection failed: {e}")
        return None

def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """Helper to execute database queries."""
    conn = get_db_connection()
    if not conn:
        return None
    
    # Check if it's a PostgreSQL connection
    is_postgres = hasattr(conn, 'info')  # psycopg2 connection object has 'info' attribute
    
    try:
        if is_postgres:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
        else:
            cursor = conn.cursor(dictionary=True)
            
        cursor.execute(query, params)
        
        if commit:
            conn.commit()
            if is_postgres:
                # PostgreSQL doesn't always support lastrowid the same way
                # Usually we need "RETURNING id" in the query for Postgres
                return True 
            else:
                return cursor.lastrowid
            
        if fetch_one:
            return cursor.fetchone()
        if fetch_all:
            return cursor.fetchall()
            
    except Exception as e:
        print(f"❌ Query error: {e}")
    finally:
        cursor.close()
        conn.close()
    return None

def init_database():
    """Initialize the database tables if they don't exist."""
    conn = get_db_connection()
    if not conn:
        return

    is_postgres = hasattr(conn, 'info')
    cursor = conn.cursor()
    
    # Define Types based on DB
    if is_postgres:
        AUTO_INC = "SERIAL"
        TIMESTAMP = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    else:
        AUTO_INC = "INT AUTO_INCREMENT"
        TIMESTAMP = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
    
    # List of tables to create
    tables = [
        f"""CREATE TABLE IF NOT EXISTS users (
            id {AUTO_INC} PRIMARY KEY, 
            username VARCHAR(50) UNIQUE NOT NULL, 
            password_hash VARCHAR(255) NOT NULL, 
            created_at {TIMESTAMP}
        )""",
        f"""CREATE TABLE IF NOT EXISTS orders (
            id {AUTO_INC} PRIMARY KEY, 
            user_id INT NOT NULL, 
            total_amount DECIMAL(10, 2) NOT NULL, 
            created_at {TIMESTAMP}, 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )""",
        f"""CREATE TABLE IF NOT EXISTS order_items (
            id {AUTO_INC} PRIMARY KEY, 
            order_id INT NOT NULL, 
            product_id VARCHAR(255) NOT NULL, 
            product_title VARCHAR(500) NOT NULL, 
            price DECIMAL(10, 2) NOT NULL, 
            quantity INT NOT NULL, 
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )""",
        f"""CREATE TABLE IF NOT EXISTS price_history (
            id {AUTO_INC} PRIMARY KEY,
            product_id VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            recorded_at DATE NOT NULL,
            source VARCHAR(50)
        )""",
        f"""CREATE TABLE IF NOT EXISTS price_alerts (
            id {AUTO_INC} PRIMARY KEY,
            user_id INT,
            product_title VARCHAR(500) NOT NULL,
            target_price DECIMAL(10, 2) NOT NULL,
            email VARCHAR(255) NOT NULL,
            created_at {TIMESTAMP}
        )"""
    ]

    try:
        for table_sql in tables:
            cursor.execute(table_sql)
        conn.commit()
        print("✅ Database ready")
    except Error as e:
        print(f"❌ Init error: {e}")
    finally:
        cursor.close()
        conn.close()

def create_user(username, password_hash):
    """Register a new user."""
    query = "INSERT INTO users (username, password_hash) VALUES (%s, %s)"
    return execute_query(query, (username, password_hash), commit=True)

def get_user_by_username(username):
    """Find a user by username."""
    query = "SELECT * FROM users WHERE username = %s"
    return execute_query(query, (username,), fetch_one=True)

def create_order(user_id, total_amount, items):
    """Create a new order with items."""
    conn = get_db_connection()
    if not conn:
        return None, "Database connection failed"
        
    is_postgres = hasattr(conn, 'info')
    cursor = conn.cursor()
    try:
        # 1. Create Order
        if is_postgres:
            cursor.execute(
                "INSERT INTO orders (user_id, total_amount) VALUES (%s, %s) RETURNING id",
                (user_id, total_amount)
            )
            order_id = cursor.fetchone()[0]
        else:
            cursor.execute(
                "INSERT INTO orders (user_id, total_amount) VALUES (%s, %s)",
                (user_id, total_amount)
            )
            order_id = cursor.lastrowid
        
        # 2. Add Items
        item_values = [
            (order_id, i['id'], i['title'], i['price'], i['quantity']) 
            for i in items
        ]
        cursor.executemany(
            """INSERT INTO order_items (order_id, product_id, product_title, price, quantity) 
               VALUES (%s, %s, %s, %s, %s)""",
            item_values
        )
        
        conn.commit()
        return order_id, None
    except Exception as e:
        print(f"❌ Order error: {e}")
        conn.rollback()
        return None, str(e)
    finally:
        cursor.close()
        conn.close()

def get_user_orders(user_id):
    """Get all orders for a user."""
    query = """
        SELECT o.id, o.total_amount, o.created_at,
               oi.product_title, oi.price, oi.quantity, oi.product_id
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = %s
        ORDER BY o.created_at DESC
    """
    rows = execute_query(query, (user_id,), fetch_all=True)
    
    if not rows:
        return []
        
    # Group items by order
    orders = {}
    for row in rows:
        oid = row['id']
        if oid not in orders:
            orders[oid] = {
                'order_id': oid,
                'total_amount': float(row['total_amount']),
                'created_at': row['created_at'],
                'items': []
            }
        orders[oid]['items'].append({
            'product_title': row['product_title'],
            'price': float(row['price']),
            'quantity': row['quantity'],
            'product_id': row['product_id']
        })
    
    return list(orders.values())

def add_price_alert(user_id, product_title, target_price, email):
    """Add a price watch alert."""
    query = """
        INSERT INTO price_alerts (user_id, product_title, target_price, email)
        VALUES (%s, %s, %s, %s)
    """
    return execute_query(query, (user_id, product_title, target_price, email), commit=True)
