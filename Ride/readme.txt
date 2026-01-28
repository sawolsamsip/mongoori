# Vehicle Management Web System

## Overview

This project is a web-based administrative platform designed for fleet and vehicle operations management. It provides integrated management of vehicles, warranties, parking locations, fleet services, operational status, subscriptions, and finance workflows using a history-based data modeling approach.

The system is designed as an **operational platform**, not a CRUD application.

---

## System Purpose

The primary goals of the system are:

* Vehicle-centric data management
* Operation-oriented system design
* History-based and temporal data modeling
* Admin-oriented management interface
* Scalable and extensible architecture
* Operational safety and auditability

---

## Key Capabilities

* Vehicle lifecycle management
* Operational state management
* Parking and location tracking
* Fleet service integration
* Warranty lifecycle management
* Subscription management
* Finance tracking (cost/revenue)
* History-based state transitions
* Temporal data traceability

---

## Documentation Index

### Core System Documentation

* **SYSTEM.md**
  System overview, architecture, technology stack, and domain model

* **DATA_MODEL.md**
  Database schema design, temporal modeling, and domain structure

* **OPERATIONS.md**
  Operational rules, state transitions, and governance model

* **DEPLOYMENT.md**
  Environment setup, database initialization, and deployment guide

---

## Architecture Summary

### Frontend

* AdminLTE
* Bootstrap 5
* DataTables
* Modal-based workflows
* AJAX-driven interactions

### Backend

* Python Flask
* Blueprint modular architecture
* REST-style API design
* Session-based authentication

### Database

* SQLite
* WAL mode enabled
* Temporal (history-based) data model
* Partial index constraints
* Active-row pattern

---

## Deployment Quick Start

```bash
pip install -r requirements.txt
sqlite3 ./app.db < db/schema.sql
sqlite3 ./app.db < db/seed.sql
python app.py
```

---

## Operational Principles

* History-based modeling
* No destructive updates
* State transitions via close + insert pattern
* Active-row constraint pattern (`*_to IS NULL`)
* Full historical traceability
* Integrity-first design

---

## Project Structure

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
│   ├── SYSTEM.md
│   ├── DATA_MODEL.md
│   ├── OPERATIONS.md
│   └── DEPLOYMENT.md
├── create_admin.py
├── db.py
├── requirements.txt
└── .env
```

---

## Handover Notes

* The system is designed as an operationally structured platform, not a simple CRUD application.
* All operational state changes must preserve history
* No destructive data operations are permitted
* Schema evolution must follow additive-only policy
* Operational integrity depends on temporal consistency

---

## System Status

* Documentation: Complete
* System architecture: Stable
* Operational model: Established
* Deployment model: Reproducible
* Data model: Temporal and auditable

---

## Philosophy

This system prioritizes:

* Long-term maintainability
* Operational correctness
* Auditability
* System evolution
* Structural integrity

Simplicity is secondary to consistency, traceability, and operational safety.
