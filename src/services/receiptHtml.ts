import { SaleDetail } from "../repositories/salesRepository";
import { ShopSettings } from "../database/types";

export function buildReceiptHtml(
  sale: SaleDetail,
  settings: ShopSettings,
): string {
  const paperWidthMm = settings.paper_width === "80mm" ? 80 : 58;
  const is58mm = paperWidthMm === 58;

  let splitInfoHtml = "";
  if (sale.payment_mode === "split" && sale.payment_split_details) {
    try {
      const split = JSON.parse(sale.payment_split_details);
      splitInfoHtml = `
        <div style="font-size: 11px; margin-top: 4px; padding: 4px; background: #f4f4f4; border-radius: 4px;">
          <strong>Split Breakdown:</strong><br/>
          ${split.cash ? `Cash: ₹${Number(split.cash).toFixed(2)} &nbsp; ` : ""}
          ${split.upi ? `UPI: ₹${Number(split.upi).toFixed(2)} &nbsp; ` : ""}
          ${split.card ? `Card: ₹${Number(split.card).toFixed(2)}` : ""}
        </div>
      `;
    } catch {
      // ignore
    }
  }

  const itemsHtml = sale.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px dashed #bbb;">
        <td style="padding: 4px 0; font-weight: 500;">
          ${item.product_name_snapshot}
          <div style="font-size: 10px; color: #555;">
            ${item.qty} × ₹${item.selling_price_at_sale.toFixed(2)} ${
              item.gst_rate_at_sale > 0 ? `(GST ${item.gst_rate_at_sale}%)` : ""
            }
          </div>
        </td>
        <td style="padding: 4px 0; text-align: right; vertical-align: top; white-space: nowrap;">
          ₹${item.line_total.toFixed(2)}
        </td>
      </tr>
    `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page {
            size: ${paperWidthMm}mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            margin: 0;
            padding: ${is58mm ? "10px 8px" : "16px 12px"};
            width: ${paperWidthMm}mm;
            box-sizing: border-box;
            background: #fff;
            color: #111;
            font-size: ${is58mm ? "12px" : "13px"};
            line-height: 1.35;
          }
          .center { text-align: center; }
          .shop-title {
            font-size: ${is58mm ? "15px" : "18px"};
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .shop-sub {
            font-size: 11px;
            color: #333;
            margin-bottom: 2px;
          }
          .divider {
            border-top: 1px dashed #333;
            margin: 6px 0;
          }
          .double-divider {
            border-top: 2px solid #222;
            margin: 8px 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-bottom: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 4px 0;
          }
          th {
            font-size: 11px;
            text-transform: uppercase;
            border-bottom: 1px solid #333;
            padding-bottom: 3px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .grand-total {
            font-size: ${is58mm ? "14px" : "16px"};
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            margin: 6px 0;
          }
          .footer {
            font-size: 11px;
            text-align: center;
            margin-top: 10px;
            white-space: pre-line;
            color: #444;
          }
          .barcode-line {
            text-align: center;
            font-size: 10px;
            letter-spacing: 3px;
            margin-top: 8px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="shop-title">${settings.shop_name}</div>
          ${settings.tagline ? `<div class="shop-sub">${settings.tagline}</div>` : ""}
          ${settings.address ? `<div class="shop-sub">${settings.address}</div>` : ""}
          ${settings.phone ? `<div class="shop-sub">Ph: ${settings.phone}</div>` : ""}
          ${settings.gstin ? `<div class="shop-sub"><strong>GSTIN:</strong> ${settings.gstin}</div>` : ""}
        </div>

        <div class="double-divider"></div>

        <div class="meta-row">
          <span><strong>Bill No:</strong> ${sale.bill_number}</span>
          <span>${sale.sale_date ? sale.sale_date.substring(0, 16) : ""}</span>
        </div>
        <div class="meta-row">
          <span><strong>Cust:</strong> ${sale.customer_name || "Walk-in"}</span>
          <span><strong>Mode:</strong> ${sale.payment_mode.toUpperCase()}</span>
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item Description</th>
              <th style="text-align: right;">Amt (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="total-row">
          <span>Item Subtotal:</span>
          <span>₹${sale.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>GST (CGST + SGST):</span>
          <span>₹${sale.gst_total.toFixed(2)}</span>
        </div>
        ${
          sale.discount > 0
            ? `<div class="total-row" style="color: #c00;">
                 <span>Discount:</span>
                 <span>-₹${sale.discount.toFixed(2)}</span>
               </div>`
            : ""
        }

        <div class="double-divider"></div>

        <div class="grand-total">
          <span>NET PAYABLE:</span>
          <span>₹${sale.grand_total.toFixed(2)}</span>
        </div>

        ${splitInfoHtml}

        <div class="divider"></div>

        <div class="footer">
          ${settings.receipt_footer || "Thank you for shopping with us!"}
        </div>

        <div class="barcode-line">
          * ${sale.bill_number} *
        </div>
      </body>
    </html>
  `;
}
