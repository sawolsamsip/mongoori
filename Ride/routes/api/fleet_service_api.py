from flask import Blueprint, jsonify, session
from db import get_conn

fleet_service_api_bp = Blueprint(
    "fleet_service_api",
    __name__,
    url_prefix="/api/fleet-services"
)


@fleet_service_api_bp.route("", methods=["GET"])
def list_fleet_services():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            fleet_service_id,
            name
        FROM fleet_service
        ORDER BY name ASC
    """)

    rows = cur.fetchall()

    fleet_services = [
        {
            "fleet_service_id": row["fleet_service_id"],
            "name": row["name"]
        }
        for row in rows
    ]

    return jsonify({
        "fleet_services": fleet_services
    })