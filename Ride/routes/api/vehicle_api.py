from flask import Blueprint, request, jsonify
from db import get_conn

api_bp = Blueprint(
    "vehicle_api",
    __name__,
    url_prefix="/api/vehicles"
)

@api_bp.route("/trims", methods=["GET"])
def get_trims():
    model_name = request.args.get("model_name")
    year = request.args.get("year")

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT trim_name
        FROM model_year_trim_exterior
        WHERE model_name=? AND "year"=?
        ORDER BY sort_order;
    """, (model_name, year))
    trims = [r["trim_name"] for r in cur.fetchall()]
    
    return jsonify({"trims": trims})


@api_bp.route("/exteriors", methods=["GET"])
def get_exteriors():
    model_name = request.args.get("model_name")
    year = request.args.get("year")
    trim = request.args.get("trim")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT t3.color_name
        FROM model_year_trim_exterior t1
        JOIN color_group t2 ON t1.color_group = t2.group_id
        JOIN colors t3 ON t2.color_id = t3.color_id
        WHERE model_name=? AND "year"=? AND trim_name=?
        ORDER BY sort_order;
    """, (model_name, year, trim))

    exteriors = [r["color_name"] for r in cur.fetchall()]
    
    return jsonify({"exteriors":exteriors})


## del vehicle
@api_bp.route("/<int:vehicle_id>", methods=['DELETE'])
def admin_delete_vehicle():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    data = request.get_json()
    vehicle_id = data.get("vehicle_id")

    if not vehicle_id:
        return jsonify(success=False, message = "Invalid request"), 400
    
    try:
        conn = get_conn()
        cur = conn.cursor()
        
        cur.execute("DELETE FROM vehicle WHERE vehicle_id = ?", (vehicle_id,))

        conn.commit()
        
        return jsonify(success = True, message="Vehicle deleted successfully")
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

