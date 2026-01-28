# Deployment Documentation (DEPLOYMENT.md)

## 1. Purpose

This document describes how to set up, configure, initialize, and run the Vehicle Management Web System in a new environment. It is intended for system operators and maintainers during project handover.

---

## 2. Environment Requirements

### 2.1 System Requirements

* OS: Linux / macOS / Windows
* Python: 3.9+
* SQLite3
* Git

### 2.2 Python Environment

Recommended:

```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows
```

---

## 3. Project Setup

### 3.1 Source Code Setup

```bash
git clone <repository_url>
cd <project_root>
```

### 3.2 Dependency Installation

```bash
pip install -r requirements.txt
```

---

## 4. Environment Configuration

### 4.1 Environment Variables

Create `.env` file in project root:

```env
FLASK_ENV=production
FLASK_APP=app.py
SECRET_KEY=<secure_random_string>
DB_PATH=./app.db
```

---

## 5. Database Initialization

### 5.1 Database File Setup

```bash
sqlite3 ./app.db < db/schema.sql
sqlite3 ./app.db < db/seed.sql

```

### 5.2 WAL Mode Verification

```sql
PRAGMA journal_mode;
```

Expected: `wal`

---

## 6. Admin Account Initialization

### 6.1 Admin Creation Script

```bash
python create_admin.py --db app.db --username < username >
```
## Create admin account

This will prompt for:

* admin username
* password

---

## 7. Server Startup

### 7.1 Development Mode

```bash
flask run
```

### 7.2 Production Mode

```bash
python app.py
```

---

## 8. Directory Structure

```text
project_root/
├── app.py
├── app.db
├── app.db-wal
├── app.db-shm
├── db/
│   ├── schema.sql
│   └── seed.sql
├── routes/
├── utils/
├── templates/
├── static/
├── Docs/
├── create_admin.py
├── db.py
├── requirements.txt
└── .env
```

---

## 9. Deployment Validation Checklist

* [ ] Database initialized
* [ ] WAL mode active
* [ ] Admin user created
* [ ] Server starts without errors
* [ ] Login page accessible
* [ ] Vehicle list page loads

---

## 10. Security Notes

* `.env` must not be committed to version control
* `SECRET_KEY` must be rotated in production
* DB file permissions must be restricted

---

## 11. Backup Strategy

### 11.1 Manual Backup

```bash
cp ./app.db ./backup/app_$(date +%F).db
```

---

## 12. Recovery Procedure

### 12.1 DB Recovery

```bash
cp ./backup/app_YYYY-MM-DD.db ./app.db
```
---

## 13. Operational Handover Notes

* All state changes must use history-based update rules
* No direct deletion of operational data
* Schema evolution must follow additive strategy

---

## 14. Deployment Summary

This system is designed for safe, reproducible deployment with minimal configuration complexity. All operational state is persisted in SQLite with WAL mode for concurrency safety and reliability.
