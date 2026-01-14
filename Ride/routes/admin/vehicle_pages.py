from flask import Blueprint, render_template, request, redirect, url_for, session, abort
from db import get_conn
from utils.warranty_utils import get_purchase_warranty_types, get_subscription_warranty_types

vehicle_pages_bp = Blueprint(
    "vehicle_pages",
    __name__,
    url_prefix = "/admin/vehicles"
)

## vehicle listing
@vehicle_pages_bp.route("/",methods=["GET"])
def vehicle_list_page():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
                SELECT
                    v.vehicle_id,
                    v.vin,
                    v.plate_number,
                    v.model,
                    v.model_year,
                    pl.name AS operation_location_name,
                    GROUP_CONCAT(fs.name) AS fleet_names
                FROM vehicle v
                LEFT JOIN vehicle_operation_location vol
                    ON v.vehicle_id = vol.vehicle_id
                    AND vol.active_to IS NULL
                LEFT JOIN parking_lot pl
                    ON vol.parking_lot_id = pl.parking_lot_id
                LEFT JOIN vehicle_fleet vf
                    ON v.vehicle_id = vf.vehicle_id
                    AND vf.registered_to IS NULL
                LEFT JOIN fleet_service fs
                    ON vf.fleet_service_id = fs.fleet_service_id
                GROUP BY v.vehicle_id
                ORDER BY operation_location_name IS NULL, operation_location_name;
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

@vehicle_pages_bp.route("/<int:vehicle_id>", methods=['GET'])
def vehicle_detail_page(vehicle_id):
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

    return render_template("form_vehicle.html", mode="detail", vehicle = vehicle)
