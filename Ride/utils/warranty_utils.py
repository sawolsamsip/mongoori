from datetime import datetime
from utils.time_utils import get_pacific_today
from db import get_conn
import logging

logger = logging.getLogger(__name__)

## warranty status
def get_warranty_status(expire_date, expire_miles, current_miles):
    today = get_pacific_today()

    parsed_exp_date = None
    if expire_date:
        try:
            parsed_exp_date = datetime.strptime(expire_date, "%Y-%m-%d").date()
        except ValueError:
            logger.warning(f"[WARRANTY] Invalid expire_date: {expire_date}")

    parsed_exp_miles = None
    if expire_miles is not None:
        try:
            parsed_exp_miles = int(expire_miles)
        except ValueError:
            logger.warning(f"[WARRANTY] Invalid expire_miles: {expire_miles}")

    parsed_current_miles = None
    if current_miles is not None:
        try:
            parsed_current_miles = int(current_miles)
        except ValueError:
            logger.warning(f"[WARRANTY] Invalid current_miles: {current_miles}")

    ## status
    if parsed_exp_date and parsed_exp_date < today:
        return "Expired"
    
    if parsed_exp_miles is not None and parsed_current_miles is not None:
        if parsed_current_miles >= parsed_exp_miles:
            return "Expired"

    
    return "Active"

## warranty status for subscription
def get_warranty_status_subscription(start_date, end_date):
    today = get_pacific_today()

    ## start date
    parsed_start = None
    if start_date:
        try:
            parsed_start = datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            logger.warning(f"[WARRANTY] Invalid start_date format: {start_date}")

    ## end date
    parsed_end = None
    if end_date:
        try:
            parsed_end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            logger.warning(f"[WARRANTY] Invalid end_date format: {end_date}")
            parsed_end = None
    
    ## status
    if parsed_start and parsed_start > today:
        return "Not Started"

    if parsed_end and parsed_end < today:
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