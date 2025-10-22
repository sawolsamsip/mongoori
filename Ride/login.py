from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify, abort
import sqlite3
from werkzeug.security import check_password_hash
from dotenv import load_dotenv
import os
from db import init_db, close_conn
from datetime import datetime
from zoneinfo import ZoneInfo

app = Flask(__name__)

load_dotenv()
app.secret_key = os.getenv("SECRET_KEY")
DB_PATH = "app.db"

def make_dict(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

def get_pacific_time():
    now = datetime.now(ZoneInfo("America/Los_Angeles"))
    return now.strftime()

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
    
    return render_template("base.html")

@app.route('/admin/add_vehicle', methods = ['GET'])
def admin_add_vehicle():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    return render_template("form_vehicle.html", mode='add')

@app.route('/admin/add_vehicle', methods = ['POST'])
def admin_input_vehicle():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    vin = (request.form.get("vin") or "").strip().upper()
    make = (request.form.get("make") or "").strip()
    model = (request.form.get("model") or "").strip()
    year = (request.form.get("year") or "").strip()
    trim = (request.form.get("trim") or "").strip()
    exterior = (request.form.get("exterior") or "").strip()
    interior = (request.form.get("interior") or "").strip()
    plate_number = (request.form.get("plate_number") or "").strip().upper()
    mileage = (request.form.get("mileage") or "").strip()
    software = (request.form.get("software") or "").strip()

    errors = {}

    if not vin:
        errors["vin"] = "VIN is required."
    elif len(vin) != 17:
        errors["vin"] = "Incorrect VIN length"
    
    if errors:
        return jsonify(message = "check the input fields", errors=errors), 422
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO vehicle (vin, make, model, model_year, trim, exterior, interior, plate_number, odometer, software, vehicle_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Inactive', ?)
        """, (vin, make or None, model or None, year or None, trim or None, exterior or None, interior or None, plate_number or None, mileage or None, software or None, get_pacific_time()))
        conn.commit()
        conn.close()
    except sqlite3.IntegrityError:
        return jsonify(message="VIN already exists", errors={"vin": "VIN is already registered."}), 422
    
    return jsonify(next_url=url_for("admin_dashboard")), 200

@app.route("/admin/get_trims")
def get_trims():
    model_name = request.args.get("model_name")
    year = request.args.get("year")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT trim_name
        FROM model_year_trim_exterior
        WHERE model_name=? AND "year"=?
        ORDER BY sort_order;
    """, (model_name, year))
    trims = [r[0] for r in cur.fetchall()]
    conn.close()
    return jsonify(trims)


@app.route("/admin/get_exteriors")
def get_exteriors():
    model_name = request.args.get("model_name")
    year = request.args.get("year")
    trim = request.args.get("trim")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        SELECT t3.color_name
        FROM model_year_trim_exterior t1
        JOIN color_group t2 ON t1.color_group = t2.group_id
        JOIN colors t3 ON t2.color_id = t3.color_id
        WHERE model_name=? AND "year"=? AND trim_name=?
        ORDER BY sort_order;
    """, (model_name, year, trim))

    exteriors = [r[0] for r in cur.fetchall()]
    conn.close()
    return jsonify(exteriors)


@app.route("/admin/vehicle_info", methods=["GET"])
def admin_vehicle_list():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT vehicle_id, vin, model, model_year, trim, exterior, interior, plate_number, odometer, software, vehicle_status
        FROM vehicle
        ORDER BY created_at DESC
    """)
    vehicles = cur.fetchall()
    conn.close()
    return(render_template("vehicle_info.html", vehicles=vehicles))

@app.route("/admin/edit_vehicle/<int:vehicle_id>", methods=['GET'])
def edit_vehicle(vehicle_id):
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = make_dict
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM vehicle WHERE vehicle_id = ?", (vehicle_id,)
    )
    vehicle = cur.fetchone()
    conn.close()

    if not vehicle:
        abort(404)

    return render_template("form_vehicle.html", mode="edit", vehicle = vehicle)

@app.route("/admin/update_vehicle/<int:vehicle_id>", methods=['POST'])
def update_vehicle(vehicle_id):
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))



@app.route('/admin/debug_session')
def debug_session():
    return jsonify(dict(session))
    

if __name__ == "__main__":
    init_db()
    app.run(debug=True)