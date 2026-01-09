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

CREATE TABLE IF NOT EXISTS warranty_type (
    warranty_type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('purchase', 'subscription')),
    sort_order INTEGER NOT NULL DEFAULT 100,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS vehicle_warranty (
    vehicle_warranty_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    warranty_type_id INTEGER NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('purchase', 'subscription')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE,
    FOREIGN KEY(warranty_type_id) REFERENCES warranty_type(warranty_type_id)
);

CREATE TABLE IF NOT EXISTS warranty_purchase (
    vehicle_warranty_id INTEGER PRIMARY KEY,
    expire_date DATE,
    expire_miles INTEGER,
    FOREIGN KEY(vehicle_warranty_id) REFERENCES vehicle_warranty(vehicle_warranty_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS warranty_subscription (
    vehicle_warranty_id INTEGER PRIMARY KEY,
    start_date DATE,
    end_date DATE,
    monthly_cost REAL,
    FOREIGN KEY(vehicle_warranty_id) REFERENCES vehicle_warranty(vehicle_warranty_id) ON DELETE CASCADE
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

-- Parking lots
CREATE TABLE IF NOT EXISTS parking_lot (
  parking_lot_id INTEGER PRIMARY KEY AUTOINCREMENT,

  name TEXT NOT NULL,

  address_line1 TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,

  status TEXT NOT NULL
  CHECK (status IN ('active', 'inactive'))
  DEFAULT 'active',

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,

  UNIQUE (address_line1, city, state)
);


CREATE TABLE IF NOT EXISTS vehicle_parking (
    vehicle_parking_id INTEGER PRIMARY KEY AUTOINCREMENT,

    vehicle_id INTEGER NOT NULL,
    parking_lot_id INTEGER NOT NULL,

    assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TEXT,

    FOREIGN KEY (vehicle_id)
        REFERENCES vehicle(vehicle_id),

    FOREIGN KEY (parking_lot_id)
        REFERENCES parking_lot(parking_lot_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_vehicle_active_parking
ON vehicle_parking(vehicle_id)
WHERE unassigned_at IS NULL;




