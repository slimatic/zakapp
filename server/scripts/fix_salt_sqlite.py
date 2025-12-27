
import sqlite3
import json
import os
import secrets

# Hardcoded path to DB as per .env
DB_PATH = 'server/prisma/zakapp.db'

def fix_salt(username):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print(f"Checking user: {username}")
    
    # Try to find user
    cursor.execute("SELECT id, profile FROM User WHERE username = ? OR email = ?", (username, username))
    row = cursor.fetchone()
    
    if not row:
        print("User not found!")
        return
        
    user_id, profile_json = row
    print(f"User found: {user_id}")
    
    try:
        profile = json.loads(profile_json) if profile_json else {}
    except:
        print("Profile JSON invalid, resetting")
        profile = {}
        
    if 'salt' in profile and profile['salt']:
        print(f"User ALREADY has salt: {profile['salt']}")
        return

    # Generate salt
    new_salt = secrets.token_hex(16)
    print(f"Generating new salt: {new_salt}")
    
    profile['salt'] = new_salt
    
    new_profile_json = json.dumps(profile)
    
    cursor.execute("UPDATE User SET profile = ? WHERE id = ?", (new_profile_json, user_id))
    conn.commit()
    print("✅ Salt updated successfully.")
    conn.close()

if __name__ == "__main__":
    fix_salt("johntest")
