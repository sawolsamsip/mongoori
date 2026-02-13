from flask import Blueprint, request, jsonify, session
from db import get_conn
from utils.time_utils import get_pacific_time

finance_api_bp = Blueprint(
    "finance_api",
    __name__,
    url_prefix="/api/finance"
)


## save cost/revenue from management page - one-time
@finance_api_bp.route(
    "/management/vehicles/<int:vehicle_id>/transactions",
    methods=["POST"]
)
def create_management_transaction(vehicle_id):
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    data = request.get_json() or {}

    category_id = data.get("category_id")
    amount = data.get("amount")
    transaction_date = data.get("transaction_date")
    note = data.get("note")

    if not category_id or not amount or not transaction_date:
        return jsonify(success=False, message="Missing required fields"), 400

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO finance_management_transaction (
            vehicle_id,
            category_id,
            amount,
            transaction_date,
            note
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        vehicle_id,
        category_id,
        amount,
        transaction_date,
        note
    ))

    conn.commit()

    return jsonify(success=True), 201


## save cost/revenue from management page - monthly, installment

@finance_api_bp.route(
    "/management/vehicles/<int:vehicle_id>/contracts",
    methods=["POST"]
)
def create_management_contract(vehicle_id):
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    data = request.get_json() or {}

    category_id = data.get("category_id")
    contract_type = data.get("payment_type")

    start_date = data.get("start_date")
    end_date = data.get("end_date")
    monthly_amount = data.get("monthly_amount")
    total_amount = data.get("total_amount")
    months = data.get("months")
    note = data.get("note")

    if contract_type not in ("monthly", "installment"):
        return jsonify(success=False, message="Invalid contract type"), 400

    if not category_id or not start_date or not monthly_amount:
        return jsonify(success=False, message="Missing required fields"), 400

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO finance_management_contract (
            vehicle_id,
            category_id,
            contract_type,
            start_date,
            end_date,
            monthly_amount,
            total_amount,
            months,
            note
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        vehicle_id,
        category_id,
        contract_type,
        start_date,
        end_date,
        monthly_amount,
        total_amount,
        months,
        note
    ))

    conn.commit()

    return jsonify(success=True), 201


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

## Manage Finance- operation: load category to fill modal
@finance_api_bp.route("/operation/categories", methods=["GET"])
def get_operation_categories():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    type_ = request.args.get("type")
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
        FROM finance_operation_category
        WHERE type = ?
        ORDER BY category_id ASC
    """, (type_,))

    categories = [dict(r) for r in cur.fetchall()]
    return jsonify(success=True, categories=categories), 200

## Manage Finance- operation: load fleet category to fill modal
@finance_api_bp.route("/fleets", methods=["GET"])
def get_fleet_services():
    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT fleet_service_id, name
        FROM fleet_service
        ORDER BY fleet_service_id ASC
    """)

    fleets = [dict(r) for r in cur.fetchall()]

    return jsonify(success=True, fleets=fleets), 200

## Manage Finance- operation: save
@finance_api_bp.route("/timeseries", methods=["GET"])
def get_finance_timeseries():

    if not session.get("admin_logged_in"):
        return jsonify(success=False, message="Unauthorized"), 401

    window = request.args.get("window", 12)
    mode = request.args.get("mode", "operation")

    try:
        window = int(window)
    except:
        window = 12

    conn = get_conn()
    cur = conn.cursor()

    date_filter = """
        date >= date('now', ?, 'start of month')
        AND date <= date('now', 'start of month', '+1 month', '-1 day')
    """

    # FULL MODE: operation + management
    if mode == "full":
        query = f"""
            SELECT
                strftime('%Y', tx_date) AS year,
                strftime('%m', tx_date) AS month,
                SUM(revenue) AS revenue,
                SUM(expense) AS expense
            FROM (
                -- Operation
                SELECT
                    ot.transaction_date AS tx_date,
                    CASE WHEN oc.type='revenue' THEN ot.amount ELSE 0 END AS revenue,
                    CASE WHEN oc.type='cost' THEN ot.amount ELSE 0 END AS expense
                FROM finance_operation_transaction ot
                JOIN finance_operation_category oc
                    ON ot.category_id = oc.category_id

                UNION ALL

                -- Management
                SELECT
                    mt.transaction_date AS tx_date,
                    CASE WHEN mc.type='revenue' THEN mt.amount ELSE 0 END AS revenue,
                    CASE WHEN mc.type='cost' THEN mt.amount ELSE 0 END AS expense
                FROM finance_management_transaction mt
                JOIN finance_management_category mc
                    ON mt.category_id = mc.category_id
            ) AS combined
            WHERE tx_date >= date('now', ?, 'start of month')
            AND tx_date <= date('now', 'start of month', '+1 month', '-1 day')
            GROUP BY year, month
            ORDER BY year, month
        """
    else:
        query = f"""
            SELECT
                strftime('%Y', ot.transaction_date) AS year,
                strftime('%m', ot.transaction_date) AS month,
                SUM(CASE WHEN oc.type='revenue' THEN ot.amount ELSE 0 END) AS revenue,
                SUM(CASE WHEN oc.type='cost' THEN ot.amount ELSE 0 END) AS expense
            FROM finance_operation_transaction ot
            JOIN finance_operation_category oc
                ON ot.category_id = oc.category_id
            WHERE ot.transaction_date >= date('now', ?, 'start of month')
            AND ot.transaction_date <= date('now', 'start of month', '+1 month', '-1 day')
            GROUP BY year, month
            ORDER BY year, month
        """

    cur.execute(query, (f"-{window-1} months",))
    rows = cur.fetchall()

    labels, revenue, expense, net = [], [], [], []

    for r in rows:
        y = r["year"]
        m = r["month"]
        rev = r["revenue"] or 0
        exp = r["expense"] or 0

        labels.append(f"{y}-{m}")
        revenue.append(rev)
        expense.append(exp)
        net.append(rev - exp)

    return jsonify(
        success=True,
        mode=mode,
        window=window,
        data={
            "labels": labels,
            "revenue": revenue,
            "expense": expense,
            "net": net
        }
    ), 200