import argparse
import sqlite3
import sys
from getpass import getpass
from werkzeug.security import generate_password_hash

def parse_args():
    p = argparse.ArgumentParser(description="Create an admin user")
    p.add_argument("--db", required=True, help="DB file Path")
    p.add_argument("--username", help="Admin User name")
    return p.parse_args()

def main():
    args = parse_args()
    db_path = args.db
    username = (args.username or "").strip()

    if not username:
        username = input("Enter admin username: ").strip()
    
    if not username:
        print("Error: username is required", file = sys.stderr)
        sys.exit(1)

    pw_first = getpass("Enter password: ")
    pw_second = getpass("Confirm Password: ")

    while pw_first != pw_second:
        print("Passwords do not match", file = sys.stderr)
        pw_first = getpass("Enter password: ")
        pw_second = getpass("Confirm Password: ")
    
    pw_hash = generate_password_hash(pw_first, method='pbkdf2:sha256')

    conn = sqlite3.connect(db_path)

    try:
        cur = conn.cursor()
        try:
            cur.execute("INSERT INTO admin_user (username, password_hash) VALUES (?, ?)",
                        (username, pw_hash))
            conn.commit()
            print(f"Admin user {username} created successfully.")
        except sqlite3.IntegrityError as e:
            print(f"Error: Fail to insert user")
            sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()    
        
