from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from db import get_conn
from utils.warranty_utils import get_warranty_status, get_warranty_status_subscription, get_subscription_warranty_types, get_purchase_warranty_types

warranty_bp = Blueprint("warranty", __name__)


## warranty - purchase
@warranty_bp.route("/warranty/purchase", methods=["GET"])
def admin_warranty_list():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            v.vehicle_id,
            v.vin,
            v.model,
            v.model_year,
            v.mileage,
            v.plate_number,
            vw.vehicle_warranty_id,
            wt.display_name AS warranty_type,
            wt.category,
            wp.expire_date,
            wp.expire_miles
        FROM vehicle v
        JOIN vehicle_warranty vw
            ON v.vehicle_id = vw.vehicle_id
        JOIN warranty_type wt
            ON vw.warranty_type_id = wt.warranty_type_id
        LEFT JOIN warranty_purchase wp
            ON vw.vehicle_warranty_id = wp.vehicle_warranty_id
        WHERE wt.category = 'purchase'
        ORDER BY v.vin ASC, wt.sort_order ASC
    """)

    rows = cur.fetchall()

    warranties = []

    for row in rows:
        row["status"] = get_warranty_status(
            row.get("expire_date"), row.get("expire_miles"), row.get("mileage")
        )
        warranties.append(row)
    
    return render_template("warranty_info_purchase.html", warranties=warranties, purchase_types = get_purchase_warranty_types())

## warranty - subscription
@warranty_bp.route("/warranty/subscription", methods=["GET"])
def admin_warranty_sub_list():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT
            v.vehicle_id,
            v.vin,
            v.model,
            v.model_year,
            v.plate_number,
            vw.vehicle_warranty_id,
            wt.display_name AS warranty_type,
            wt.category,
            ws.start_date,
            ws.end_date,
            ws.monthly_cost
        FROM vehicle v
        JOIN vehicle_warranty vw
            ON v.vehicle_id = vw.vehicle_id
        JOIN warranty_type wt
            ON vw.warranty_type_id = wt.warranty_type_id
        LEFT JOIN warranty_subscription ws
            ON vw.vehicle_warranty_id = ws.vehicle_warranty_id
        WHERE wt.category = 'subscription'
        ORDER BY v.vin ASC, wt.sort_order ASC
    """)

    rows = cur.fetchall()

    warranties = []

    for row in rows:
        row["status"] = get_warranty_status_subscription(
            row.get("end_date")
        )
        warranties.append(row)
    
    return render_template("warranty_info_subscription.html", warranties=warranties, purchase_types = get_subscription_warranty_types())

##

## update function for purchase
@warranty_bp.route("/update_warranty_purchase", methods = ["POST"])
def update_warranty_purchase():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized")
    
    data = request.get_json()
    vw_id = data.get("warranty_id")
    field = data.get("field")
    value = data.get("value")

    if not vw_id or not field:
        return jsonify(success=False, message="Invalid input"), 400
    
    ## update process
    allowed_fields = {"expire_date", "expire_miles"}
    if field not in allowed_fields:
        return jsonify(success=False, message = "Invalid field")
    
    try:
        conn = get_conn()
        cur = conn.cursor()

        if field == "expire_miles":
            value = int(value) if value else None
        
        ## update value
        cur.execute(f"""
            UPDATE warranty_purchase
            SET {field} = ?
            WHERE vehicle_warranty_id = ?
        """, (value, vw_id))
        
        conn.commit()
        
        ## update status
        cur.execute("""
            SELECT wp.expire_date, wp.expire_miles, v.mileage AS current_miles
            FROM warranty_purchase wp
            JOIN vehicle_warranty vw ON vw.vehicle_warranty_id = wp.vehicle_warranty_id
            JOIN vehicle v ON v.vehicle_id = vw.vehicle_id
            WHERE wp.vehicle_warranty_id = ?
        """, (vw_id,))
        
        row = cur.fetchone()

        new_status = get_warranty_status(
            row["expire_date"],
            row["expire_miles"],
            row["current_miles"]
        )
    
        return jsonify(success=True, new_status=new_status)
        
    except Exception as e:
        print("Update error: ", e)
        return jsonify(success = False, message=str(e)), 500
    
## add warranty - purchase
@warranty_bp.route('/add_warranty_purchase', methods=['POST'])
def add_warranty_purchase():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized")
    
    data = request.get_json()

    vehicle_id = data['vehicle_id']
    warranty_type_id = data['warranty_type']
    expire_date = data['expire_date']
    expire_miles = data['expire_miles']

    if not vehicle_id or not warranty_type_id:
        return jsonify({"success": False, "message": "Invalid data"}), 400
    
    try:
        conn = get_conn()
        cur = conn.cursor()

        ## insert vehicle_warranty : common information
        cur.execute("""
            INSERT INTO vehicle_warranty (vehicle_id, warranty_type_id, category)
            VALUES (?, ?, 'purchase')
        """, (vehicle_id, warranty_type_id))

        vw_id = cur.lastrowid

        ## insert purchase warranty information
        cur.execute("""
            INSERT INTO warranty_purchase (vehicle_warranty_id, expire_date, expire_miles)
            VALUES (?, ?, ?)
        """, (vw_id, expire_date, expire_miles))

        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    
## add warranty - subscription
@warranty_bp.route('/add_warranty_subscription', methods=['POST'])
def add_warranty_subscription():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized")
    
    data = request.get_json()

    vehicle_id = data.get('vehicle_id')
    warranty_type_id = data.get('warranty_type')
    start_date = data.get('start_date')
    monthly_cost = data.get('monthly_cost')

    if not vehicle_id or not warranty_type_id:
        return jsonify({"success": False, "message": "Invalid data"}), 400
    
    try:
        conn = get_conn()
        cur = conn.cursor()

        ## insert vehicle_warranty : common information
        cur.execute("""
            INSERT INTO vehicle_warranty (vehicle_id, warranty_type_id, category)
            VALUES (?, ?, 'subscription')
        """, (vehicle_id, warranty_type_id))

        vw_id = cur.lastrowid

        ## insert purchase warranty information
        cur.execute("""
            INSERT INTO warranty_subscription (vehicle_warranty_id, start_date, monthly_cost)
            VALUES (?, ?, ?)
        """, (vw_id, start_date, monthly_cost))

        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
        

## delete warranty - purchase, subscription
@warranty_bp.route('/delete_warranty', methods=['POST'])
def delete_warranty():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized")

    data = request.get_json()
    vehicle_warranty_id = data.get("vehicle_warranty_id")

    if not vehicle_warranty_id:
        return jsonify(success=False, message="Invalid data"), 400

    try:
        conn = get_conn()
        cur = conn.cursor()

        cur.execute("""
            DELETE FROM vehicle_warranty
            WHERE vehicle_warranty_id = ?
        """, (vehicle_warranty_id,))

        conn.commit()
        return jsonify(success=True)
    except Exception as e:
        conn.rollback()
        return jsonify(success=False, message=str(e)), 500
