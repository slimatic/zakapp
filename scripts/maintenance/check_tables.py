import sqlite3

try:
    conn = sqlite3.connect('server/prisma/data/dev.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables found:")
    for table in tables:
        print(table[0])
    conn.close()
except Exception as e:
    print(f"Error: {e}")
