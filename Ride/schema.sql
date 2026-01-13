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

    parking_from DATE NOT NULL,
    parking_to   DATE,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehicle_id)
        REFERENCES vehicle(vehicle_id) ON DELETE RESTRICT,

    FOREIGN KEY (parking_lot_id)
        REFERENCES parking_lot(parking_lot_id) ON DELETE RESTRICT,

    CHECK (
        parking_to IS NULL
        OR parking_to >= parking_from
    )
);

CREATE UNIQUE INDEX uniq_vehicle_active_parking
ON vehicle_parking(vehicle_id)
WHERE parking_to IS NULL;


-- Fleet
-- Fleet Service
CREATE TABLE fleet_service (
    fleet_service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE vehicle_fleet (
    vehicle_fleet_id INTEGER PRIMARY KEY AUTOINCREMENT,

    vehicle_id INTEGER NOT NULL,
    fleet_service_id INTEGER NOT NULL,

    registered_from DATE NOT NULL,
    registered_to DATE,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehicle_id)
        REFERENCES vehicle(vehicle_id),

    FOREIGN KEY (fleet_service_id)
        REFERENCES fleet_service(fleet_service_id),

    CHECK (
        registered_to IS NULL
        OR registered_to >= registered_from
    )
);

-- Expense

CREATE TABLE IF NOT EXISTS expense_category (
    expense_category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS vehicle_expense (
    vehicle_expense_id INTEGER PRIMARY KEY AUTOINCREMENT,

    vehicle_id INTEGER NOT NULL,
    parking_lot_id INTEGER,
    
    expense_category_id INTEGER NOT NULL,

    amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),

    period_start DATE NOT NULL,
    period_end DATE,

    is_recurring INTEGER NOT NULL DEFAULT 0 CHECK (is_recurring IN (0, 1)),
    recurrence_unit TEXT
    CHECK (recurrence_unit IN ('monthly')),
    recurrence_anchor DATE,

    source TEXT NOT NULL DEFAULT 'manual',
    note TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (vehicle_id)
        REFERENCES vehicle(vehicle_id)
        ON DELETE CASCADE,

    FOREIGN KEY (expense_category_id)
        REFERENCES expense_category(expense_category_id),

    FOREIGN KEY (parking_lot_id)
        REFERENCES parking_lot(parking_lot_id),

    CHECK (
        period_end IS NULL
        OR
        period_end >= period_start
    ),

    CHECK (
        (is_recurring = 0 AND recurrence_unit IS NULL AND recurrence_anchor IS NULL)
        OR
        (is_recurring = 1 AND recurrence_unit IS NOT NULL)
    )
);



