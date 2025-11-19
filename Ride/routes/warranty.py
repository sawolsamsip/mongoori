from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from db import get_conn
from utils.warranty_utils import get_warranty_status, get_warranty_status_subscritpion, get_subscription_warranty_types, get_purchase_warranty_types

warranty_bp = Blueprint("warranty", __name__)


## warranty - purchase
@warranty_bp.route("/warranty_info_purchase", methods=["GET"])
def admin_warranty_list():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
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
@warranty_bp.route("/warranty_info_subscription", methods=["GET"])
def admin_warranty_sub_list():
    if not session.get("admin_logged_in"):
        return redirect(url_for("admin_login"))
    
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
            ws.end_date
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
        row["status"] = get_warranty_status_subscritpion(
            row.get("end_date")
        )
        warranties.append(row)
    
    return render_template("warranty_info_subscription.html", warranties=warranties, purchase_types = get_subscription_warranty_types())

##


@warranty_bp.route("/update_warranty", methods = ["POST"])
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
        conn = get_conn()
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