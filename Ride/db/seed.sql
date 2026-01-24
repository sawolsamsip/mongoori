
-- INSERTION EXTERIOR
INSERT INTO colors (color_id, color_name) VALUES 
(1, 'Pearl White Multi-Coat'),
(2, 'Stealth Grey'),
(3, 'Diamond Black'),
(4, 'Deep Blue Metallic'),
(5, 'Quicksilver'),
(6, 'Ultra Red'),
(7, 'Solid Black'),
(8, 'Midnight Silver Metallic'),
(9, 'Red Multi-Coat');

-- INSERTION INTERIOR
INSERT INTO color_group (group_id, color_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7),
(4, 1), (4, 2), (4, 4), (4, 5), (4, 6), (4, 7),
(5, 1), (5, 4), (5, 7), (5, 8), (5, 9); 


-- INSERTION Model Year Trim
INSERT INTO model_year_trim_exterior (model_name, "year", trim_name, color_group, sort_order) VALUES 
('Model 3', 2023, 'RWD (Base)', 5, 1),
('Model 3', 2023, 'Long Range', 5, 2),
('Model 3', 2023, 'Performance', 5, 3),
('Model 3', 2024, 'RWD (Base)', 4, 1),
('Model 3', 2024, 'Long Range', 4, 2),
('Model 3', 2024, 'Performance', 4, 3),
('Model 3', 2025, 'Long Range', 3, 1),
('Model 3', 2025, 'Performance', 3, 2),
('Model 3', 2026, 'Standard', 1, 1),
('Model 3', 2026, 'Premium', 2, 2),
('Model 3', 2026, 'Performance', 2, 3),
('Model Y', 2023, 'RWD (Base)', 5, 1),
('Model Y', 2023, 'Long Range', 5, 2),
('Model Y', 2023, 'Performance', 5, 3),
('Model Y', 2024, 'RWD (Base)', 4, 1),
('Model Y', 2024, 'Long Range', 4, 2),
('Model Y', 2024, 'Performance', 4, 3),
('Model Y', 2025, 'Long Range', 3, 1),
('Model Y', 2025, 'Performance', 3, 2),
('Model Y', 2026, 'Standard', 1, 1),
('Model Y', 2026, 'Premium', 2, 2),
('Model Y', 2026, 'Performance', 2, 3);

-- WARRANTY TYPES for loading in web-page
INSERT INTO warranty_type (type_name, display_name, category, sort_order) VALUES
('Basic Vehicle Limited Warranty', 'Basic Vehicle', 'purchase', 1),
('Supplemental Restraint System Warranty', 'SRS Warranty', 'purchase', 2),
('Battery and Drive Unit Limited Warranty', 'Battery & Drive Unit', 'purchase', 3),
('Body Rust Limited Warranty', 'Rust Warranty', 'purchase', 4),
('ZEV Defect Warranty', 'ZEV Defect', 'purchase', 5),
('ZEV Performance Warranty', 'ZEV Performance.', 'purchase', 6),
('ZEV Long-Term Emission Parts Warranty', 'ZEV Emission', 'purchase', 7),
('High-Priced Propulsion-Related Parts ZEV Warranty', 'PRP ZEV', 'purchase', 8),
('Pre-Owned Vehicle Limited Warranty', 'CPO Warranty', 'purchase', 9),
('Parts, Body and Paint Repair Warranty', 'Parts & Paint', 'purchase', 10),
('Extended Service Agreement', 'Extended Service', 'subscription', 11);

-- Expense category
INSERT OR IGNORE INTO expense_category (name) VALUES
('insurance'),
('maintenance'),
('parking'),
('platform_fee'),
('cleaning');

-- Fleet Service
INSERT OR IGNORE INTO fleet_service (name) VALUES
('TURO'),
('Fleet Example');


-- Finance Category
-- cost - vehicle
INSERT INTO finance_category (name, type, scope, description) VALUES
('parking',        'cost', 'vehicle', 'Vehicle parking cost'),
('insurance',      'cost', 'vehicle', 'Vehicle insurance'),
('maintenance',    'cost', 'vehicle', 'Vehicle maintenance and repair'),
('warranty',       'cost', 'vehicle', 'Vehicle warranty cost'),
('registration',   'cost', 'vehicle', 'Vehicle registration and DMV fees'),
('tax',            'cost', 'vehicle', 'Vehicle tax'),
('cleaning',       'cost', 'vehicle', 'Vehicle cleaning and detailing'),
('misc_cost',      'cost', 'vehicle', 'Miscellaneous vehicle costs');

INSERT INTO finance_category (name, type, scope, description) VALUES
('vehicle_purchase', 'cost', 'vehicle', 'Vehicle purchase price'),
('acquisition_fee',  'cost', 'vehicle', 'Vehicle acquisition fees'),
('dealer_fee',       'cost', 'vehicle', 'Dealer processing fee'),
('registration_tax', 'cost', 'vehicle', 'Purchase-related tax and registration'),
('import_fee',       'cost', 'vehicle', 'Import and customs fees');

-- revenue - vehicle
INSERT INTO finance_category (name, type, scope, description) VALUES
('rental_income',  'revenue', 'vehicle', 'Vehicle rental income'),
('misc_revenue',   'revenue', 'vehicle', 'Miscellaneous revenue');

INSERT INTO finance_category (name, type, scope, description) VALUES
('vehicle_sale',    'revenue', 'vehicle', 'Vehicle sale revenue');