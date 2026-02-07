
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("MYSQL_HOST")
user = os.getenv("MYSQL_USER")
password = os.getenv("MYSQL_PASSWORD")
dbname = os.getenv("MYSQL_DATABASE")
port = os.getenv("MYSQL_PORT")

print(f"Attempting to connect to: {host} as {user}")

try:
    conn = psycopg2.connect(
        host=host,
        user=user,
        password=password,
        dbname=dbname,
        port=port
    )
    print("✅ Connection Successful!")
    conn.close()
except Exception as e:
    print(f"❌ Connection Failed: {e}")
