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