import { beforeAll, afterAll } from "vitest";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Load .env.test
const envPath = path.resolve(__dirname, "../../.env.test");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...rest] = trimmed.split("=");
    const value = rest.join("=");
    process.env[key] = value;
  }
}

beforeAll(async () => {
  // Run migration SQL using drizzle's raw SQL execution
  // We need to execute the migration properly without splitting on semicolons
  // since the SQL contains dollar-quoted strings ($$)
  const migrationSql = fs.readFileSync(
    path.resolve(__dirname, "../../drizzle/0000_safe_bug.sql"),
    "utf-8"
  );

  // Use drizzle's migrate function approach: execute the raw SQL as-is
  // First, drop all tables if they exist to start fresh
  const dropTables = [
    "stock_mutations", "transaction_items", "transactions", "daily_counters",
    "online_bookings", "booking_slots", "inpatient_logs", "inpatients",
    "medical_records", "appointments", "pet_vaccines", "pets",
    "dokter_profiles", "expenses", "products", "services", "categories",
    "clinic_info", "profiles",
  ];
  for (const table of dropTables) {
    try {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`));
    } catch {
      // ignore if table doesn't exist
    }
  }

  // Execute the full migration SQL
  await db.execute(sql.raw(migrationSql));
});

afterAll(async () => {
  // Clean up all tables after tests
  const tables = [
    "stock_mutations", "transaction_items", "transactions", "daily_counters",
    "online_bookings", "booking_slots", "inpatient_logs", "inpatients",
    "medical_records", "appointments", "pet_vaccines", "pets",
    "dokter_profiles", "expenses", "products", "services", "categories",
    "clinic_info", "profiles",
  ];
  for (const table of tables) {
    try {
      await db.execute(sql.raw(`DELETE FROM "${table}"`));
    } catch {
      // ignore if table doesn't exist
    }
  }
});