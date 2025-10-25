import sqlite3
from flask import g

DB_PATH = "app.db"

def get_conn():
    if "db" not in g:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        g.db = conn
    return g.db

def close_conn(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    with open("schema.sql", "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    
    # with open("db/seed.sql", "r", encoding="utf-8") as f:
    #     conn.executescript(f.read())

    conn.close()
