from flask import Blueprint, render_template, request, redirect, url_for, session, abort
from db import get_conn
from utils.warranty_utils import get_purchase_warranty_types, get_subscription_warranty_types

vehicle_pages_bp = Blueprint(
    "vehicle_pages",
    __name__,
    url_prefix = "/admin/vehicles"
)

## vehicle listing
@vehicle_pages_bp.route("",methods=["GET"])
def vehicle_list_page():
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
    
    return render_template("vehicle_info.html", vehicles=vehicles, purchase_types=purchase_types, subscription_types=subscription_types)

## vehicle add page loading 'purchase' warranty options for dropdown list
@vehicle_pages_bp.route("/new", methods = ['GET'])
def vehicle_create_page():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    
    purchase_types = get_purchase_warranty_types()

    return render_template("form_vehicle.html", mode='add', vehicle={}, purchase_types=purchase_types)

@vehicle_pages_bp.route("/<int:vehicle_id>/edit", methods=['GET'])
def vehicle_edit_page(vehicle_id):
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM vehicle WHERE vehicle_id = ?", (vehicle_id,)
    )
    vehicle = cur.fetchone()
    

    if not vehicle:
        abort(404)

    return render_template("form_vehicle.html", mode="edit", vehicle = vehicle)
