export interface Product {
  id: number;
  name: string;
  barcode: string | null;
  category: string;
  cost_price: number;
  selling_price: number;
  gst_rate: number;
  stock_qty: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMode = "cash" | "upi" | "card" | "split";

export interface PaymentSplitDetails {
  cash?: number;
  upi?: number;
  card?: number;
}

export interface Sale {
  id: number;
  bill_number: string;
  sale_date: string;
  customer_name: string | null;
  payment_mode: PaymentMode;
  payment_split_details: string | null; // JSON string
  subtotal: number;
  gst_total: number;
  discount: number;
  grand_total: number;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name_snapshot: string;
  qty: number;
  cost_price_at_sale: number;
  selling_price_at_sale: number;
  gst_rate_at_sale: number;
  line_total: number;
}

export type StockMovementType = "purchase" | "sale" | "correction";

export interface StockMovement {
  id: number;
  product_id: number;
  type: StockMovementType;
  qty_change: number;
  note: string | null;
  created_at: string;
  product_name?: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  selling_price: number; // can be overridden for negotiation/discount
  gst_rate: number;
  line_subtotal: number;
  line_gst: number;
  line_total: number;
}

export interface ShopSettings {
  shop_name: string;
  tagline: string;
  address: string;
  phone: string;
  gstin: string;
  receipt_footer: string;
  low_stock_threshold: number;
  paper_width: "58mm" | "80mm";
}

export interface CreateSaleInput {
  customer_name?: string;
  payment_mode: PaymentMode;
  payment_split_details?: PaymentSplitDetails;
  discount: number;
  items: {
    product_id: number;
    product_name_snapshot: string;
    qty: number;
    cost_price_at_sale: number;
    selling_price_at_sale: number;
    gst_rate_at_sale: number;
    line_total: number;
  }[];
}
