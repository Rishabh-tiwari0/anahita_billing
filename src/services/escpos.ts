import { SaleDetail } from "../repositories/salesRepository";
import { ShopSettings } from "../database/types";

export class EscPosBuilder {
  private buffer: number[] = [];
  private lineWidth: number;

  constructor(paperWidth: "58mm" | "80mm" = "58mm") {
    // 58mm thermal printers usually have 32 characters per line in Font A
    // 80mm thermal printers usually have 48 characters per line in Font A
    this.lineWidth = paperWidth === "80mm" ? 48 : 32;
    this.init();
  }

  init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @ Initialize printer
    return this;
  }

  alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00);
    return this;
  }

  alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01);
    return this;
  }

  alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02);
    return this;
  }

  bold(enable: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  doubleSize(enable: boolean = true): this {
    // GS ! n (0x11 = double width & height, 0x00 = normal)
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      // Map basic unicode currency symbol or replace unsupported characters
      if (str[i] === "₹") {
        this.buffer.push(...this.stringToBytes("Rs."));
      } else if (code < 128) {
        this.buffer.push(code);
      } else {
        this.buffer.push(0x3f); // '?' for unencodable chars
      }
    }
    return this;
  }

  private stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i));
    }
    return bytes;
  }

  newLine(count: number = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  line(text: string): this {
    this.text(text);
    this.newLine();
    return this;
  }

  divider(char: string = "-"): this {
    this.alignLeft();
    this.line(char.repeat(this.lineWidth));
    return this;
  }

  twoColumnRow(left: string, right: string): this {
    const available = this.lineWidth - right.length;
    let formattedLeft = left;
    if (formattedLeft.length > available - 1) {
      formattedLeft = formattedLeft.substring(0, available - 2) + "…";
    }
    const spaces = " ".repeat(
      Math.max(1, this.lineWidth - formattedLeft.length - right.length),
    );
    this.alignLeft();
    this.line(formattedLeft + spaces + right);
    return this;
  }

  itemRow(name: string, qty: number, price: number, total: number): this {
    // Format: "Item Name" on first line if long
    // Next line: "  {qty} x Rs.{price}    Rs.{total}"
    this.alignLeft();
    this.line(name);
    const qtyPrice = `  ${qty} x ${price.toFixed(2)}`;
    const totalStr = `Rs.${total.toFixed(2)}`;
    this.twoColumnRow(qtyPrice, totalStr);
    return this;
  }

  feedAndCut(): this {
    this.newLine(4);
    // GS V 66 0 (Cut paper)
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export function generateEscPosReceipt(
  sale: SaleDetail,
  settings: ShopSettings,
): Uint8Array {
  const builder = new EscPosBuilder(settings.paper_width);

  // Shop Header
  builder
    .alignCenter()
    .doubleSize(true)
    .bold(true)
    .line(settings.shop_name)
    .doubleSize(false)
    .bold(false);

  if (settings.tagline) {
    builder.line(settings.tagline);
  }
  if (settings.address) {
    builder.line(settings.address);
  }
  if (settings.phone) {
    builder.line(`Ph: ${settings.phone}`);
  }
  if (settings.gstin) {
    builder.line(`GSTIN: ${settings.gstin}`);
  }

  builder.divider("=");

  // Bill Metadata
  builder
    .twoColumnRow(
      `Bill: ${sale.bill_number}`,
      sale.sale_date ? sale.sale_date.substring(0, 16) : "",
    )
    .twoColumnRow(
      `Cust: ${sale.customer_name || "Walk-in"}`,
      `Mode: ${sale.payment_mode.toUpperCase()}`,
    )
    .divider("-");

  // Item List
  for (const it of sale.items) {
    builder.itemRow(
      it.product_name_snapshot,
      it.qty,
      it.selling_price_at_sale,
      it.line_total,
    );
  }

  builder.divider("-");

  // Totals
  builder
    .twoColumnRow("Subtotal:", `Rs.${sale.subtotal.toFixed(2)}`)
    .twoColumnRow("GST Total:", `Rs.${sale.gst_total.toFixed(2)}`);

  if (sale.discount > 0) {
    builder.twoColumnRow("Discount:", `-Rs.${sale.discount.toFixed(2)}`);
  }

  builder
    .divider("=")
    .bold(true)
    .twoColumnRow("GRAND TOTAL:", `Rs.${sale.grand_total.toFixed(2)}`)
    .bold(false)
    .divider("-");

  // Payment Breakdown
  if (sale.payment_mode === "split" && sale.payment_split_details) {
    try {
      const split = JSON.parse(sale.payment_split_details);
      let splitStr = "Split: ";
      if (split.cash) splitStr += `Cash ₹${split.cash} `;
      if (split.upi) splitStr += `UPI ₹${split.upi} `;
      if (split.card) splitStr += `Card ₹${split.card}`;
      builder.alignLeft().line(splitStr);
    } catch {
      // ignore json parse error
    }
  }

  // Footer
  builder.newLine(1).alignCenter();
  if (settings.receipt_footer) {
    const lines = settings.receipt_footer.split("\n");
    for (const l of lines) {
      builder.line(l);
    }
  } else {
    builder.line("Thank you! Visit again.");
  }

  builder.feedAndCut();
  return builder.getBytes();
}
