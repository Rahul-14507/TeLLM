import psycopg2
import os
from dotenv import load_dotenv

# Try to find .env
env_path = os.path.join(os.getcwd(), ".env")
load_dotenv(env_path)

db_url = os.getenv("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM subjects;")
    rows = cur.fetchall()
    print("Subjects in Database:")
    for row in rows:
        print(f"ID: {row[0]} | Name: {row[1]}")
    cur.close(); conn.close()
except Exception as e:
    print(f"Error: {e}")
