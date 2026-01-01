from flask import Blueprint, request, jsonify, session, redirect, url_for
from db import get_conn
import sqlite3
from utils.time_utils import get_pacific_time

parking_lot_api_bp = Blueprint(
    "parking_lot_api",
    __name__,
    url_prefix="/api/parking-lots"
)

@parking_lot_api_bp.route('', methods = ['POST'])
def admin_create_parking_lot():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    print('here')
    errors = {}
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    address_line1 = (data.get("address_line1") or "").strip()
    city = (data.get("city") or "").strip()
    state = (data.get("state") or "").strip()
    zip_code = (data.get("zip_code") or "").strip() or None
    status = data.get("status") or "active"

    

    if not name:
        errors["name"] = "Parking lot name is required."

    if not address_line1:
        errors["address_line1"] = "Street address is required."

    if not city:
        errors["city"] = "City is required."

    if not state:
        errors["state"] = "State is required."

    if status not in ("active", "inactive"):
        errors["status"] = "Status must be active or inactive."

    if errors:
        return jsonify(success=False, errors=errors), 400
    
    try:
        conn = get_conn()
        cur = conn.cursor()
        
        ## insert vehicle data
        cur.execute(
            """
            INSERT INTO parking_lot (
                name,
                address_line1,
                city,
                state,
                zip_code,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                address_line1,
                city,
                state,
                zip_code,
                status
            )
        )

        conn.commit()
        
    except sqlite3.IntegrityError:
        
        return jsonify(success=False, message="Parking lot with this address already exists.",
                       errors={
                        "address_line1": "Parking lot with this address already exists."
                        }
                       ), 409
    
    
    return jsonify(success=True, message="Parking lot created successfully."), 201

## get list
@parking_lot_api_bp.route("", methods=["GET"])
def list_parking_lots():
    print('call API for parking lot list')
    if not session.get("admin_logged_in"):
        return jsonify(success=False), 401

    conn = get_conn()
    rows = conn.execute("""
        SELECT
            parking_lot_id,
            name,
            address_line1,
            city,
            state,
            zip_code,
            status
        FROM parking_lot
        ORDER BY name
    """).fetchall()

    data = [
        {
            "id": r["parking_lot_id"],
            "name": r["name"],
            "address_line1": r["address_line1"],
            "city": r["city"],
            "state": r["state"],
            "zip_code": r["zip_code"],
            "status": r["status"]
        }
        for r in rows
    ]

    return jsonify(data)