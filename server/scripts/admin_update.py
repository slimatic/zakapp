import sqlite3
import sys
import datetime
import uuid

db_path = "/home/agentx/github-repos/zakapp/server/prisma/zakapp.db"
username = sys.argv[1] if len(sys.argv) > 1 else "johntest"
email = f"{username}@example.com"
password_hash = sys.argv[2] if len(sys.argv) > 2 else "placeholder_hash"
now = datetime.datetime.now().isoformat()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print(f"Connecting to {db_path}...")

# Check if column exists
cursor.execute("PRAGMA table_info(users)")
columns = [info[1] for info in cursor.fetchall()]
if 'userType' not in columns:
    print("Column userType missing. Adding it...")
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN userType TEXT DEFAULT 'USER'")
        print("Added userType column.")
    except sqlite3.Error as e:
        print(f"Error adding column: {e}")

# Check if user exists
cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
row = cursor.fetchone()

if row:
    print(f"User {username} exists (ID: {row[0]}). Updating to ADMIN_USER...")
    cursor.execute("UPDATE users SET userType = 'ADMIN_USER' WHERE id = ?", (row[0],))
    if cursor.rowcount > 0:
        print("Success: Updated user role.")
    else:
        print("Warning: No rows updated.")
else:
    print(f"User {username} not found. Creating new ADMIN_USER...")
    new_id = "c" + str(uuid.uuid4()).replace("-", "")[:24] # Mock CUID-ish
    # Columns: id, email, username, passwordHash, userType, isActive, createdAt, updatedAt
    # Adjust based on schema if needed. Schema says some are optional.
    # Note: sqlite table info might be needed if columns differ.
    try:
        cursor.execute("""
            INSERT INTO users (id, email, username, passwordHash, userType, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 'ADMIN_USER', 1, ?, ?)
        """, (new_id, email, username, password_hash, now, now))
        print("Success: Created user.")
    except sqlite3.Error as e:
        print(f"Error inserting user: {e}")

conn.commit()
conn.close()
