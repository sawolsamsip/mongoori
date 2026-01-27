from flask import Blueprint, render_template, request, session, redirect, url_for, flash
from werkzeug.security import check_password_hash, generate_password_hash
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

        if user and check_password_hash(user["password_hash"], password):
            session.permanent = True
            session["admin_logged_in"] = True
            session["admin_username"] = user["username"]
            return redirect(url_for("dashboard_pages.admin_dashboard"))
        
        else:
            print('invalid')
            flash("Invalid username or password")
            return redirect(url_for("auth.admin_login"))
    
    return render_template("login-session.html")

## logout
@auth_bp.route("/logout")
def admin_logout():
    session.clear()
    return redirect(url_for("auth.admin_login"))

## change password
@auth_bp.route("/change-password", methods=["GET", "POST"])
def change_password():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))

    if request.method == "POST":
        current_password = request.form.get("current_password")
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")

        if not current_password or not new_password or not confirm_password:
            flash("All fields are required")
            return redirect(url_for("auth.change_password"))

        if new_password != confirm_password:
            flash("New passwords do not match")
            return redirect(url_for("auth.change_password"))

        username = session.get("admin_username")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT password_hash FROM admin_user WHERE username = ?",
            (username,)
        )
        user = cur.fetchone()

        if not user:
            flash("User not found")
            return redirect(url_for("auth.change_password"))

        if not check_password_hash(user["password_hash"], current_password):
            flash("Current password is incorrect")
            return redirect(url_for("auth.change_password"))

        new_hash = generate_password_hash(new_password, method='pbkdf2:sha256')

        cur.execute("""
            UPDATE admin_user
            SET password_hash = ?
            WHERE username = ?
        """, (new_hash, username))

        conn.commit()
        conn.close()

        flash("Password updated successfully")
        return redirect(url_for("dashboard_pages.admin_dashboard"))

    return render_template("account/change_password.html")
