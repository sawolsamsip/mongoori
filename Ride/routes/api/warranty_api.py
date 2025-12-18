from flask import Blueprint, request, jsonify, session, redirect, url_for
from db import get_conn
from utils.warranty_utils import get_warranty_status, get_warranty_status_subscription

warranty_api_bp = Blueprint(
    "warranty_api",
    __name__,
    url_prefix="/api/warranties"
)

## update function for purchase
@warranty_api_bp.route("/purchase/<int:v_w_id>", methods = ["PATCH"])
def update_warranty_purchase(v_w_id):
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized")

    data = request.get_json()
    
    ## update process
    allowed_fields = {"expire_date", "expire_miles"}
    update_fields = {}

    for key in allowed_fields:
        if key in data:
            val = data[key]
            
            if key == "expire_miles" and val is not None:
                val = int(val)
            update_fields[key] = val
    
    if not update_fields:
        return jsonify(success=False, message="No valid fields to update"), 400

         
    try:
        conn = get_conn()
        cur = conn.cursor()

        set_clause = ", ".join(f"{k} = ?" for k in update_fields.keys()) ## which fields should be updated?
        values = list(update_fields.values()) + [v_w_id] ## new values for each field
        ## update value
        cur.execute(f"""
            UPDATE warranty_purchase
            SET {set_clause}
            WHERE vehicle_warranty_id = ?
        """, values)
        
        conn.commit()
        
        ## update status
        cur.execute("""
            SELECT wp.expire_date, wp.expire_miles, v.mileage AS current_miles
            FROM warranty_purchase wp
            JOIN vehicle_warranty vw ON vw.vehicle_warranty_id = wp.vehicle_warranty_id
            JOIN vehicle v ON v.vehicle_id = vw.vehicle_id
            WHERE wp.vehicle_warranty_id = ?
        """, (v_w_id,))
        
        row = cur.fetchone()
        
        new_status = get_warranty_status(
            row["expire_date"],
            row["expire_miles"],
            row["current_miles"]
        )
    
        return jsonify(success=True, message="Purchase warranty updated", new_status=new_status)
        
    except Exception as e:
        print("Update error: ", e)
        return jsonify(success = False, message=str(e)), 500


## update function for subscription
@warranty_api_bp.route("/subscription/<int:v_w_id>", methods = ["PATCH"])
def update_warranty_subscription(v_w_id):
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized")

    data = request.get_json()
    
    ## update process
    allowed_fields = {"start_date", "end_date", "monthly_cost"}
    update_fields = {}

    for key in allowed_fields:
        if key in data:
            val = data[key]
            
            if key == "monthly_cost" and val is not None:
                val = float(val)

            update_fields[key] = val
    
    if not update_fields:
        return jsonify(success=False, message="No valid fields to update"), 400

         
    try:
        conn = get_conn()
        cur = conn.cursor()

        set_clause = ", ".join(f"{k} = ?" for k in update_fields.keys()) ## which fields should be updated?
        values = list(update_fields.values()) + [v_w_id] ## new values for each field
        ## update value
        cur.execute(f"""
            UPDATE warranty_subscription
            SET {set_clause}
            WHERE vehicle_warranty_id = ?
        """, values)
        
        conn.commit()
        
        ## update status
        cur.execute("""
            SELECT
                ws.start_date,
                ws.end_date
            FROM warranty_subscription ws
            WHERE ws.vehicle_warranty_id = ?
        """, (v_w_id,))
        
        row = cur.fetchone()
        
        new_status = get_warranty_status_subscription(
            row["start_date"],
            row["end_date"]
        )
    
        return jsonify(success=True, message="Subscription warranty updated", new_status=new_status)
        
    except Exception as e:
        print("Update error: ", e)
        return jsonify(success = False, message=str(e)), 500

## add warranty - purchase
@warranty_api_bp.route('/purchase', methods=['POST'])
def create_purchase_warranty():
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
        return jsonify({"success": True,
                        "message": "Purchase warranty added"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    
## add warranty - subscription
@warranty_api_bp.route('/subscription', methods=['POST'])
def create_subscription_warranty():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized")
    
    data = request.get_json()

    vehicle_id = data['vehicle_id']
    warranty_type_id = data['warranty_type']
    start_date = data['start_date']
    monthly_cost = data['monthly_cost']

    print(f'vehicle id: {vehicle_id}')

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
        return jsonify({"success": True
                        , "message": "Subscription warranty added"})
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
        

## delete warranty - purchase, subscription
@warranty_api_bp.route('/<int:v_w_id>', methods=['DELETE'])
def delete_warranty(v_w_id):
    print("DELETE WARRANTY API HIT", v_w_id)
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized")

    vehicle_warranty_id = v_w_id

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
        return jsonify(success=True, message = "Warranty deleted")
    except Exception as e:
        conn.rollback()
        return jsonify(success=False, message=str(e)), 500