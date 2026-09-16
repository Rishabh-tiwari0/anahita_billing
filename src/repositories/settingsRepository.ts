import { getDb } from "../database";
import { DEFAULT_SETTINGS } from "../database/seedData";
import { ShopSettings } from "../database/types";

export const settingsRepository = {
  async getSettings(): Promise<ShopSettings> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ key: string; value: string }>(
      "SELECT key, value FROM settings;",
    );

    const map: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const r of rows) {
      map[r.key] = r.value;
    }

    return {
      shop_name: map.shop_name || DEFAULT_SETTINGS.shop_name,
      tagline: map.tagline || DEFAULT_SETTINGS.tagline,
      address: map.address || DEFAULT_SETTINGS.address,
      phone: map.phone || DEFAULT_SETTINGS.phone,
      gstin: map.gstin || DEFAULT_SETTINGS.gstin,
      receipt_footer: map.receipt_footer || DEFAULT_SETTINGS.receipt_footer,
      low_stock_threshold: Number(map.low_stock_threshold) || 5,
      paper_width: (map.paper_width as "58mm" | "80mm") || "58mm",
    };
  },

  async updateSettings(settings: Partial<ShopSettings>): Promise<void> {
    const db = await getDb();
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const [key, val] of Object.entries(settings)) {
        if (val !== undefined) {
          await txn.runAsync(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);",
            [key, String(val)],
          );
        }
      }
    });
  },

  async getSetting(key: string, defaultValue: string = ""): Promise<string> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?;",
      [key],
    );
    return row?.value ?? defaultValue;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);",
      [key, value],
    );
  },
};
