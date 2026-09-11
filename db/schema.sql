-- Asset Management System Schema

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  designation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  asset_tag TEXT UNIQUE NOT NULL,          -- e.g. LAP-0001
  type TEXT NOT NULL,                      -- LAPTOP, PHONE, MONITOR, OTHER
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  vendor TEXT,
  purchase_date DATE,
  purchase_price NUMERIC(12,2),
  warranty_expiry DATE,
  status TEXT NOT NULL DEFAULT 'IN_STOCK', -- IN_STOCK, ASSIGNED, UNDER_MAINTENANCE, RETIRED
  condition TEXT DEFAULT 'NEW',            -- NEW, GOOD, DAMAGED, RETIRED
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  returned_date DATE,
  return_condition TEXT,                   -- GOOD, DAMAGED, LOST
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE, RETURNED
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  vendor TEXT,
  issue TEXT NOT NULL,
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  returned_date DATE,
  cost NUMERIC(12,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE, RETURNED
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignments_asset ON assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_asset ON maintenance_logs(asset_id);

-- Prevents two assets from sharing a serial number (NULLs are exempt, so it's still optional)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_assets_serial_number
  ON assets(serial_number) WHERE serial_number IS NOT NULL;

-- Ensures an asset can only have ONE active assignment at a time
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_assignment_per_asset
  ON assignments(asset_id) WHERE status = 'ACTIVE';

-- Ensures an asset can only have ONE active maintenance record at a time
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_maintenance_per_asset
  ON maintenance_logs(asset_id) WHERE status = 'ACTIVE';
