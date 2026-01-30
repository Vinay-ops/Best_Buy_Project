import sys
import os
import mysql.connector
from mysql.connector import Error

# Add project root to path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT

def verify_db():
    print(f"Checking database connection to {MYSQL_HOST}:{MYSQL_PORT}...")
    
    # Try connecting to the specific database
    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            port=MYSQL_PORT
        )
        if conn.is_connected():
            print(f"✅ Successfully connected to database '{MYSQL_DATABASE}'")
            conn.close()
            return True
    except Error as e:
        if e.errno == 1049:  # Unknown database
            print(f"⚠️  Database '{MYSQL_DATABASE}' does not exist. Attempting to create it...")
            if create_db():
                # Retry connection
                return verify_db()
            return False
        else:
            print(f"❌ Error connecting to database: {e}")
            return False

def create_db():
    try:
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            port=MYSQL_PORT
        )
        if conn.is_connected():
            cursor = conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE}")
            print(f"✅ Database '{MYSQL_DATABASE}' created successfully")
            conn.close()
            return True
    except Error as e:
        print(f"❌ Error creating database: {e}")
        return False

if __name__ == "__main__":
    print("Starting setup verification...")
    if verify_db():
        print("\n✅ Setup verification passed! You can now run the app.")
    else:
        print("\n❌ Setup verification failed. Please check the errors above.")
