# Operations Documentation

## 1. Purpose

This document defines the operational procedures for daily usage, administration, and maintenance of the Vehicle Management Web System. It is intended for system operators and administrators during project handover.

---

## 2. Operational Principles

* All operational state changes must follow **history-based modeling**
* No operational data is overwritten
* State changes are implemented as **close + insert** patterns
* Direct DB modification is prohibited unless explicitly documented

---

## 3. Daily Operations

### 3.1 Vehicle Registration

**Flow:**

1. Register vehicle in Vehicle Management View
2. Validate VIN uniqueness
3. Assign base metadata (model, year, trim, color, interior)
4. Set initial vehicle status

---

### 3.2 Vehicle Status Management

**Allowed states:**

* Active
* Maintenance
* Archived

**Rules:**

* Archived vehicles must not be assigned to parking, fleet, or operation
* Maintenance vehicles are excluded from operation views

---

### 3.3 Parking Management

**Parking Change Procedure:**

1. Close current active parking record (`parking_to = today`)
2. Insert new parking record

**Rules:**

* Only one active parking per vehicle
* History must never be deleted

---

### 3.4 Operation Location Management

**Operation Location Change:**

1. Close current active operation location
2. Insert new active location

**Rationale:**
Operational base ≠ physical parking

---

### 3.5 Fleet Registration

**Fleet Connection Flow:**

1. Register vehicle to fleet service
2. System inserts new `vehicle_fleet` row

**Fleet Unregistration Flow:**

1. Close active registration (`registered_to = today`)

**Rules:**

* Multiple historical connections allowed
* Only one active connection per service

---

### 3.6 Warranty Operations

**Purchase Warranty:**

* One-time registration
* Expiry controlled by date/mileage

**Subscription Warranty:**

* Time-based validity
* Monthly cost tracking

**Rules:**

* Warranty changes create new records
* No destructive updates

---

## 4. Administrative Operations

### 4.1 Admin Account Management

* Admin accounts created via script
* Password reset via secure regeneration
* No UI-based password exposure

---

### 4.2 Role Control Policy

(Current version: single-role admin model)
Future extension: role-based access control (RBAC)

---

## 5. Data Integrity Rules

* No manual deletion of operational rows
* No updates on active rows
* All changes must preserve history

---

## 6. Maintenance Operations

### 6.1 Schema Changes

**Policy:**

* Additive changes only
* No destructive migrations
* Backward compatibility required

---

### 6.2 Data Corrections

**Procedure:**

1. Identify incorrect record
2. Close incorrect active row
3. Insert corrected record

---

## 7. Prohibited Actions

* Deleting history tables
* Overwriting state records
* Disabling constraints

---

## 9. Operational Summary

This system is designed as a **stateful operational platform**, not a CRUD application.

Operational correctness depends on:

* Strict history preservation
* Controlled state transitions
* Integrity-first management

Failure to follow operational rules may compromise system consistency and auditability.
