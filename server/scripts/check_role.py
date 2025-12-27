
import sqlite3

DB_PATH = 'server/prisma/zakapp.db'

def check_role(username):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT role FROM User WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            print(f"User {username} role: {row[0]}")
        else:
            print(f"User {username} not found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_role("johntest")
