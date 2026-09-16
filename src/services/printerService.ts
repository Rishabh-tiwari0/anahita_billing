import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { SaleDetail } from "../repositories/salesRepository";
import { ShopSettings } from "../database/types";
import { generateEscPosReceipt } from "./escpos";
import { buildReceiptHtml } from "./receiptHtml";

export { buildReceiptHtml };

export const printerService = {
  async printReceipt(sale: SaleDetail, settings: ShopSettings): Promise<void> {
    const html = buildReceiptHtml(sale, settings);
    await Print.printAsync({ html });
  },

  async shareReceiptPdf(
    sale: SaleDetail,
    settings: ShopSettings,
  ): Promise<void> {
    const html = buildReceiptHtml(sale, settings);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: `Share Bill ${sale.bill_number}`,
      });
    } else {
      throw new Error("Sharing is not supported on this device platform.");
    }
  },

  getEscPosBytes(sale: SaleDetail, settings: ShopSettings): Uint8Array {
    return generateEscPosReceipt(sale, settings);
  },

  async testPrint(settings: ShopSettings): Promise<void> {
    const dummySale: SaleDetail = {
      id: 999,
      bill_number: "INV-TEST",
      sale_date: new Date().toISOString().replace("T", " ").substring(0, 19),
      customer_name: "Test Customer",
      payment_mode: "cash",
      payment_split_details: null,
      subtotal: 100.0,
      gst_total: 12.0,
      discount: 0,
      grand_total: 112.0,
      items: [
        {
          id: 1,
          sale_id: 999,
          product_id: 1,
          product_name_snapshot: "Sample Notebook (172 pgs)",
          qty: 1,
          cost_price_at_sale: 50.0,
          selling_price_at_sale: 70.0,
          gst_rate_at_sale: 0,
          line_total: 70.0,
        },
        {
          id: 2,
          sale_id: 999,
          product_id: 2,
          product_name_snapshot: "Sample Ball Pen (Blue)",
          qty: 2,
          cost_price_at_sale: 15.0,
          selling_price_at_sale: 21.0,
          gst_rate_at_sale: 18,
          line_total: 42.0,
        },
      ],
    };
    await this.printReceipt(dummySale, settings);
  },
};
