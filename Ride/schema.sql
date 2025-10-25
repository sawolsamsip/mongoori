PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS vehicle (
    vehicle_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vin TEXT NOT NULL UNIQUE CHECK(length(vin) = 17),
    make TEXT,
    model TEXT,
    model_year INTEGER,
    trim TEXT,
    exterior TEXT,
    interior TEXT,
    plate_number TEXT,
    mileage INTEGER,
    software TEXT,
    vehicle_status TEXT NOT NULL CHECK(vehicle_status IN ('Active', 'Inactive', 'Maintenance', 'Sold')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warranty (
    warranty_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    warranty_type TEXT NOT NULL,
    expire_date DATETIME,
    expire_miles INTEGER,
    FOREIGN KEY(vehicle_id) REFERENCES vehicle(vehicle_id)

);

-- CREATE TABLE IF NOT EXISTS purchase (
--     purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     vehicle_id INTEGER NOT NULL,
--     purchase_date DATE NOT NULL,
--     vendor_name TEXT,
--     purchase_price REAL,
--     sales_tax REAL,
--     registration_fee REAL,
--     other_fee REAL,
--     financing_id TEXT,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY(vehicle_id) REFERENCES vehicle(vehicle_id)
-- );

-- CREATE TABLE IF NOT EXISTS vendor (
--     vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     vendor_name TEXT
-- );

CREATE TABLE IF NOT EXISTS admin_user (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS colors (
    color_id INTEGER PRIMARY KEY,
    color_name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS color_group (
    group_id INTEGER,
    color_id INTEGER,
    FOREIGN KEY(color_id) REFERENCES colors(color_id),
    UNIQUE(group_id, color_id)
);

CREATE TABLE IF NOT EXISTS model_year_trim_exterior (
    dyt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    trim_name TEXT NOT NULL,
    color_group INTEGER NOT NULL,
    sort_order INTEGER NOT NULL,
    UNIQUE (model_name, "year", trim_name, color_group)
);

CREATE TABLE IF NOT EXISTS interior (
    interior_id INTEGER PRIMARY KEY AUTOINCREMENT,
    interior_name TEXT UNIQUE NOT NULL
);





