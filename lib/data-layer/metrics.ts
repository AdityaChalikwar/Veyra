import type { EntityKey } from "./canonical";
import type { NormalizedRow } from "./normalize";

/**
 * The metrics layer: standard calculations per business entity, worked out in
 * code from normalized rows. These are what the analysis reads — trends by
 * month, breakdowns, rates — so the AI never has to calculate anything.
 * Metrics that need two datasets (e.g. return rate = returns ÷ units sold)
 * are computed when both were synced together.
 */

export type Metric = {
  id: string;
  title: string;
  /** What each value means, e.g. "orders", "£ revenue", "% of units returned". */
  unit: string;
  columns: string[];
  rows: (string | number)[][];
  note?: string;
};

type Sets = Partial<Record<EntityKey, NormalizedRow[]>>;

const month = (d: unknown) => (typeof d === "string" ? d.slice(0, 7) : null);
const num = (v: unknown) => (typeof v === "number" ? v : 0);
const round = (n: number, dp = 0) => Math.round(n * 10 ** dp) / 10 ** dp;
const MAX_CATEGORIES = 8;

/** Sum of `value` per key, sorted by key. */
function groupSum(rows: NormalizedRow[], key: (r: NormalizedRow) => string | null, value: (r: NormalizedRow) => number) {
  const out = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    if (k) out.set(k, (out.get(k) ?? 0) + value(r));
  }
  return new Map([...out].sort((a, b) => a[0].localeCompare(b[0])));
}

/** Count of distinct `id` per key. */
function groupDistinct(rows: NormalizedRow[], key: (r: NormalizedRow) => string | null, id: (r: NormalizedRow) => unknown) {
  const out = new Map<string, Set<unknown>>();
  for (const r of rows) {
    const k = key(r);
    if (k) (out.get(k) ?? out.set(k, new Set()).get(k)!).add(id(r));
  }
  return new Map([...out].sort((a, b) => a[0].localeCompare(b[0])).map(([k, s]) => [k, s.size]));
}

/** month × category table, keeping the largest categories. */
function monthBy(rows: NormalizedRow[], dateKey: string, cat: (r: NormalizedRow) => string | null, value: (r: NormalizedRow) => number, dp = 0) {
  const totals = groupSum(rows, cat, value);
  const cats = [...totals].sort((a, b) => b[1] - a[1]).slice(0, MAX_CATEGORIES).map(([c]) => c).sort();
  const cells = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const m = month(r[dateKey]);
    const c = cat(r);
    if (!m || !c || !cats.includes(c)) continue;
    const row = cells.get(m) ?? cells.set(m, new Map()).get(m)!;
    row.set(c, (row.get(c) ?? 0) + value(r));
  }
  const months = [...cells.keys()].sort();
  return { columns: ["Month", ...cats], rows: months.map((m) => [m, ...cats.map((c) => round(cells.get(m)!.get(c) ?? 0, dp))]) };
}

const breakdown = (map: Map<string, number>, dp = 0) =>
  [...map].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => [k, round(v, dp)] as (string | number)[]);

export function computeMetrics(entity: EntityKey, sets: Sets): Metric[] {
  const rows = sets[entity] ?? [];
  const products = new Map((sets.products ?? []).map((p) => [String(p.product_id), p]));
  const categoryOf = (r: NormalizedRow) => (products.get(String(r.product_id))?.category as string | null) ?? null;
  const out: Metric[] = [];

  switch (entity) {
    case "orders": {
      const orders = groupDistinct(rows, (r) => month(r.order_date), (r) => r.order_id);
      const revenue = groupSum(rows, (r) => month(r.order_date), (r) => num(r.amount));
      const units = groupSum(rows, (r) => month(r.order_date), (r) => num(r.quantity));
      out.push({
        id: "orders-by-month",
        title: "Orders, units and revenue by month",
        unit: "orders / units / revenue",
        columns: ["Month", "Orders", "Units", "Revenue"],
        rows: [...orders.keys()].map((m) => [m, orders.get(m) ?? 0, units.get(m) ?? 0, round(revenue.get(m) ?? 0)]),
      });
      if (rows.some((r) => r.channel)) {
        out.push({ id: "revenue-by-channel", title: "Revenue by channel", unit: "revenue", columns: ["Channel", "Revenue"], rows: breakdown(groupSum(rows, (r) => (r.channel as string) ?? null, (r) => num(r.amount))) });
      }
      if (products.size) {
        out.push({ id: "units-by-category-month", title: "Units sold by product category and month", unit: "units", ...monthBy(rows, "order_date", categoryOf, (r) => num(r.quantity)) });
      }
      break;
    }
    case "returns": {
      const count = groupSum(rows, (r) => month(r.return_date), (r) => num(r.quantity));
      const refunds = groupSum(rows, (r) => month(r.return_date), (r) => num(r.refund_amount));
      out.push({
        id: "returns-by-month",
        title: "Units returned and refunds by month",
        unit: "units / refunds",
        columns: ["Month", "Units returned", "Refunds"],
        rows: [...count.keys()].map((m) => [m, count.get(m) ?? 0, round(refunds.get(m) ?? 0)]),
      });
      if (rows.some((r) => r.reason)) {
        out.push({ id: "returns-by-reason", title: "Units returned by reason", unit: "units", columns: ["Reason", "Units"], rows: breakdown(groupSum(rows, (r) => (r.reason as string) ?? null, (r) => num(r.quantity))) });
      }
      if (products.size) {
        out.push({ id: "returns-by-category-month", title: "Units returned by product category and month", unit: "units", ...monthBy(rows, "return_date", categoryOf, (r) => num(r.quantity)) });
        if (rows.some((r) => r.reason)) {
          out.push({
            id: "returns-by-category-reason",
            title: "Units returned by product category and reason",
            unit: "units",
            columns: ["Category / reason", "Units"],
            rows: breakdown(groupSum(rows, (r) => (categoryOf(r) && r.reason ? `${categoryOf(r)} / ${r.reason}` : null), (r) => num(r.quantity))),
          });
        }
        if (sets.orders?.length) {
          const sold = monthBy(sets.orders, "order_date", categoryOf, (r) => num(r.quantity));
          const returned = monthBy(rows, "return_date", categoryOf, (r) => num(r.quantity));
          const cats = sold.columns.slice(1).filter((c) => returned.columns.includes(c));
          out.push({
            id: "return-rate-by-category-month",
            title: "Return rate by product category and month (units returned that month ÷ units sold that month)",
            unit: "% of units",
            columns: ["Month", ...cats],
            rows: sold.rows.map((sr) => {
              const m = sr[0];
              const rr = returned.rows.find((x) => x[0] === m);
              return [m, ...cats.map((c) => {
                const s = Number(sr[sold.columns.indexOf(c)]);
                const r = rr ? Number(rr[returned.columns.indexOf(c)]) : 0;
                return s ? round((r / s) * 100, 1) : 0;
              })];
            }),
            note: "Returns are counted in the month they came back, so a month's rate includes returns of goods sold the month before.",
          });
        }
      }
      break;
    }
    case "inventory": {
      const outs = rows.filter((r) => num(r.on_hand) <= 0);
      out.push({
        id: "stockouts-by-month",
        title: "Out-of-stock product checks by month (product × stock date with nothing on hand)",
        unit: "stock-outs",
        columns: ["Month", "Stock-outs", "Checks"],
        rows: [...groupSum(rows, (r) => month(r.date), () => 1)].map(([m, n]) => [m, outs.filter((r) => month(r.date) === m).length, n]),
      });
      if (products.size) out.push({ id: "stockouts-by-category-month", title: "Stock-outs by product category and month", unit: "stock-outs", ...monthBy(outs, "date", categoryOf, () => 1) });
      break;
    }
    case "purchases": {
      out.push({ id: "po-units-by-supplier-month", title: "Units ordered from each supplier by month", unit: "units", ...monthBy(rows, "order_date", (r) => (r.supplier as string) ?? null, (r) => num(r.quantity)) });
      const lead = new Map<string, number[]>();
      const cost = new Map<string, number[]>();
      for (const r of rows) {
        const s = r.supplier as string;
        if (typeof r.received_date === "string" && typeof r.order_date === "string") {
          (lead.get(s) ?? lead.set(s, []).get(s)!).push((Date.parse(r.received_date) - Date.parse(r.order_date)) / 86_400_000);
        }
        if (typeof r.unit_cost === "number") (cost.get(s) ?? cost.set(s, []).get(s)!).push(r.unit_cost);
      }
      const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
      out.push({
        id: "supplier-lead-time",
        title: "Average days from purchase order to goods received, by supplier",
        unit: "days",
        columns: ["Supplier", "Average days", "Orders received"],
        rows: [...lead].map(([s, xs]) => [s, round(avg(xs), 1), xs.length]),
      });
      if (cost.size) out.push({ id: "supplier-unit-cost", title: "Average unit cost by supplier", unit: "cost", columns: ["Supplier", "Average unit cost"], rows: [...cost].map(([s, xs]) => [s, round(avg(xs), 2)]) });
      if (products.size) {
        out.push({
          id: "po-first-last-by-category",
          title: "Supplier used per product category, with first and last order date",
          unit: "dates",
          columns: ["Category / supplier", "First order", "Last order", "Orders"],
          rows: [...groupDistinct(rows, (r) => (categoryOf(r) ? `${categoryOf(r)} / ${r.supplier}` : null), (r) => r.po_id)].map(([k, n]) => {
            const ds = rows.filter((r) => `${categoryOf(r)} / ${r.supplier}` === k).map((r) => r.order_date as string).sort();
            return [k, ds[0], ds[ds.length - 1], n];
          }),
        });
      }
      break;
    }
    case "invoices": {
      out.push({
        id: "invoiced-by-month",
        title: "Invoiced amount by month",
        unit: "amount",
        columns: ["Month", "Invoices", "Amount"],
        rows: [...groupSum(rows, (r) => month(r.invoice_date), () => 1)].map(([m, n]) => [m, n, round(rows.filter((r) => month(r.invoice_date) === m).reduce((a, r) => a + num(r.amount), 0))]),
      });
      if (rows.some((r) => r.status)) out.push({ id: "invoices-by-status", title: "Invoices by payment status", unit: "invoices", columns: ["Status", "Invoices"], rows: breakdown(groupSum(rows, (r) => (r.status as string) ?? null, () => 1)) });
      break;
    }
    case "customers": {
      out.push({ id: "new-customers-by-month", title: "New customers by month", unit: "customers", columns: ["Month", "New customers"], rows: [...groupSum(rows, (r) => month(r.created_at), () => 1)].slice(-24) });
      if (rows.some((r) => r.segment)) out.push({ id: "customers-by-segment", title: "Customers by segment", unit: "customers", columns: ["Segment", "Customers"], rows: breakdown(groupSum(rows, (r) => (r.segment as string) ?? null, () => 1)) });
      if (rows.some((r) => r.region)) out.push({ id: "customers-by-region", title: "Customers by region", unit: "customers", columns: ["Region", "Customers"], rows: breakdown(groupSum(rows, (r) => (r.region as string) ?? null, () => 1)) });
      break;
    }
    case "products": {
      out.push({ id: "products-by-category", title: "Products by category", unit: "products", columns: ["Category", "Products"], rows: breakdown(groupSum(rows, (r) => (r.category as string) ?? null, () => 1)) });
      if (rows.some((r) => r.supplier)) out.push({ id: "products-by-supplier", title: "Products by current supplier", unit: "products", columns: ["Supplier", "Products"], rows: breakdown(groupSum(rows, (r) => (r.supplier as string) ?? null, () => 1)) });
      break;
    }
  }
  return out.filter((m) => m.rows.length > 0);
}
