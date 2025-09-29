from flask import Flask, render_template, request, redirect, url_for, session, flash
import sqlite3
from werkzeug.security import check_password_hash
from dotenv import load_dotenv
import os

app = Flask(__name__)

load_dotenv()
app.secret_key = os.getenv("SECRET_KEY")
DB_PATH = "app.db"

def get_admin_user(username):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT admin_id, username, password_hash FROM AdminUser WHERE username = ?", (username,))
    row = cur.fetchone()
    conn.close()
    return row

@app.route('/admin/login', methods = ['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']

        user = get_admin_user(username)
        if user and check_password_hash(user[2], password):
            session["admin_logged_in"] = True
            session["admin_username"] = user[1]
            return redirect(url_for("admin_dashboard"))
        
        else:
            flash("Invalid username or password")
            return redirect(url_for("admin_login"))
    
    return render_template("login-session.html")

@app.route('/admin/dashboard', methods=['GET', 'POST'])
def admin_dashboard():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    return "<h1>Admin Dashboard</h1>"