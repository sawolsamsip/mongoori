from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from dotenv import load_dotenv
import os
from db import init_db, close_conn
from routes.auth import auth_bp

from routes.admin.vehicle_pages.management import vehicle_pages_bp
from routes.admin.vehicle_pages.operation import vehicle_operation_pages_bp

from routes.api.vehicle_api.vehicle_api import vehicle_api_bp

from routes.admin.warranty_pages import warranty_pages_bp
from routes.api.warranty_api import warranty_api_bp

from routes.admin.parking_lot_pages import parking_lot_pages_bp
from routes.api.parking_lot_api import parking_lot_api_bp

from routes.api.fleet_service_api import fleet_service_api_bp

from routes.api.vehicle_fleet_api import vehicle_fleet_api_bp

from routes.admin.finance_pages.finance_pages import finance_pages_bp

from routes.api.finance.finance_api import finance_api_bp

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

app.teardown_appcontext(close_conn)

app.register_blueprint(auth_bp, url_prefix="/")
app.register_blueprint(vehicle_pages_bp)
app.register_blueprint(vehicle_operation_pages_bp)

app.register_blueprint(vehicle_api_bp)
app.register_blueprint(warranty_pages_bp)
app.register_blueprint(warranty_api_bp)

app.register_blueprint(parking_lot_pages_bp)
app.register_blueprint(parking_lot_api_bp)

app.register_blueprint(fleet_service_api_bp)

app.register_blueprint(vehicle_fleet_api_bp)

app.register_blueprint(finance_pages_bp)
app.register_blueprint(finance_api_bp)


@app.route('/admin/dashboard', methods=['GET', 'POST'])
def admin_dashboard():
    if not session.get("admin_logged_in"):
        return redirect(url_for("auth.admin_login"))
    
    return render_template("base.html")

@app.route('/admin/debug_session')
def debug_session():
    return jsonify(dict(session))
    

if __name__ == "__main__":
    init_db()
    app.run(debug=True)