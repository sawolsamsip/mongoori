from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session, abort
from db import get_conn
from utils.time_utils import get_pacific_time
from utils.warranty_utils import get_purchase_warranty_types, get_subscription_warranty_types
import sqlite3

vehicle_bp = Blueprint("vehicle", __name__)

@vehicle_bp.route("/vehicle/list", methods=["GET"])
def admin_vehicle_list():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT vehicle_id, vin, model, model_year, trim, exterior, interior, plate_number, mileage, software, vehicle_status
        FROM vehicle
        ORDER BY created_at DESC
    """)
    vehicles = cur.fetchall()

    purchase_types = get_purchase_warranty_types()
    subscription_types = get_subscription_warranty_types()
    
    return(render_template("vehicle_info.html", vehicles=vehicles, purchase_types=purchase_types, subscription_types=subscription_types))

## add vehicle to load 'purchase' warranty options for dropdown list
@vehicle_bp.route('/vehicle/add', methods = ['GET'])
def admin_add_vehicle():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    
    purchase_types = get_purchase_warranty_types()

    return render_template("form_vehicle.html", mode='add', vehicle={}, purchase_types=purchase_types)


@vehicle_bp.route('/vehicle/add', methods = ['POST'])
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
    
    ## warranty list
    warranty_types = request.form.getlist('warranty_type')
    warranty_dates = request.form.getlist('warranty_expire_date')
    warranty_miles = request.form.getlist('warranty_expire_miles')
    
    #length validation
    if not (len(warranty_types) == len(warranty_dates) == len(warranty_miles)):
        return jsonify(
            message="Warranty field mismatch.",
            errors={"warranty": "Inconsistent warranty input length."}
        ), 422
    
    try:
        conn = get_conn()
        cur = conn.cursor()
        
        ## insert vehicle data
        cur.execute("""
            INSERT INTO vehicle (vin, make, model, model_year, trim, exterior, interior, plate_number, mileage, software, vehicle_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Inactive', ?)
        """, (vin, make or None, model or None, year or None, trim or None, exterior or None, interior or None, plate_number or None, mileage or None, software or None, get_pacific_time()))
        
        vehicle_id = cur.lastrowid

        ## insert common warranty data
        for i, wtype in enumerate(warranty_types):
            if not wtype:
                continue
            
            wtype_id = int(wtype)

            exp_date = (warranty_dates[i] or "").strip() or None
            raw_miles = (warranty_miles[i] or "").strip()
            exp_miles = int(raw_miles) if raw_miles.isdigit() else None

            cur.execute("""
                INSERT INTO vehicle_warranty (vehicle_id, warranty_type_id, category)
                SELECT ?, warranty_type_id, category
                FROM warranty_type WHERE warranty_type_id = ?
            """, (vehicle_id, wtype_id))

            vw_id = cur.lastrowid

            cur.execute("""
                INSERT INTO warranty_purchase (vehicle_warranty_id, expire_date, expire_miles)
                VALUES (?, ?, ?)
            """, (vw_id, exp_date, exp_miles))

        conn.commit()
        
    except sqlite3.IntegrityError:
        conn.rollback()
        
        return jsonify(message="VIN already exists", errors={"vin": "VIN is already registered."}), 422
    
    except Exception as e:
        conn.rollback()
        
        return jsonify(message="Insert failed", error=str(e)), 500

    return jsonify(message="Vehicle successfully added.",next_url=url_for("vehicle.admin_vehicle_list")), 200

@vehicle_bp.route("/get_trims")
def get_trims():
    model_name = request.args.get("model_name")
    year = request.args.get("year")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT trim_name
        FROM model_year_trim_exterior
        WHERE model_name=? AND "year"=?
        ORDER BY sort_order;
    """, (model_name, year))
    trims = [r["trim_name"] for r in cur.fetchall()]
    
    return jsonify(trims)


@vehicle_bp.route("/get_exteriors")
def get_exteriors():
    model_name = request.args.get("model_name")
    year = request.args.get("year")
    trim = request.args.get("trim")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT t3.color_name
        FROM model_year_trim_exterior t1
        JOIN color_group t2 ON t1.color_group = t2.group_id
        JOIN colors t3 ON t2.color_id = t3.color_id
        WHERE model_name=? AND "year"=? AND trim_name=?
        ORDER BY sort_order;
    """, (model_name, year, trim))

    exteriors = [r["color_name"] for r in cur.fetchall()]
    
    return jsonify(exteriors)



@vehicle_bp.route("/vehicle/<int:vehicle_id>/edit", methods=['GET'])
def edit_vehicle(vehicle_id):
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM vehicle WHERE vehicle_id = ?", (vehicle_id,)
    )
    vehicle = cur.fetchone()
    

    if not vehicle:
        abort(404)

    return render_template("form_vehicle.html", mode="edit", vehicle = vehicle)

@vehicle_bp.route("/update_vehicle/<int:vehicle_id>", methods=['POST'])
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
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            UPDATE vehicle
            SET vin = ?, make = ?, model = ?, model_year = ?, trim = ?,
                    exterior = ?, interior = ?, plate_number = ?, mileage = ?,
                    software = ?
            WHERE vehicle_id = ?
            
        """, (vin, make or None, model or None, year or None, trim or None, exterior or None, interior or None, plate_number or None, mileage or None, software or None, vehicle_id))
        conn.commit()
        
    except sqlite3.IntegrityError:
        return jsonify(message="VIN already exists", errors={"vin": "VIN is already registered."}), 422
    
    return jsonify(next_url=url_for("vehicle.admin_vehicle_list")), 200

## del vehicle
@vehicle_bp.route("/delete_vehicle", methods=['POST'])
def admin_delete_vehicle():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
    data = request.get_json()
    vehicle_id = data.get("vehicle_id")

    if not vehicle_id:
        return jsonify(success=False, message = "Invalid request"), 400
    
    try:
        conn = get_conn()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM vehicle WHERE vehicle_id = ?", (vehicle_id,))

        conn.commit()
        
        return jsonify(success = True, message="Vehicle deleted successfully")
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500
