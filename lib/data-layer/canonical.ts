/**
 * Veyra's business data model: the small set of entities every connected
 * system is mapped onto. Investigations only ever see data in this shape,
 * whichever system it came from.
 */

export type FieldType = "id" | "text" | "category" | "date" | "number" | "money";

export type CanonicalField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Personal data: never shown to the AI; masked in previews. */
  personal?: boolean;
  /** A quantity that must be above zero. */
  positive?: boolean;
  /** Source field names that usually mean this field, compared without case or punctuation. */
  synonyms: string[];
};

export type EntityKey = "customers" | "products" | "orders" | "inventory" | "purchases" | "returns" | "invoices";

export type CanonicalEntity = {
  key: EntityKey;
  label: string;
  description: string;
  fields: CanonicalField[];
  /** The field that dates each row; gives the period a dataset covers. */
  dateField?: string;
  /** A field whose values must be unique (one row per thing). */
  uniqueField?: string;
};

const id = (key: string, label: string, synonyms: string[], required = true): CanonicalField => ({ key, label, type: "id", required, synonyms });

export const ENTITIES: CanonicalEntity[] = [
  {
    key: "customers",
    label: "Customers",
    description: "One row per customer.",
    dateField: "created_at",
    uniqueField: "customer_id",
    fields: [
      id("customer_id", "Customer ID", ["custno", "customerid", "customernumber", "customerno", "kunnr", "customer", "clientid"]),
      { key: "name", label: "Name", type: "text", personal: true, synonyms: ["custname", "customername", "name", "fullname"] },
      { key: "email", label: "Email", type: "text", personal: true, synonyms: ["emailaddr", "email", "emailaddress"] },
      { key: "created_at", label: "Customer since", type: "date", synonyms: ["createdon", "createdat", "signupdate", "since", "createddate", "firstorderdate"] },
      { key: "segment", label: "Segment", type: "category", synonyms: ["custgroup", "segment", "customergroup", "customertype", "type", "tier"] },
      { key: "region", label: "Region", type: "category", synonyms: ["region", "area", "country", "territory", "salesregion"] },
    ],
  },
  {
    key: "products",
    label: "Products",
    description: "One row per product.",
    uniqueField: "product_id",
    fields: [
      id("product_id", "Product ID", ["matno", "productid", "sku", "material", "materialnumber", "itemcode", "productcode", "itemno"]),
      { key: "name", label: "Product name", type: "text", required: true, synonyms: ["matdesc", "productname", "description", "name", "title"] },
      { key: "category", label: "Category", type: "category", synonyms: ["prodhier", "category", "productcategory", "productgroup", "group", "producthierarchy"] },
      { key: "supplier", label: "Supplier", type: "category", synonyms: ["vendorname", "supplier", "vendor", "mainvendor", "suppliername"] },
      { key: "price", label: "Price", type: "money", synonyms: ["listprice", "price", "unitprice", "saleprice"] },
      { key: "cost", label: "Cost", type: "money", synonyms: ["stdcost", "cost", "unitcost", "standardcost"] },
    ],
  },
  {
    key: "orders",
    label: "Order lines",
    description: "One row per product on an order.",
    dateField: "order_date",
    fields: [
      id("order_id", "Order ID", ["salesdoc", "orderid", "orderno", "ordernumber", "docno", "salesorder", "salesdocument"]),
      { key: "order_date", label: "Order date", type: "date", required: true, synonyms: ["docdate", "orderdate", "date", "createdat", "documentdate"] },
      id("customer_id", "Customer ID", ["custno", "customerid", "soldto", "customer", "soldtoparty"], false),
      id("product_id", "Product ID", ["matno", "productid", "sku", "material", "itemcode"]),
      { key: "quantity", label: "Quantity", type: "number", required: true, positive: true, synonyms: ["orderqty", "qty", "quantity", "units"] },
      { key: "unit_price", label: "Unit price", type: "money", synonyms: ["netprice", "unitprice", "price"] },
      { key: "amount", label: "Line amount", type: "money", required: true, synonyms: ["netvalue", "amount", "total", "revenue", "value", "linetotal"] },
      { key: "channel", label: "Channel", type: "category", synonyms: ["channel", "saleschannel", "distributionchannel", "source"] },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    description: "Stock on hand per product at a point in time.",
    dateField: "date",
    fields: [
      id("product_id", "Product ID", ["matno", "productid", "sku", "material"]),
      { key: "date", label: "Stock date", type: "date", required: true, synonyms: ["stockdate", "date", "snapshotdate", "asof"] },
      { key: "on_hand", label: "On hand", type: "number", required: true, synonyms: ["unrestrictedqty", "onhand", "stock", "qtyonhand", "quantity", "qty"] },
      { key: "reorder_point", label: "Reorder point", type: "number", synonyms: ["reorderpoint", "minstock", "safetystock"] },
    ],
  },
  {
    key: "purchases",
    label: "Purchase orders",
    description: "One row per product on a purchase order to a supplier.",
    dateField: "order_date",
    fields: [
      id("po_id", "Purchase order ID", ["ponumber", "poid", "purchaseorder", "pono", "purchasingdocument"]),
      { key: "supplier", label: "Supplier", type: "category", required: true, synonyms: ["vendorname", "vendor", "supplier", "suppliername"] },
      id("product_id", "Product ID", ["matno", "productid", "sku", "material"]),
      { key: "order_date", label: "Order date", type: "date", required: true, synonyms: ["podate", "orderdate", "date", "documentdate"] },
      { key: "received_date", label: "Received date", type: "date", synonyms: ["grdate", "receiveddate", "goodsreceiptdate", "deliverydate"] },
      { key: "quantity", label: "Quantity", type: "number", required: true, positive: true, synonyms: ["poqty", "qty", "quantity", "orderqty"] },
      { key: "unit_cost", label: "Unit cost", type: "money", synonyms: ["unitcost", "cost", "netprice", "price"] },
    ],
  },
  {
    key: "returns",
    label: "Returns",
    description: "One row per returned product.",
    dateField: "return_date",
    uniqueField: "return_id",
    fields: [
      id("return_id", "Return ID", ["rmano", "returnid", "rma", "returnno"]),
      id("order_id", "Order ID", ["salesdoc", "orderid", "orderno", "referencedocument"], false),
      id("product_id", "Product ID", ["matno", "productid", "sku", "material"]),
      { key: "return_date", label: "Return date", type: "date", required: true, synonyms: ["returndate", "date", "createdat"] },
      { key: "reason", label: "Reason", type: "category", synonyms: ["reasoncode", "reason", "returnreason"] },
      { key: "quantity", label: "Quantity", type: "number", required: true, positive: true, synonyms: ["retqty", "qty", "quantity", "returnedqty"] },
      { key: "refund_amount", label: "Refund", type: "money", synonyms: ["refundamt", "refund", "amount", "refundamount"] },
    ],
  },
  {
    key: "invoices",
    label: "Invoices",
    description: "One row per invoice.",
    dateField: "invoice_date",
    uniqueField: "invoice_id",
    fields: [
      id("invoice_id", "Invoice ID", ["billingdoc", "invoiceid", "invoiceno", "invoicenumber", "billingdocument"]),
      id("order_id", "Order ID", ["salesdoc", "orderid", "orderno"], false),
      id("customer_id", "Customer ID", ["custno", "customerid", "payer", "customer"], false),
      { key: "invoice_date", label: "Invoice date", type: "date", required: true, synonyms: ["billingdate", "invoicedate", "date"] },
      { key: "due_date", label: "Due date", type: "date", synonyms: ["duedate", "netduedate"] },
      { key: "paid_date", label: "Paid date", type: "date", synonyms: ["clearingdate", "paiddate", "paymentdate"] },
      { key: "amount", label: "Amount", type: "money", required: true, synonyms: ["grossamt", "amount", "total", "grossamount", "invoiceamount"] },
      { key: "status", label: "Status", type: "category", synonyms: ["status", "paymentstatus"] },
    ],
  },
];

export function getEntity(key: string): CanonicalEntity | undefined {
  return ENTITIES.find((e) => e.key === key);
}

/** Canonical field → source field name (or null when nothing in the source matches). */
export type FieldMapping = Record<string, string | null>;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Which entity a source dataset most likely holds, from its key and name. */
export function suggestEntity(datasetKey: string, name: string): EntityKey | null {
  const text = norm(`${datasetKey} ${name}`);
  const hints: [EntityKey, string[]][] = [
    ["returns", ["return", "rma"]],
    ["invoices", ["invoice", "billing"]],
    ["purchases", ["purchase", "po", "procurement"]],
    ["inventory", ["inventory", "stock"]],
    ["orders", ["order", "sales"]],
    ["products", ["product", "material", "item", "sku"]],
    ["customers", ["customer", "client", "account"]],
  ];
  return hints.find(([, words]) => words.some((w) => text.includes(w)))?.[0] ?? null;
}

/** Best guess at which source field fills each canonical field. People confirm it. */
export function suggestMapping(entity: CanonicalEntity, sourceFields: { name: string; description?: string }[]): FieldMapping {
  const used = new Set<string>();
  const mapping: FieldMapping = {};
  for (const field of entity.fields) {
    const match =
      sourceFields.find((f) => !used.has(f.name) && field.synonyms.includes(norm(f.name))) ??
      sourceFields.find((f) => !used.has(f.name) && f.description && field.synonyms.includes(norm(f.description)));
    mapping[field.key] = match?.name ?? null;
    if (match) used.add(match.name);
  }
  return mapping;
}
