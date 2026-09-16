import * as SQLite from "expo-sqlite";
import { SCHEMA_SQL } from "./schema";
import { DEFAULT_SETTINGS, SAMPLE_PRODUCTS } from "./seedData";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("anahita_pos.db");
  }
  return dbInstance;
}

export async function getDatabasePath(): Promise<string> {
  const db = await getDb();
  return db.databasePath;
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await getDb();

  // Execute schema creation
  await db.execAsync(SCHEMA_SQL);

  // Check if settings table is empty
  const settingsCount = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM settings;",
  );
  if (!settingsCount || settingsCount.count === 0) {
    for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);",
        [key, val],
      );
    }
  }

  return db;
}

export async function clearAllProducts(): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync("DELETE FROM sale_items;");
    await txn.runAsync("DELETE FROM sales;");
    await txn.runAsync("DELETE FROM stock_movements;");
    await txn.runAsync("DELETE FROM products;");
  });
}

export async function seedSampleData(): Promise<void> {
  const db = await getDb();

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const p of SAMPLE_PRODUCTS) {
      const existing = await txn.getFirstAsync<{ id: number }>(
        "SELECT id FROM products WHERE barcode = ? OR name = ?;",
        [p.barcode, p.name],
      );

      if (!existing) {
        const res = await txn.runAsync(
          `INSERT INTO products (name, barcode, category, cost_price, selling_price, gst_rate, stock_qty, unit)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            p.name,
            p.barcode,
            p.category,
            p.cost_price,
            p.selling_price,
            p.gst_rate,
            p.stock_qty,
            p.unit,
          ],
        );

        // Record initial inward movement
        await txn.runAsync(
          `INSERT INTO stock_movements (product_id, type, qty_change, note)
           VALUES (?, 'purchase', ?, 'Initial Inventory Seed');`,
          [res.lastInsertRowId, p.stock_qty],
        );
      }
    }
  });
}

export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS sale_items;
    DROP TABLE IF EXISTS sales;
    DROP TABLE IF EXISTS stock_movements;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS settings;
  `);
  await initDatabase();
}
