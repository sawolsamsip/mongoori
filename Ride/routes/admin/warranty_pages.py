from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from db import get_conn
from utils.warranty_utils import get_warranty_status, get_warranty_status_subscription, get_subscription_warranty_types, get_purchase_warranty_types

warranty_pages_bp = Blueprint(
    "warranty_pages",
    __name__,
    url_prefix = "/admin/warranties"
)

## warranty - purchase
@warranty_pages_bp.route("/purchase", methods=["GET"])
def purchase_warranty_list_page():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    vehicle_id = request.args.get("vehicle_id")

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
                AND (? IS NULL OR v.vehicle_id = ?)
        ORDER BY v.vin ASC, wt.sort_order ASC
    """, (vehicle_id, vehicle_id))

    rows = cur.fetchall()

    warranties = []

    for row in rows:
        row["status"] = get_warranty_status(
            row.get("expire_date"), row.get("expire_miles"), row.get("mileage")
        )
        warranties.append(row)
    
    return render_template("warranty_info_purchase.html", warranties=warranties, purchase_types = get_purchase_warranty_types(), active_tab="purchase")

## warranty - subscription
@warranty_pages_bp.route("/subscription", methods=["GET"])
def subscription_warranty_list_page():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    vehicle_id = request.args.get("vehicle_id")
    
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
                AND (? IS NULL OR v.vehicle_id = ?)
        ORDER BY v.vin ASC, wt.sort_order ASC
    """, (vehicle_id, vehicle_id))

    rows = cur.fetchall()

    warranties = []

    for row in rows:
        row["status"] = get_warranty_status_subscription(
            row.get("start_date"),
            row.get("end_date")
        )
        warranties.append(row)
    
    return render_template("warranty_info_subscription.html", warranties=warranties, subscription_types = get_subscription_warranty_types(), active_tab="subscription")

##