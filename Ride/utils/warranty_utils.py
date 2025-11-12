from datetime import datetime
from utils.time_utils import get_pacific_today

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