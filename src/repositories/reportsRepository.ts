import { getDb } from "../database";
import { Sale } from "../database/types";

export interface MonthlySalesSummary {
  yearMonth: string;
  totalRevenue: number;
  totalBills: number;
  totalItemsSold: number;
  averageBillValue: number;
  paymentBreakdown: {
    cash: number;
    upi: number;
    card: number;
    split: number;
  };
  topSellingProducts: {
    productId: number;
    productName: string;
    totalQty: number;
    totalRevenue: number;
  }[];
  sales: Sale[];
}

export interface CategoryProfit {
  category: string;
  itemsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

export interface MonthlyProfitSummary {
  yearMonth: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMarginPercent: number;
  categoryProfits: CategoryProfit[];
  topProfitableProducts: {
    productId: number;
    productName: string;
    totalQty: number;
    totalProfit: number;
    profitMarginPercent: number;
  }[];
}

export const reportsRepository = {
  async getMonthlySalesSummary(
    yearMonth: string,
  ): Promise<MonthlySalesSummary> {
    const db = await getDb();
    const monthPattern = `${yearMonth}%`;

    // 1. Overall sales aggregates
    const totals = await db.getFirstAsync<{
      total_revenue: number | null;
      total_bills: number | null;
    }>(
      `SELECT
         COALESCE(SUM(grand_total), 0) as total_revenue,
         COUNT(*) as total_bills
       FROM sales
       WHERE sale_date LIKE ?;`,
      [monthPattern],
    );

    const totalRevenue = totals?.total_revenue ?? 0;
    const totalBills = totals?.total_bills ?? 0;
    const averageBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;

    // 2. Items sold count
    const itemsCount = await db.getFirstAsync<{ total_qty: number | null }>(
      `SELECT COALESCE(SUM(si.qty), 0) as total_qty
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE s.sale_date LIKE ?;`,
      [monthPattern],
    );
    const totalItemsSold = itemsCount?.total_qty ?? 0;

    // 3. Breakdown by payment mode
    const paymentRows = await db.getAllAsync<{
      payment_mode: string;
      mode_total: number;
    }>(
      `SELECT payment_mode, COALESCE(SUM(grand_total), 0) as mode_total
       FROM sales
       WHERE sale_date LIKE ?
       GROUP BY payment_mode;`,
      [monthPattern],
    );

    const paymentBreakdown = { cash: 0, upi: 0, card: 0, split: 0 };
    for (const row of paymentRows) {
      if (row.payment_mode === "cash") paymentBreakdown.cash = row.mode_total;
      else if (row.payment_mode === "upi")
        paymentBreakdown.upi = row.mode_total;
      else if (row.payment_mode === "card")
        paymentBreakdown.card = row.mode_total;
      else if (row.payment_mode === "split")
        paymentBreakdown.split = row.mode_total;
    }

    // 4. Top selling products
    const topProducts = await db.getAllAsync<{
      product_id: number;
      product_name_snapshot: string;
      total_qty: number;
      total_revenue: number;
    }>(
      `SELECT
         si.product_id,
         si.product_name_snapshot,
         SUM(si.qty) as total_qty,
         SUM(si.line_total) as total_revenue
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE s.sale_date LIKE ?
       GROUP BY si.product_id, si.product_name_snapshot
       ORDER BY total_qty DESC
       LIMIT 10;`,
      [monthPattern],
    );

    const topSellingProducts = topProducts.map((tp) => ({
      productId: tp.product_id,
      productName: tp.product_name_snapshot,
      totalQty: tp.total_qty,
      totalRevenue: tp.total_revenue,
    }));

    // 5. Sales list for this month
    const sales = await db.getAllAsync<Sale>(
      `SELECT * FROM sales
       WHERE sale_date LIKE ?
       ORDER BY sale_date DESC, id DESC;`,
      [monthPattern],
    );

    return {
      yearMonth,
      totalRevenue,
      totalBills,
      totalItemsSold,
      averageBillValue,
      paymentBreakdown,
      topSellingProducts,
      sales,
    };
  },

  async getMonthlyProfitSummary(
    yearMonth: string,
  ): Promise<MonthlyProfitSummary> {
    const db = await getDb();
    const monthPattern = `${yearMonth}%`;

    // 1. Overall profit computation based strictly on sale_items snapshots
    const profitTotals = await db.getFirstAsync<{
      total_revenue: number | null;
      total_cost: number | null;
      total_profit: number | null;
    }>(
      `SELECT
         COALESCE(SUM(si.selling_price_at_sale * si.qty), 0) as total_revenue,
         COALESCE(SUM(si.cost_price_at_sale * si.qty), 0) as total_cost,
         COALESCE(SUM((si.selling_price_at_sale - si.cost_price_at_sale) * si.qty), 0) as total_profit
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE s.sale_date LIKE ?;`,
      [monthPattern],
    );

    const totalRevenue = profitTotals?.total_revenue ?? 0;
    const totalCost = profitTotals?.total_cost ?? 0;
    const totalProfit = profitTotals?.total_profit ?? 0;
    const profitMarginPercent =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // 2. Category-wise profit breakdown
    const categoryRows = await db.getAllAsync<{
      category: string;
      items_sold: number;
      revenue: number;
      cost: number;
      profit: number;
    }>(
      `SELECT
         COALESCE(p.category, 'General') as category,
         SUM(si.qty) as items_sold,
         SUM(si.selling_price_at_sale * si.qty) as revenue,
         SUM(si.cost_price_at_sale * si.qty) as cost,
         SUM((si.selling_price_at_sale - si.cost_price_at_sale) * si.qty) as profit
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       LEFT JOIN products p ON si.product_id = p.id
       WHERE s.sale_date LIKE ?
       GROUP BY COALESCE(p.category, 'General')
       ORDER BY profit DESC;`,
      [monthPattern],
    );

    const categoryProfits: CategoryProfit[] = categoryRows.map((cr) => ({
      category: cr.category,
      itemsSold: cr.items_sold,
      revenue: cr.revenue,
      cost: cr.cost,
      profit: cr.profit,
      marginPercent: cr.revenue > 0 ? (cr.profit / cr.revenue) * 100 : 0,
    }));

    // 3. Top profitable products
    const productProfitRows = await db.getAllAsync<{
      product_id: number;
      product_name_snapshot: string;
      total_qty: number;
      revenue: number;
      profit: number;
    }>(
      `SELECT
         si.product_id,
         si.product_name_snapshot,
         SUM(si.qty) as total_qty,
         SUM(si.selling_price_at_sale * si.qty) as revenue,
         SUM((si.selling_price_at_sale - si.cost_price_at_sale) * si.qty) as profit
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE s.sale_date LIKE ?
       GROUP BY si.product_id, si.product_name_snapshot
       ORDER BY profit DESC
       LIMIT 10;`,
      [monthPattern],
    );

    const topProfitableProducts = productProfitRows.map((pp) => ({
      productId: pp.product_id,
      productName: pp.product_name_snapshot,
      totalQty: pp.total_qty,
      totalProfit: pp.profit,
      profitMarginPercent: pp.revenue > 0 ? (pp.profit / pp.revenue) * 100 : 0,
    }));

    return {
      yearMonth,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMarginPercent,
      categoryProfits,
      topProfitableProducts,
    };
  },
};
