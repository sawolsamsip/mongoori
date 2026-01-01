from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from db import get_conn

parking_lot_pages_bp = Blueprint(
    "parking_lot_pages",
    __name__,
    url_prefix="/admin/parking-lots"
)


@parking_lot_pages_bp.route("/new")
def parking_lot_create_page():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    return render_template("parking_lot_form.html")

@parking_lot_pages_bp.route("")
def parking_lot_list_page():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))

    return render_template("parking_lot_info.html")