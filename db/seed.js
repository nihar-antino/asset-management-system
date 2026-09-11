/**
 * Seed script - populates the database with realistic demo data.
 * Usage: node db/seed.js
 * Requires DATABASE_URL to be set (reads from .env.local automatically via dotenv-less inline load).
 */
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Minimal .env.local loader so this works without extra deps
function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}
loadEnvLocal();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env.local or export it before running.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function main() {
  console.log("Seeding database...");

  const employees = [
    ["Riya Sharma", "riya.sharma@acme.com", "Engineering", "SDE-2"],
    ["Arjun Mehta", "arjun.mehta@acme.com", "Engineering", "SDE-1"],
    ["Neha Kapoor", "neha.kapoor@acme.com", "Design", "Product Designer"],
    ["Vikram Rao", "vikram.rao@acme.com", "Sales", "Account Executive"],
    ["Ananya Iyer", "ananya.iyer@acme.com", "HR", "HR Manager"],
  ];

  const empIds = [];
  for (const [name, email, department, designation] of employees) {
    const res = await pool.query(
      `INSERT INTO employees (name, email, department, designation) VALUES ($1,$2,$3,$4) RETURNING id`,
      [name, email, department, designation]
    );
    empIds.push(res.rows[0].id);
  }
  console.log(`Created ${empIds.length} employees`);

  const assetSpecs = [
    ["LAPTOP", "Dell", "Latitude 5440", "Dell Direct", "2026-01-10", 75000, "2029-01-10"],
    ["LAPTOP", "Dell", "Latitude 5440", "Dell Direct", "2026-01-10", 75000, "2029-01-10"],
    ["LAPTOP", "Apple", "MacBook Air M2", "Apple Business", "2026-02-05", 105000, "2027-02-05"],
    ["LAPTOP", "Apple", "MacBook Air M2", "Apple Business", "2026-02-05", 105000, "2027-02-05"],
    ["LAPTOP", "Lenovo", "ThinkPad E14", "Ingram Micro", "2026-03-01", 62000, "2028-03-01"],
    ["PHONE", "Apple", "iPhone 14", "Apple Business", "2026-01-20", 65000, "2027-01-20"],
    ["PHONE", "Samsung", "Galaxy S24", "Samsung B2B", "2026-01-20", 58000, "2027-01-20"],
    ["PHONE", "Samsung", "Galaxy S24", "Samsung B2B", "2026-01-20", 58000, "2027-01-20"],
    ["MONITOR", "Dell", "U2723QE", "Dell Direct", "2026-02-15", 32000, "2029-02-15"],
    ["MONITOR", "LG", "27UP850", "Ingram Micro", "2026-02-15", 28000, "2029-02-15"],
  ];

  const assetIds = [];
  for (let i = 0; i < assetSpecs.length; i++) {
    const [type, brand, model, vendor, purchaseDate, price, warranty] = assetSpecs[i];
    const tag = `${type.slice(0, 3)}-${String(i + 1).padStart(4, "0")}`;
    const res = await pool.query(
      `INSERT INTO assets (asset_tag, type, brand, model, vendor, purchase_date, purchase_price, warranty_expiry)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [tag, type, brand, model, vendor, purchaseDate, price, warranty]
    );
    assetIds.push(res.rows[0].id);
  }
  console.log(`Created ${assetIds.length} assets`);

  // Assign a few assets to employees (active)
  const activeAssignments = [
    [assetIds[0], empIds[0], "2026-01-15", "Onboarding laptop"],
    [assetIds[2], empIds[1], "2026-02-10", "Onboarding laptop"],
    [assetIds[5], empIds[0], "2026-01-25", "Company phone"],
  ];
  for (const [assetId, empId, assignedDate, notes] of activeAssignments) {
    await pool.query(
      `INSERT INTO assignments (asset_id, employee_id, assigned_date, notes) VALUES ($1,$2,$3,$4)`,
      [assetId, empId, assignedDate, notes]
    );
    await pool.query(`UPDATE assets SET status = 'ASSIGNED' WHERE id = $1`, [assetId]);
  }
  console.log(`Created ${activeAssignments.length} active assignments`);

  // One historical assignment that was already returned (shows history working)
  const oldAssignRes = await pool.query(
    `INSERT INTO assignments (asset_id, employee_id, assigned_date, returned_date, return_condition, status, notes)
     VALUES ($1,$2,'2025-11-01','2026-01-05','GOOD','RETURNED','Employee moved teams, handed back laptop')
     RETURNING id`,
    [assetIds[4], empIds[2]]
  );
  // That asset is now back in stock (status stays IN_STOCK, which is the default)
  console.log("Created 1 historical (returned) assignment");

  console.log("Done. Summary:");
  const summary = await pool.query(`SELECT status, COUNT(*) FROM assets GROUP BY status`);
  console.table(summary.rows);

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
