import { Database } from "bun:sqlite";
import { SCHEMA_SQL } from "../src/database/schema";
import { SAMPLE_PRODUCTS, DEFAULT_SETTINGS } from "../src/database/seedData";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ DB Assertion failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ DB Passed: ${message}`);
}

console.log("--- Testing SQLite Database Engine & Transactions ---");

// Create in-memory SQLite database
const db = new Database(":memory:");

// Execute DDL schema
db.run(SCHEMA_SQL);
console.log("Executed SCHEMA_SQL successfully.");

// Test Settings insertion
const insertSetting = db.prepare(
  "INSERT INTO settings (key, value) VALUES (?, ?)",
);
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
  insertSetting.run(k, v);
}
const shopNameRow = db
  .query('SELECT value FROM settings WHERE key = "shop_name"')
  .get() as { value: string };
assert(
  shopNameRow.value === "Anahita Pustak Bhandar",
  "Settings table stores and retrieves shop_name",
);

// Test Products insertion
const insertProduct = db.prepare(`
  INSERT INTO products (name, barcode, category, cost_price, selling_price, gst_rate, stock_qty, unit)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const p of SAMPLE_PRODUCTS) {
  insertProduct.run(
    p.name,
    p.barcode,
    p.category,
    p.cost_price,
    p.selling_price,
    p.gst_rate,
    p.stock_qty,
    p.unit,
  );
}

const countRow = db.query("SELECT COUNT(*) as count FROM products").get() as {
  count: number;
};
assert(
  countRow.count === SAMPLE_PRODUCTS.length,
  `Inserted all ${SAMPLE_PRODUCTS.length} sample stationery items`,
);

// Find a test product
const testProd = db
  .query("SELECT * FROM products WHERE barcode = ?")
  .get("8901058850012") as any;
assert(testProd !== null, "Product found by EAN-13 barcode");
const initialStock = testProd.stock_qty;
assert(initialStock > 0, `Initial stock is ${initialStock}`);

// Test Atomic Sale Transaction
console.log("\n--- Testing Atomic Sale Transaction ---");
const saleTxn = db.transaction(() => {
  const billNumber = "INV-0001";
  const qtySold = 3;
  const unitSellPrice = 65.0; // Overridden selling price! (MRP was 70)
  const lineSubtotal = qtySold * unitSellPrice;
  const lineGst = lineSubtotal * (testProd.gst_rate / 100);
  const lineTotal = lineSubtotal + lineGst;

  // 1. Insert sales header
  const saleRes = db
    .prepare(
      `
    INSERT INTO sales (bill_number, sale_date, customer_name, payment_mode, subtotal, gst_total, discount, grand_total)
    VALUES (?, datetime('now'), ?, 'cash', ?, ?, 0, ?)
  `,
    )
    .run(billNumber, "Aarav Kumar", lineSubtotal, lineGst, lineTotal);

  const saleId = saleRes.lastInsertRowid;

  // 2. Insert sale_items with price snapshots
  db.prepare(
    `
    INSERT INTO sale_items (sale_id, product_id, product_name_snapshot, qty, cost_price_at_sale, selling_price_at_sale, gst_rate_at_sale, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    saleId,
    testProd.id,
    testProd.name,
    qtySold,
    testProd.cost_price, // snapshot original cost
    unitSellPrice, // snapshot overridden price
    testProd.gst_rate,
    lineTotal,
  );

  // 3. Deduct stock from products
  db.prepare(
    `
    UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?
  `,
  ).run(qtySold, testProd.id);

  // 4. Insert stock_movements
  db.prepare(
    `
    INSERT INTO stock_movements (product_id, type, qty_change, note)
    VALUES (?, 'sale', ?, ?)
  `,
  ).run(testProd.id, -qtySold, `Bill ${billNumber}`);
});

saleTxn();

// Verify stock deduction
const updatedProd = db
  .query("SELECT * FROM products WHERE id = ?")
  .get(testProd.id) as any;
assert(
  updatedProd.stock_qty === initialStock - 3,
  `Product stock decremented from ${initialStock} to ${updatedProd.stock_qty}`,
);

// Verify stock_movement record
const movementRow = db
  .query("SELECT * FROM stock_movements WHERE product_id = ?")
  .get(testProd.id) as any;
assert(
  movementRow.qty_change === -3,
  "Stock movement recorded qty_change = -3",
);
assert(movementRow.type === "sale", 'Stock movement recorded type = "sale"');

// Verify sale_items snapshot integrity
const saleItemRow = db
  .query("SELECT * FROM sale_items WHERE product_id = ?")
  .get(testProd.id) as any;
assert(
  saleItemRow.selling_price_at_sale === 65.0,
  "Snapshot preserved overridden selling price (65.0)",
);
assert(
  saleItemRow.cost_price_at_sale === testProd.cost_price,
  "Snapshot preserved cost price",
);

// Now change product live price and verify snapshot does NOT change
db.prepare("UPDATE products SET selling_price = 999.0 WHERE id = ?").run(
  testProd.id,
);
const recheckSaleItem = db
  .query("SELECT * FROM sale_items WHERE product_id = ?")
  .get(testProd.id) as any;
assert(
  recheckSaleItem.selling_price_at_sale === 65.0,
  "Integrity verified: Historical bill items are immutable when live product prices change",
);

// Test Monthly Profit Calculation Query
console.log("\n--- Testing Historical Monthly Profit Aggregations ---");
const profitQuery = db
  .query(
    `
  SELECT
    SUM(si.selling_price_at_sale * si.qty) as revenue,
    SUM(si.cost_price_at_sale * si.qty) as cost,
    SUM((si.selling_price_at_sale - si.cost_price_at_sale) * si.qty) as profit
  FROM sale_items si
`,
  )
  .get() as any;

const expectedProfit = (65.0 - testProd.cost_price) * 3;
assert(
  Math.abs(profitQuery.profit - expectedProfit) < 0.001,
  `Monthly profit query computed exact gross profit: ₹${profitQuery.profit}`,
);

console.log("\n--- All Database & Transaction Tests Passed Successfully! ---");
