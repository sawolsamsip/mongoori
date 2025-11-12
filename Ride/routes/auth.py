from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from werkzeug.security import check_password_hash
from db import get_conn

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["GET", "POST"])
def admin_login():
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password']

        conn = get_conn()

        cur = conn.cursor()
        cur.execute("SELECT username, password_hash FROM admin_user WHERE username = ?", (username,))
        user = cur.fetchone()
        conn.close()

        if user and check_password_hash(user["password_hash"], password):
            session["admin_logged_in"] = True
            session["admin_username"] = user["username"]
            return redirect(url_for("admin_dashboard"))
        
        else:
            flash("Invalid username or password")
            return redirect(url_for("admin_login"))
    
    return render_template("login-session.html")