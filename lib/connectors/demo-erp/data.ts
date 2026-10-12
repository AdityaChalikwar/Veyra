/**
 * The Demo ERP's data: Northwind Home, an online home-goods retailer, from
 * 1 Oct 2025 to 30 Sep 2026. Generated in code from a fixed seed, so every
 * workspace sees the same numbers and nothing needs storing.
 *
 * Field names follow ERP habits (SalesDoc, MatNo, VendorName…), not Veyra's,
 * so mapping fields is a real step. Stories hidden in the data for analysis
 * to find:
 *  - Kitchen products switched supplier (Hartwell Ceramics → Quanta Homewares)
 *    on 1 Jun 2026: cheaper, slower to arrive, and Kitchen returns roughly
 *    triple from July, mostly DEFECTIVE and DAMAGED.
 *  - Kitchen orders fall about a fifth from August.
 *  - Bedding runs out of stock through August; Bedding sales dip, then recover.
 *  - November–December peak.
 *  - A few rows are deliberately broken (missing product, zero quantity) so
 *    validation has something to catch.
 */

export const DEMO_START = "2025-10-01";
export const DEMO_END = "2026-09-30";

type Row = Record<string, string>;

export type DemoErpData = {
  customers: Row[];
  products: Row[];
  orders: Row[];
  inventory: Row[];
  purchases: Row[];
  returns: Row[];
  invoices: Row[];
};

/* ── Deterministic randomness ───────────────────────────────────────── */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => toIso(toTime(iso) + n * DAY);
const money = (n: number) => n.toFixed(2);

/* ── Reference data ─────────────────────────────────────────────────── */

const CATEGORIES = ["Kitchen", "Bedding", "Bath", "Living", "Lighting"] as const;
type Category = (typeof CATEGORIES)[number];

const PRODUCT_NAMES: Record<Category, string[]> = {
  Kitchen: ["Stoneware Dinner Plate Set", "Ceramic Mixing Bowls", "Enamel Casserole Dish", "Glazed Mug Set", "Porcelain Serving Platter", "Ceramic Pasta Bowls", "Stoneware Baking Dish", "Ceramic Teapot", "Salad Bowl Set", "Espresso Cup Set", "Butter Dish", "Ceramic Utensil Jar"],
  Bedding: ["Linen Duvet Cover", "Cotton Sheet Set", "Down Alternative Pillow", "Wool Throw Blanket", "Quilted Bedspread", "Flannel Sheet Set", "Silk Pillowcase", "Weighted Blanket", "Mattress Protector", "Waffle Duvet Cover", "Percale Sheet Set", "Velvet Cushion Cover"],
  Bath: ["Turkish Bath Towel", "Waffle Hand Towels", "Bath Mat", "Shower Curtain", "Bamboo Bath Caddy", "Ceramic Soap Dish", "Hooded Bathrobe", "Towel Bale Set", "Toothbrush Holder", "Cotton Wash Cloths", "Bath Sheet", "Laundry Hamper"],
  Living: ["Wool Area Rug", "Linen Cushion", "Oak Side Table", "Rattan Basket", "Wall Mirror", "Ceramic Vase", "Bookshelf Tray", "Jute Rug", "Throw Pillow Set", "Candle Holder Set", "Woven Wall Hanging", "Plant Pot Set"],
  Lighting: ["Linen Table Lamp", "Brass Floor Lamp", "Rattan Pendant Shade", "Ceramic Lamp Base", "LED Reading Light", "Glass Globe Pendant", "Wall Sconce", "String Lights", "Desk Lamp", "Paper Lantern", "Dimmable Bulb Pack", "Lamp Shade"],
};
const VENDORS: Record<Category, string> = {
  Kitchen: "Hartwell Ceramics",
  Bedding: "Loomworks Textiles",
  Bath: "Loomworks Textiles",
  Living: "Oakline Interiors",
  Lighting: "Brightform Lighting",
};
const NEW_KITCHEN_VENDOR = "Quanta Homewares";
const SUPPLIER_SWITCH = "2026-06-01";
const KITCHEN_DROP_FROM = "2026-08-01";
const BEDDING_STOCKOUT = { from: "2026-08-03", to: "2026-08-30" };
const RETURNS_SPIKE_FROM = "2026-07-01";

const FIRST = ["Olivia", "Liam", "Amelia", "Noah", "Isla", "Arjun", "Mia", "Leo", "Ava", "Oscar", "Zara", "Ethan", "Sofia", "Lucas", "Priya", "Jack", "Emily", "Aiden", "Grace", "Mateo"];
const LAST = ["Smith", "Patel", "Jones", "Chen", "Williams", "Garcia", "Brown", "Khan", "Taylor", "Murphy", "Wilson", "Singh", "Davies", "Novak", "Evans", "Rossi", "Clarke", "Kim", "Lewis", "Silva"];
const REGIONS = ["North", "South", "East", "West"];
const CHANNELS = ["Web", "App", "Marketplace"];

/* ── Generation ─────────────────────────────────────────────────────── */

let cached: DemoErpData | null = null;

/** All Demo ERP datasets. Built once per server process. */
export function demoErpData(): DemoErpData {
  cached ??= generate();
  return cached;
}

function generate(): DemoErpData {
  const r = rng(20261001);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(r() * list.length)];
  const between = (min: number, max: number) => min + r() * (max - min);
  const int = (min: number, max: number) => Math.floor(between(min, max + 1));

  // Products
  type Product = { no: string; name: string; category: Category; price: number; cost: number };
  const products: Product[] = [];
  CATEGORIES.forEach((category, ci) => {
    PRODUCT_NAMES[category].forEach((name, i) => {
      const price = Math.round(between(category === "Living" ? 35 : 15, category === "Living" ? 260 : 120)) - 0.01;
      products.push({ no: `M-${ci + 1}${String(i + 1).padStart(3, "0")}`, name, category, price, cost: Math.round(price * between(0.38, 0.52) * 100) / 100 });
    });
  });

  // Customers: created from Jan 2024 to the end of the period.
  type Customer = { no: string; name: string; email: string; created: string; group: string; region: string };
  const customers: Customer[] = [];
  const custStart = toTime("2024-01-01");
  const custSpan = toTime(DEMO_END) - custStart;
  for (let i = 0; i < 1600; i++) {
    const first = pick(FIRST);
    const last = pick(LAST);
    customers.push({
      no: `C${String(100001 + i)}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${i}@example.com`.toLowerCase(),
      created: toIso(custStart + Math.floor(Math.pow(r(), 0.8) * custSpan)),
      group: r() < 0.12 ? "Trade" : "Consumer",
      region: pick(REGIONS),
    });
  }
  customers.sort((a, b) => a.created.localeCompare(b.created));

  const seasonal = (iso: string) => {
    const m = Number(iso.slice(5, 7));
    return m === 11 ? 1.45 : m === 12 ? 1.6 : m === 1 ? 0.85 : m === 2 ? 0.9 : 1;
  };
  const categoryWeight = (c: Category, iso: string) => {
    let w = c === "Kitchen" ? 1.3 : c === "Bedding" ? 1.1 : 1;
    if (c === "Kitchen" && iso >= KITCHEN_DROP_FROM) w *= 0.78;
    if (c === "Bedding" && iso >= BEDDING_STOCKOUT.from && iso <= BEDDING_STOCKOUT.to) w *= 0.3;
    return w;
  };
  const pickProduct = (iso: string) => {
    const weights = CATEGORIES.map((c) => categoryWeight(c, iso));
    let x = r() * weights.reduce((a, b) => a + b, 0);
    let category: Category = CATEGORIES[0];
    for (let i = 0; i < CATEGORIES.length; i++) {
      x -= weights[i];
      if (x <= 0) {
        category = CATEGORIES[i];
        break;
      }
    }
    return pick(products.filter((p) => p.category === category));
  };

  // Orders (one row per order line), invoices and returns.
  const orders: Row[] = [];
  const invoices: Row[] = [];
  const returns: Row[] = [];
  let doc = 4500000;
  let rma = 70001;
  let billing = 9000001;
  for (let t = toTime(DEMO_START); t <= toTime(DEMO_END); t += DAY) {
    const iso = toIso(t);
    const weekday = new Date(t).getUTCDay();
    const daily = 26 * seasonal(iso) * (weekday === 0 || weekday === 6 ? 1.15 : 1) * between(0.85, 1.15);
    const eligible = customers.filter((c) => c.created <= iso);
    for (let n = 0; n < Math.round(daily); n++) {
      const customer = eligible[Math.floor(Math.pow(r(), 0.7) * eligible.length)];
      const salesDoc = String(doc++);
      const channel = r() < 0.55 ? "Web" : r() < 0.7 ? "App" : "Marketplace";
      let docValue = 0;
      const lines = r() < 0.55 ? 1 : r() < 0.75 ? 2 : 3;
      for (let l = 1; l <= lines; l++) {
        const product = pickProduct(iso);
        const qty = r() < 0.85 ? 1 : int(2, 4);
        const price = product.price * (customer.group === "Trade" ? 0.85 : 1);
        const value = qty * price;
        docValue += value;
        orders.push({
          SalesDoc: salesDoc,
          ItemNo: String(l * 10),
          DocDate: iso,
          CustNo: r() < 0.004 ? "" : customer.no,
          MatNo: product.no,
          OrderQty: r() < 0.0015 ? "0" : String(qty),
          NetPrice: money(price),
          NetValue: money(value),
          Channel: channel === "Web" ? "Web" : pick(CHANNELS),
        });

        // Returns: higher for Kitchen goods sold after the supplier switch reached stock.
        const kitchenSpike = product.category === "Kitchen" && iso >= RETURNS_SPIKE_FROM;
        const rate = kitchenSpike ? 0.115 : product.category === "Living" ? 0.045 : 0.035;
        if (r() < rate) {
          const returnDate = addDays(iso, int(4, 24));
          if (returnDate <= DEMO_END) {
            const reason = kitchenSpike
              ? r() < 0.48 ? "DEFECTIVE" : r() < 0.6 ? "DAMAGED" : pick(["NOT_AS_DESCRIBED", "CHANGED_MIND", "LATE"])
              : r() < 0.45 ? "CHANGED_MIND" : pick(["DAMAGED", "NOT_AS_DESCRIBED", "DEFECTIVE", "LATE", "CHANGED_MIND"]);
            returns.push({
              RMANo: `R${rma++}`,
              SalesDoc: salesDoc,
              MatNo: r() < 0.01 ? "" : product.no,
              ReturnDate: returnDate,
              ReasonCode: reason,
              RetQty: String(qty),
              RefundAmt: money(value),
            });
          }
        }
      }

      const terms = customer.group === "Trade" ? 30 : 0;
      const due = addDays(iso, terms);
      const overdue = customer.group === "Trade" && r() < 0.09;
      const cleared = overdue ? "" : addDays(iso, terms ? int(10, 34) : 0);
      const status = cleared && cleared <= DEMO_END ? "Paid" : due < DEMO_END ? "Overdue" : "Open";
      invoices.push({
        BillingDoc: String(billing++),
        SalesDoc: salesDoc,
        CustNo: customer.no,
        BillingDate: iso,
        DueDate: due,
        ClearingDate: status === "Paid" ? cleared : "",
        GrossAmt: money(docValue * 1.2),
        Status: status,
      });
    }
  }

  // Purchases: a replenishment order per product every month.
  const purchases: Row[] = [];
  let po = 4100001;
  for (const p of products) {
    for (let m = 0; m < 12; m++) {
      const date = addDays(DEMO_START, m * 30 + int(0, 6));
      const switched = p.category === "Kitchen" && date >= SUPPLIER_SWITCH;
      const vendor = switched ? NEW_KITCHEN_VENDOR : VENDORS[p.category];
      const lead = switched ? int(21, 35) : int(8, 14);
      const received = addDays(date, lead);
      purchases.push({
        PONumber: String(po++),
        VendorName: vendor,
        MatNo: p.no,
        PODate: date,
        GRDate: received <= DEMO_END ? received : "",
        POQty: String(int(60, 180)),
        UnitCost: money(switched ? p.cost * 0.82 : p.cost),
      });
    }
  }

  // Inventory: stock on hand per product each Monday.
  const inventory: Row[] = [];
  for (const p of products) {
    for (let t = toTime("2025-10-06"); t <= toTime(DEMO_END); t += 7 * DAY) {
      const iso = toIso(t);
      const out = p.category === "Bedding" && iso >= BEDDING_STOCKOUT.from && iso <= BEDDING_STOCKOUT.to && r() < 0.8;
      inventory.push({ MatNo: p.no, StockDate: iso, UnrestrictedQty: String(out ? 0 : int(15, 240)), ReorderPoint: "40" });
    }
  }

  return {
    customers: customers.map((c) => ({ CustNo: c.no, CustName: c.name, EmailAddr: c.email, CreatedOn: c.created, CustGroup: c.group, Region: c.region })),
    // Master data shows the current supplier.
    products: products.map((p) => ({ MatNo: p.no, MatDesc: p.name, ProdHier: p.category, VendorName: p.category === "Kitchen" ? NEW_KITCHEN_VENDOR : VENDORS[p.category], ListPrice: money(p.price), StdCost: money(p.cost) })),
    orders,
    inventory,
    purchases,
    returns,
    invoices,
  };
}
