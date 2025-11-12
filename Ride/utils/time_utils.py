from datetime import datetime
from zoneinfo import ZoneInfo

## String type return
def get_pacific_time():
    now = datetime.now(ZoneInfo("America/Los_Angeles"))
    return now.strftime("%Y-%m-%d %H:%M:%S")

## Date type return
def get_pacific_today():
    return datetime.now(ZoneInfo("America/Los_Angeles")).date()
