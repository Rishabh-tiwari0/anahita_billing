import { getDb } from "../database";
import { CreateSaleInput, Sale, SaleItem } from "../database/types";

export interface SaleDetail extends Sale {
  items: SaleItem[];
}

export const salesRepository = {
  async getNextBillNumber(): Promise<string> {
    const db = await getDb();
    const lastSale = await db.getFirstAsync<{ id: number }>(
      "SELECT id FROM sales ORDER BY id DESC LIMIT 1;",
    );
    const nextSeq = (lastSale?.id ?? 0) + 1;
    return `INV-${String(nextSeq).padStart(4, "0")}`;
  },

  async createSale(input: CreateSaleInput): Promise<SaleDetail> {
    const db = await getDb();

    if (!input.items || input.items.length === 0) {
      throw new Error("Cannot create a bill with an empty cart.");
    }

    let subtotal = 0;
    let gst_total = 0;

    for (const item of input.items) {
      const lineSubtotal = item.qty * item.selling_price_at_sale;
      const lineGst = lineSubtotal * (item.gst_rate_at_sale / 100);
      subtotal += lineSubtotal;
      gst_total += lineGst;
    }

    const discount = Math.max(0, Number(input.discount) || 0);
    const grand_total = Math.max(
      0,
      Math.round((subtotal + gst_total - discount) * 100) / 100,
    );

    let createdSaleId = 0;
    let billNumber = "";

    await db.withExclusiveTransactionAsync(async (txn) => {
      // 1. Generate sequential bill number
      const last = await txn.getFirstAsync<{ id: number }>(
        "SELECT id FROM sales ORDER BY id DESC LIMIT 1;",
      );
      const nextSeq = (last?.id ?? 0) + 1;
      billNumber = `INV-${String(nextSeq).padStart(4, "0")}`;

      const splitJson =
        input.payment_mode === "split" && input.payment_split_details
          ? JSON.stringify(input.payment_split_details)
          : null;

      // 2. Insert into sales
      const saleResult = await txn.runAsync(
        `INSERT INTO sales (bill_number, customer_name, payment_mode, payment_split_details, subtotal, gst_total, discount, grand_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          billNumber,
          input.customer_name ? input.customer_name.trim() : null,
          input.payment_mode,
          splitJson,
          subtotal,
          gst_total,
          discount,
          grand_total,
        ],
      );
      createdSaleId = saleResult.lastInsertRowId;

      // 3. Process each item: insert sale_items, deduct stock, log movement
      for (const it of input.items) {
        await txn.runAsync(
          `INSERT INTO sale_items (sale_id, product_id, product_name_snapshot, qty, cost_price_at_sale, selling_price_at_sale, gst_rate_at_sale, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            createdSaleId,
            it.product_id,
            it.product_name_snapshot,
            it.qty,
            it.cost_price_at_sale,
            it.selling_price_at_sale,
            it.gst_rate_at_sale,
            it.line_total,
          ],
        );

        // Deduct inventory
        await txn.runAsync(
          `UPDATE products
           SET stock_qty = stock_qty - ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?;`,
          [it.qty, it.product_id],
        );

        // Record stock movement
        await txn.runAsync(
          `INSERT INTO stock_movements (product_id, type, qty_change, note)
           VALUES (?, 'sale', ?, ?);`,
          [it.product_id, -it.qty, `Bill ${billNumber}`],
        );
      }
    });

    const fullSale = await this.getSaleById(createdSaleId);
    if (!fullSale) throw new Error("Failed to retrieve created sale record.");
    return fullSale;
  },

  async getSaleById(saleId: number): Promise<SaleDetail | null> {
    const db = await getDb();
    const sale = await db.getFirstAsync<Sale>(
      "SELECT * FROM sales WHERE id = ?;",
      [saleId],
    );
    if (!sale) return null;

    const items = await db.getAllAsync<SaleItem>(
      "SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC;",
      [saleId],
    );

    return { ...sale, items };
  },

  async getSaleByBillNumber(billNumber: string): Promise<SaleDetail | null> {
    const db = await getDb();
    const sale = await db.getFirstAsync<Sale>(
      "SELECT * FROM sales WHERE bill_number = ?;",
      [billNumber.trim()],
    );
    if (!sale) return null;

    const items = await db.getAllAsync<SaleItem>(
      "SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC;",
      [sale.id],
    );

    return { ...sale, items };
  },

  async getLastSale(): Promise<SaleDetail | null> {
    const db = await getDb();
    const lastSale = await db.getFirstAsync<Sale>(
      "SELECT * FROM sales ORDER BY id DESC LIMIT 1;",
    );
    if (!lastSale) return null;

    const items = await db.getAllAsync<SaleItem>(
      "SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id ASC;",
      [lastSale.id],
    );

    return { ...lastSale, items };
  },

  async getRecentSales(limit: number = 20): Promise<Sale[]> {
    const db = await getDb();
    return await db.getAllAsync<Sale>(
      "SELECT * FROM sales ORDER BY sale_date DESC, id DESC LIMIT ?;",
      [limit],
    );
  },
};
