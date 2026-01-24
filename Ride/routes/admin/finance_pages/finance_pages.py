from flask import Blueprint, render_template, request, redirect, url_for, session, abort
from db import get_conn

finance_pages_bp = Blueprint(
    "finance_pages",
    __name__,
    url_prefix="/admin/finance"
)
