from flask import Blueprint, request, jsonify, session
from db import get_conn
from utils.time_utils import get_pacific_time

finance_api_bp = Blueprint(
    "finance_api",
    __name__,
    url_prefix="/api/finance"
)

## add cost for vehicle
@finance_api_bp.route("/vehicles/<int:vehicle_id>/cost", methods=["POST"])
def add_vehicle_cost(vehicle_id):
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    data = request.get_json() or {}

    date = data.get("date")
    category_id = data.get("category_id")
    amount = data.get("amount")
    note = data.get("note")

    if not date or not category_id or amount is None:
        return jsonify(
            success=False,
            message="date, category_id, amount are required"
        ), 400

    try:
        amount = float(amount)
    except:
        return jsonify(success=False, message="Invalid amount"), 400

    try:
        year, month, _ = date.split("-")
    except:
        return jsonify(success=False, message="Invalid date format"), 400

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO finance_transaction (
            scope,
            vehicle_id,
            category_id,
            amount,
            transaction_date,
            period_year,
            period_month,
            description,
            source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "vehicle",
        vehicle_id,
        category_id,
        amount,
        date,
        int(year),
        int(month),
        note,
        "manual"
    ))

    conn.commit()

    return jsonify(success=True, message="Cost recorded"), 200


## Add revenue for vehicle

@finance_api_bp.route("/vehicles/<int:vehicle_id>/revenue", methods=["POST"])
def add_vehicle_revenue(vehicle_id):
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    data = request.get_json() or {}

    date = data.get("date")
    category_id = data.get("category_id")
    amount = data.get("amount")
    note = data.get("note")

    if not date or not category_id or amount is None:
        return jsonify(
            success=False,
            message="date, category_id, amount are required"
        ), 400

    try:
        amount = float(amount)
    except:
        return jsonify(success=False, message="Invalid amount"), 400

    try:
        year, month, _ = date.split("-")
    except:
        return jsonify(success=False, message="Invalid date format"), 400

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO finance_transaction (
            scope,
            vehicle_id,
            category_id,
            amount,
            transaction_date,
            period_year,
            period_month,
            description,
            source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "vehicle",
        vehicle_id,
        category_id,
        amount,
        date,
        int(year),
        int(month),
        note,
        "manual"
    ))

    conn.commit()

    return jsonify(success=True, message="Revenue recorded"), 200


## 
@finance_api_bp.route("/categories", methods=["GET"])
def get_finance_categories():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    scope = request.args.get("scope")
    type_ = request.args.get("type")

    if not scope or not type_:
        return jsonify(
            success=False,
            message="scope and type are required"
        ), 400

    if scope not in ("vehicle", "fleet", "global"):
        return jsonify(success=False, message="Invalid scope"), 400

    if type_ not in ("cost", "revenue"):
        return jsonify(success=False, message="Invalid type"), 400

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            category_id,
            name,
            type,
            scope,
            description
        FROM finance_category
        WHERE scope = ?
          AND type = ?
        ORDER BY name ASC
    """, (scope, type_))

    rows = cur.fetchall()

    categories = []
    for r in rows:
        categories.append({
            "category_id": r["category_id"],
            "name": r["name"],
            "type": r["type"],
            "scope": r["scope"],
            "description": r["description"]
        })

    return jsonify(success=True, categories=categories), 200


## Finance time series (last N months)
@finance_api_bp.route("/timeseries", methods=["GET"])
def get_finance_timeseries():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    window = request.args.get("window", 12)
    try:
        window = int(window)
    except:
        window = 12

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            period_year,
            period_month,
            SUM(CASE WHEN fc.type='revenue' THEN ft.amount ELSE 0 END) AS revenue,
            SUM(CASE WHEN fc.type='cost' THEN ft.amount ELSE 0 END) AS expense
        FROM finance_transaction ft
        JOIN finance_category fc
          ON ft.category_id = fc.category_id
        WHERE date(ft.transaction_date) >= date('now', ?, 'start of month')
          AND date(ft.transaction_date) <= date('now', 'start of month', '+1 month', '-1 day')
        GROUP BY period_year, period_month
        ORDER BY period_year, period_month
    """, (f"-{window-1} months",))

    rows = cur.fetchall()

    labels = []
    revenue = []
    expense = []
    net = []

    for r in rows:
        y = r["period_year"]
        m = str(r["period_month"]).zfill(2)
        rev = r["revenue"] or 0
        exp = r["expense"] or 0

        labels.append(f"{y}-{m}")
        revenue.append(rev)
        expense.append(exp)
        net.append(rev - exp)

    return jsonify(
        success=True,
        resource="finance.timeseries",
        window=window,
        data={
            "labels": labels,
            "revenue": revenue,
            "expense": expense,
            "net": net
        }
    ), 200