from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from dotenv import load_dotenv
import os
from db import init_db, close_conn
from routes.auth import auth_bp
from routes.vehicle import vehicle_bp
from routes.warranty import warranty_bp

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

##
app.teardown_appcontext(close_conn)
##

app.register_blueprint(auth_bp, url_prefix="/")
app.register_blueprint(vehicle_bp, url_prefix="/admin")
app.register_blueprint(warranty_bp, url_prefix="/admin")

@app.route('/admin/dashboard', methods=['GET', 'POST'])
def admin_dashboard():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    return render_template("base.html")

@app.route('/admin/debug_session')
def debug_session():
    return jsonify(dict(session))
    

if __name__ == "__main__":
    init_db()
    app.run(debug=True)