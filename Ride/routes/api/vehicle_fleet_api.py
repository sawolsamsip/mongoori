from flask import Blueprint, jsonify, session
from db import get_conn
from utils.time_utils import get_pacific_today

vehicle_fleet_api_bp = Blueprint(
    "vehicle_fleet_api",
    __name__,
    url_prefix="/api/vehicle-fleets/"
)

## fleet service unregister
@vehicle_fleet_api_bp.route("/<int:vehicle_fleet_id>", methods=["PATCH"])
def unregister_vehicle_fleet(vehicle_fleet_id):
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT registered_to
        FROM vehicle_fleet
        WHERE vehicle_fleet_id = ?
    """, (vehicle_fleet_id,))
    row = cur.fetchone()

    if not row:
        return jsonify(success=False, message="Fleet record not found"), 404

    if row["registered_to"] is not None:
        return jsonify(success=False, message="Fleet already unregistered"), 400

    today = get_pacific_today()

    cur.execute("""
        UPDATE vehicle_fleet
        SET registered_to = ?
        WHERE vehicle_fleet_id = ?
    """, (today, vehicle_fleet_id))

    conn.commit()

    return jsonify(success=True, message="Fleet unregistered successfully"), 200