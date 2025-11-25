from datetime import datetime
from utils.time_utils import get_pacific_today
from db import get_conn

## warranty status
def get_warranty_status(expire_date, expire_miles, current_miles):
    today = get_pacific_today()

    if expire_date:
        try:
            expire_date = datetime.strptime(expire_date, "%Y-%m-%d").date()
        except ValueError:
            expire_date = None

    if expire_date and expire_date < today:
        return "Expired"
    if expire_miles and current_miles and int(current_miles) >= int(expire_miles):
        return "Expired"
    
    return "Active"

## warranty status for subscription
def get_warranty_status_subscription(end_date):
    today = get_pacific_today()

    if end_date:
        try:
            expire_date = datetime.strptime(expire_date, "%Y-%m-%d").date()
        except ValueError:
            expire_date = None

    if end_date and end_date < today:
        return "Expired"

    return "Active"

def get_purchase_warranty_types():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT warranty_type_id, type_name, display_name
        FROM warranty_type
        WHERE category = 'purchase' AND is_active = 1
        ORDER BY sort_order
    """)

    rows = cur.fetchall()
    return rows


## load warranty types
def get_subscription_warranty_types():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT warranty_type_id, type_name, display_name
        FROM warranty_type
        WHERE category = 'subscription' AND is_active = 1
        ORDER BY sort_order
    """)

    rows = cur.fetchall()
    return rows