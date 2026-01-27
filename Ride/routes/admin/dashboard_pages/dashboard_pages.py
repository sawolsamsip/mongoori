from flask import Blueprint, render_template, request, redirect, url_for, session, abort
from db import get_conn

dashboard_pages_bp = Blueprint(
    "dashboard_pages",
    __name__,
    url_prefix="/admin/dashboard"
)

@dashboard_pages_bp.route('/', methods=['GET', 'POST'])
def admin_dashboard():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    return render_template("dashboard.html")