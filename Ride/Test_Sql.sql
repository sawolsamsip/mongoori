CREATE TABLE IF NOT EXISTS parking_lot (
  parking_lot_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_parking (
  vehicle_id INTEGER PRIMARY KEY,
  parking_lot_id INTEGER,
  FOREIGN KEY(vehicle_id) REFERENCES vehicle(vehicle_id),
  FOREIGN KEY(parking_lot_id) REFERENCES parking_lot(parking_lot_id)
);

INSERT INTO parking_lot (name) VALUES
  ('Lot A'),
  ('Lot B');

INSERT INTO vehicle_parking (vehicle_id, parking_lot_id) VALUES
(1, 1),
(3, 1),
(4, 2);