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

## String type return
def get_pacific_time():
    now = datetime.now(ZoneInfo("America/Los_Angeles"))
    return now.strftime("%Y-%m-%d %H:%M:%S")

## Date type return
def get_pacific_today():
    return datetime.now(ZoneInfo("America/Los_Angeles")).date()

def get_admin_user(username):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT admin_id, username, password_hash FROM admin_user WHERE username = ?", (username,))
    row = cur.fetchone()
    conn.close()
    return row

## warranty status
def get_warranty_status(expire_date, expire_miles, current_miles):
    today = get_pacific_today()

    if expire_date:
        try:
            expire_date = datetime.strptime(expire_date, "%Y-%m-%d").date()
        except ValueError:
            expire_date = None

    if expire_date and expire_date < today:
        return "Expired"
    if expire_miles and current_miles and int(current_miles) >= int(expire_miles):
        return "Expired"
    
    return "Active"

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
    
    return render_template("form_vehicle.html", mode='add', vehicle={})

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
            INSERT INTO vehicle (vin, make, model, model_year, trim, exterior, interior, plate_number, mileage, software, vehicle_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Inactive', ?)
        """, (vin, make or None, model or None, year or None, trim or None, exterior or None, interior or None, plate_number or None, mileage or None, software or None, get_pacific_time()))
        
        vehicle_id = cur.lastrowid

        warranty_types = request.form.getlist('warranty_type')
        warranty_dates = request.form.getlist('warranty_expire_date')
        warranty_miles = request.form.getlist('warranty_expire_miles')

        for w_type, w_date, w_miles in zip(warranty_types, warranty_dates, warranty_miles):
            if not w_type:
                continue
            cur.execute("""
                INSERT INTO warranty (vehicle_id, warranty_type, expire_date, expire_miles)
                VALUES (?, ?, ?, ?)
            """, (vehicle_id, w_type.strip(), w_date.strip() if w_date else None, w_miles.strip() if w_miles else None))

        conn.commit()
        conn.close()
    except sqlite3.IntegrityError:
        return jsonify(message="VIN already exists", errors={"vin": "VIN is already registered."}), 422
    
    return jsonify(message="Vehicle successfully added.",next_url=url_for("admin_vehicle_list")), 200

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
    conn.row_factory = make_dict
    cur = conn.cursor()
    cur.execute("""
        SELECT vehicle_id, vin, model, model_year, trim, exterior, interior, plate_number, mileage, software, vehicle_status
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
def admin_update_vehicle(vehicle_id):
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
            UPDATE vehicle
            SET vin = ?, make = ?, model = ?, model_year = ?, trim = ?,
                    exterior = ?, interior = ?, plate_number = ?, mileage = ?,
                    software = ?
            WHERE vehicle_id = ?
            
        """, (vin, make or None, model or None, year or None, trim or None, exterior or None, interior or None, plate_number or None, mileage or None, software or None, vehicle_id))
        conn.commit()
        conn.close()
    except sqlite3.IntegrityError:
        return jsonify(message="VIN already exists", errors={"vin": "VIN is already registered."}), 422
    
    return jsonify(next_url=url_for("admin_vehicle_list")), 200

## del vehicle
@app.route("/admin/delete_vehicle", methods=['POST'])
def admin_delete_vehicle():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    data = request.get_json()
    vehicle_id = data.get("vehicle_id")

    if not vehicle_id:
        return jsonify(success=False, message = "Invalid request"), 400
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        
        cur.execute("DELETE FROM warranty WHERE vehicle_id = ?", (vehicle_id,))
        cur.execute("DELETE FROM vehicle WHERE vehicle_id = ?", (vehicle_id,))

        conn.commit()
        conn.close()
        return jsonify(success = True, message="Vehicle deleted successfully")
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500
    
    

####

## warranty
@app.route("/admin/warranty_info", methods=["GET"])
def admin_warrnty_list():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = make_dict
    cur = conn.cursor()
    cur.execute("""
        SELECT v.vehicle_id, v.vin, v.model, v.model_year, v.mileage, v.plate_number,w.warranty_id, w.warranty_type, w.expire_date, w.expire_miles
        FROM warranty w
        JOIN vehicle v ON v.vehicle_id = w.vehicle_id
    """)
    rows = cur.fetchall()
    conn.close()

    warranties = []
    for row in rows:
        row["status"] = get_warranty_status(
            row["expire_date"], row["expire_miles"], row["mileage"]
        )
        warranties.append(row)
    
    return(render_template("warranty_info.html", warranties=warranties))


@app.route("/admin/update_warranty", methods = ["POST"])
def admin_update_warranty():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized")
    
    data = request.get_json()
    warranty_id = data.get("warranty_id")
    field = data.get("field")
    value = data.get("value")

    if not warranty_id or not field:
        return jsonify(success=False, message="Invalid input"), 400
    
    ## update
    allowed_fields = {"warranty_type", "expire_date", "expire_miles"}
    if field not in allowed_fields:
        return jsonify(success=False, message = "Invalid field")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = make_dict
        cur = conn.cursor()

        if field == "expire_miles":
            value = int(value) if value else None
        
        query = f"UPDATE warranty SET {field} = ? WHERE warranty_id = ?"
        cur.execute(query, (value, warranty_id))

        cur.execute("""
            SELECT w.expire_date, w.expire_miles, v.mileage as current_miles
            FROM warranty w
            JOIN vehicle v ON v.vehicle_id = w.vehicle_id
            WHERE w.warranty_id = ?
            """, (warranty_id,))
        
        w = cur.fetchone()

        conn.commit()
        conn.close()
    
        if w:
            status = get_warranty_status(
                expire_date=w["expire_date"],
                expire_miles=w["expire_miles"],
                current_miles= w["current_miles"]
                )
        else:
            status = "-"
        
        return jsonify(success=True, new_status = status)
    except Exception as e:
        print("Update error: ", e)
        return jsonify(success = False, message=str(e)), 500
        
        

@app.route('/admin/debug_session')
def debug_session():
    return jsonify(dict(session))
    

if __name__ == "__main__":
    init_db()
    app.run(debug=True)