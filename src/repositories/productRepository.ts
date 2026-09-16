import { getDb } from "../database";
import { Product, StockMovement, StockMovementType } from "../database/types";

export interface CreateProductInput {
  name: string;
  barcode?: string | null;
  category?: string;
  cost_price: number;
  selling_price: number;
  gst_rate?: number;
  stock_qty?: number;
  unit?: string;
}

export interface UpdateProductInput {
  name: string;
  barcode?: string | null;
  category: string;
  cost_price: number;
  selling_price: number;
  gst_rate: number;
  unit: string;
}

export const productRepository = {
  async getAllProducts(options?: {
    search?: string;
    category?: string;
    lowStockOnly?: boolean;
    threshold?: number;
  }): Promise<Product[]> {
    const db = await getDb();
    const conditions: string[] = [];
    const params: any[] = [];

    if (options?.search && options.search.trim() !== "") {
      const q = `%${options.search.trim()}%`;
      conditions.push("(name LIKE ? OR barcode LIKE ? OR category LIKE ?)");
      params.push(q, q, q);
    }

    if (options?.category && options.category !== "All") {
      conditions.push("category = ?");
      params.push(options.category);
    }

    if (options?.lowStockOnly) {
      const th = options.threshold ?? 5;
      conditions.push("stock_qty <= ?");
      params.push(th);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM products ${whereClause} ORDER BY name ASC;`;

    return await db.getAllAsync<Product>(query, params);
  },

  async getProductById(id: number): Promise<Product | null> {
    const db = await getDb();
    return await db.getFirstAsync<Product>(
      "SELECT * FROM products WHERE id = ?;",
      [id],
    );
  },

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const db = await getDb();
    const clean = barcode.trim();
    return await db.getFirstAsync<Product>(
      "SELECT * FROM products WHERE barcode = ?;",
      [clean],
    );
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    const db = await getDb();
    const name = input.name.trim();
    const barcode = input.barcode ? input.barcode.trim() : null;
    const category = input.category ? input.category.trim() : "General";
    const cost_price = Number(input.cost_price) || 0;
    const selling_price = Number(input.selling_price) || 0;
    const gst_rate = Number(input.gst_rate) || 0;
    const initial_stock = Number(input.stock_qty) || 0;
    const unit = input.unit ? input.unit.trim() : "pcs";

    let newId = 0;
    await db.withExclusiveTransactionAsync(async (txn) => {
      const res = await txn.runAsync(
        `INSERT INTO products (name, barcode, category, cost_price, selling_price, gst_rate, stock_qty, unit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          name,
          barcode,
          category,
          cost_price,
          selling_price,
          gst_rate,
          initial_stock,
          unit,
        ],
      );
      newId = res.lastInsertRowId;

      if (initial_stock !== 0) {
        await txn.runAsync(
          `INSERT INTO stock_movements (product_id, type, qty_change, note)
           VALUES (?, 'purchase', ?, 'Initial Stock');`,
          [newId, initial_stock],
        );
      }
    });

    const created = await this.getProductById(newId);
    if (!created) throw new Error("Failed to retrieve newly created product");
    return created;
  },

  async updateProduct(id: number, input: UpdateProductInput): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE products
       SET name = ?, barcode = ?, category = ?, cost_price = ?, selling_price = ?, gst_rate = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?;`,
      [
        input.name.trim(),
        input.barcode ? input.barcode.trim() : null,
        input.category.trim(),
        Number(input.cost_price),
        Number(input.selling_price),
        Number(input.gst_rate),
        input.unit.trim(),
        id,
      ],
    );
  },

  async adjustStock(
    productId: number,
    qtyChange: number,
    type: StockMovementType,
    note?: string,
    newCostPrice?: number,
  ): Promise<void> {
    const db = await getDb();

    await db.withExclusiveTransactionAsync(async (txn) => {
      if (
        type === "purchase" &&
        newCostPrice !== undefined &&
        newCostPrice > 0
      ) {
        await txn.runAsync(
          `UPDATE products
           SET stock_qty = stock_qty + ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?;`,
          [qtyChange, newCostPrice, productId],
        );
      } else {
        await txn.runAsync(
          `UPDATE products
           SET stock_qty = stock_qty + ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?;`,
          [qtyChange, productId],
        );
      }

      await txn.runAsync(
        `INSERT INTO stock_movements (product_id, type, qty_change, note)
         VALUES (?, ?, ?, ?);`,
        [productId, type, qtyChange, note ? note.trim() : null],
      );
    });
  },

  async getProductMovements(productId: number): Promise<StockMovement[]> {
    const db = await getDb();
    return await db.getAllAsync<StockMovement>(
      `SELECT sm.*, p.name as product_name
       FROM stock_movements sm
       LEFT JOIN products p ON sm.product_id = p.id
       WHERE sm.product_id = ?
       ORDER BY sm.created_at DESC, sm.id DESC;`,
      [productId],
    );
  },

  async getAllCategories(): Promise<string[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ category: string }>(
      'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC;',
    );
    return rows.map((r) => r.category);
  },

  async getLowStockCount(threshold: number = 5): Promise<number> {
    const db = await getDb();
    const res = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM products WHERE stock_qty <= ?;",
      [threshold],
    );
    return res?.count ?? 0;
  },
};
