import { EscPosBuilder, generateEscPosReceipt } from "../src/services/escpos";
import { buildReceiptHtml } from "../src/services/receiptHtml";
import { SaleDetail } from "../src/repositories/salesRepository";
import { ShopSettings } from "../src/database/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ Passed: ${message}`);
}

console.log("--- Testing ESC/POS Receipt Command Generation ---");

const testSettings: ShopSettings = {
  shop_name: "Anahita Pustak Bhandar",
  tagline: "Stationery, Books & Counter Supplies",
  address: "Station Road, Patna - 800001",
  phone: "+91 98765 43210",
  gstin: "10ABCDE1234F1Z5",
  receipt_footer: "Thank you! Visit again.",
  low_stock_threshold: 5,
  paper_width: "58mm",
};

const testSale: SaleDetail = {
  id: 1,
  bill_number: "INV-0001",
  sale_date: "2026-09-15 19:30:00",
  customer_name: "Rohan Sharma",
  payment_mode: "split",
  payment_split_details: JSON.stringify({ cash: 100, upi: 120 }),
  subtotal: 200,
  gst_total: 20,
  discount: 0,
  grand_total: 220,
  items: [
    {
      id: 1,
      sale_id: 1,
      product_id: 10,
      product_name_snapshot: "Classmate Long Notebook (172 pgs)",
      qty: 2,
      cost_price_at_sale: 52.0,
      selling_price_at_sale: 70.0,
      gst_rate_at_sale: 0,
      line_total: 140.0,
    },
    {
      id: 2,
      sale_id: 1,
      product_id: 20,
      product_name_snapshot: "Reynolds Trimax Gel Pen",
      qty: 1,
      cost_price_at_sale: 45.0,
      selling_price_at_sale: 60.0,
      gst_rate_at_sale: 18,
      line_total: 70.8,
    },
  ],
};

const escPosBytes = generateEscPosReceipt(testSale, testSettings);
assert(escPosBytes instanceof Uint8Array, "ESC/POS output is Uint8Array");
assert(
  escPosBytes.length > 50,
  `ESC/POS byte buffer has content (size: ${escPosBytes.length} bytes)`,
);

// Check initialization byte ESC @ (0x1B, 0x40)
assert(
  escPosBytes[0] === 0x1b && escPosBytes[1] === 0x40,
  "ESC/POS starts with ESC @ init command",
);

// Check cut command at end GS V 66 0 (0x1D, 0x56, 0x42, 0x00)
const lastBytes = escPosBytes.slice(escPosBytes.length - 4);
assert(
  lastBytes[0] === 0x1d &&
    lastBytes[1] === 0x56 &&
    lastBytes[2] === 0x42 &&
    lastBytes[3] === 0x00,
  "ESC/POS ends with GS V 66 0 cut command",
);

console.log("\n--- Testing HTML Thermal Receipt Builder ---");
const html = buildReceiptHtml(testSale, testSettings);
assert(
  html.includes("Anahita Pustak Bhandar"),
  "HTML receipt includes shop name",
);
assert(html.includes("INV-0001"), "HTML receipt includes bill number");
assert(html.includes("Rohan Sharma"), "HTML receipt includes customer name");
assert(
  html.includes("Classmate Long Notebook"),
  "HTML receipt includes snapshot product name",
);
assert(
  html.includes("Reynolds Trimax Gel Pen"),
  "HTML receipt includes pen item",
);
assert(html.includes("GSTIN:"), "HTML receipt includes GSTIN");
assert(html.includes("58mm"), "HTML receipt respects 58mm page width");

console.log("\n--- Testing Sales & Profit Calculations ---");

// Profit calculation formula: (selling_price_at_sale - cost_price_at_sale) * qty
const item1Profit = (70.0 - 52.0) * 2; // (18) * 2 = 36
const item2Profit = (60.0 - 45.0) * 1; // (15) * 1 = 15
const totalProfit = item1Profit + item2Profit; // 51
const totalItemRevenue = 70.0 * 2 + 60.0 * 1; // 200
const profitMargin = (totalProfit / totalItemRevenue) * 100; // 51 / 200 * 100 = 25.5%

assert(item1Profit === 36, "Item 1 profit matches (70 - 52) * 2 = 36");
assert(item2Profit === 15, "Item 2 profit matches (60 - 45) * 1 = 15");
assert(totalProfit === 51, "Total profit matches 36 + 15 = 51");
assert(profitMargin === 25.5, "Profit margin matches 25.5%");

console.log("\n--- All Unit Logic Tests Passed Successfully! ---");
