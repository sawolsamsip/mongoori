PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS Vehicle (
    vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vin TEXT NOT NULL UNIQUE CHECK(length(vin) = 17),
    make TEXT,
    model TEXT,
    model_year INTEGER,
    trim TEXT,
    color TEXT,
    plate_number TEXT,
    plate_state TEXT,
    initial_odometer INTEGER,
    vehicle_status TEXT NOT NULL CHECK(vehicle_status IN ('Active', 'Inactive', 'Maintenance', 'Sold')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plate_number, plate_state)
);

CREATE TABLE IF NOT EXISTS Purchase (
    purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    purchase_date DATE NOT NULL,
    vendor_name TEXT,
    purchase_price REAL,
    sales_tax REAL,
    registration_fee REAL,
    other_fee REAL,
    financing_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vehicle_id) REFERENCES Vehicle(Vehicle_id)
);

CREATE TABLE IF NOT EXISTS VENDOR (
    vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_name TEXT
);

CREATE TABLE IF NOT EXISTS AdminUser (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);