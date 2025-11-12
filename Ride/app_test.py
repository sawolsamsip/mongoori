import os, uuid
from werkzeug.utils import secure_filename
from datetime import datetime

from flask import Flask, render_template, request, jsonify, send_from_directory, abort
from db import init_db, insert_company, list_companies, close_conn

app = Flask(__name__)
app.secret_key = "dev"

## make folder to save uploaded image files
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.route("/", methods = ["GET"])
def form_page():
    return render_template('test.html')

@app.route("/api/upload", methods=["POST"])
def api_upload():
    cname = request.form.get("Cname", "").strip()
    oname = request.form.get("Oname", "").strip()
    image = request.files.get("Image")

    if not cname or not oname:
        return jsonify({"ok": False, "message": "Missing required fields"})
    insert_company(cname, oname)

    if image and image.filename:
        ext = image.filename.rsplit(".", 1)[-1].lower() if "." in image.filename else "bin"
        stored_name = f"{uuid.uuid4().hex}.{ext}"
        safe_name = secure_filename(stored_name)
        image.save(os.path.join(UPLOAD_DIR, safe_name))

    return jsonify({"ok": True, "message": "Submission successful"})

# Route: Serve uploaded image
@app.route("/file/<path:filename>")
def serve_file(filename):
    safe = secure_filename(filename)
    if safe != filename:
        abort(400)
    return send_from_directory(UPLOAD_DIR, safe)

if __name__ == "__main__":
    init_db()
    app.run(debug=True)