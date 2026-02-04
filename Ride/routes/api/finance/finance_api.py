from flask import Blueprint, request, jsonify, session
from db import get_conn
from utils.time_utils import get_pacific_time

finance_api_bp = Blueprint(
    "finance_api",
    __name__,
    url_prefix="/api/finance"
)


## save cost/revenue from management page
@finance_api_bp.route(
    "/management/vehicles/<int:vehicle_id>/obligations",
    methods=["POST"]
)
def create_vehicle_obligation(vehicle_id):
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    data = request.get_json() or {}

    category_id = data.get("category_id")
    payment_type = data.get("payment_type")
    event_date = data.get("event_date")

    start_date = data.get("start_date")
    end_date = data.get("end_date")
    total_amount = data.get("total_amount")
    monthly_amount = data.get("monthly_amount")
    months = data.get("months")
    note = data.get("note")

    # validation
    if not category_id or not payment_type or not event_date:
        return jsonify(
            success=False,
            message="category_id, payment_type, event_date are required"
        ), 400

    if payment_type not in ("one_time", "monthly", "installment"):
        return jsonify(success=False, message="Invalid payment_type"), 400

    # validation for each payment type
    if payment_type == "one_time":
        if total_amount is None:
            return jsonify(success=False, message="total_amount is required"), 400

    if payment_type == "monthly":
        if monthly_amount is None or not start_date:
            return jsonify(
                success=False,
                message="monthly_amount and start_date are required"
            ), 400

    if payment_type == "installment":
        if total_amount is None or not months or not start_date:
            return jsonify(
                success=False,
                message="total_amount, months, start_date are required"
            ), 400

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO finance_vehicle_obligation (
            vehicle_id,
            category_id,
            payment_type,
            event_date,
            start_date,
            end_date,
            total_amount,
            monthly_amount,
            months,
            note
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        vehicle_id,
        category_id,
        payment_type,
        event_date,
        start_date,
        end_date,
        total_amount,
        monthly_amount,
        months,
        note
    ))

    conn.commit()

    return jsonify(success=True, message="Obligation created"), 201


## Manage Finance- mangement: load category to fill modal
@finance_api_bp.route("/management/categories", methods=["GET"])
def get_ownership_categories():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    type_ = request.args.get("type")

    if not type_:
        return jsonify(
            success=False,
            message="type is required"
        ), 400

    if type_ not in ("cost", "revenue"):
        return jsonify(
            success=False,
            message="Invalid type"
        ), 400

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            category_id,
            name,
            type,
            description
        FROM finance_management_category
        WHERE type = ?
        ORDER BY name ASC
    """, (type_,))

    rows = cur.fetchall()

    categories = [
        {
            "category_id": r["category_id"],
            "name": r["name"],
            "type": r["type"],
            "description": r["description"]
        }
        for r in rows
    ]

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