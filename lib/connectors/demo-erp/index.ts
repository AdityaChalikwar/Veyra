import type { Connector, SourceDataset, SourceField } from "../types";
import { demoErpData, type DemoErpData } from "./data";

/**
 * Demo ERP: a built-in source with a year of realistic data for a fictional
 * retailer. It behaves like a real connector — datasets, schema discovery,
 * rows — so the whole onboarding pipeline runs against it.
 */

type Key = keyof DemoErpData;

const DATASETS: (Omit<SourceDataset, "approxRows"> & { key: Key; fields: SourceField[] })[] = [
  {
    key: "customers",
    name: "Customers",
    description: "Customer master: who buys, since when, which group and region.",
    fields: [
      { name: "CustNo", sourceType: "CHAR(10)", description: "Customer number" },
      { name: "CustName", sourceType: "CHAR(80)", description: "Customer name" },
      { name: "EmailAddr", sourceType: "CHAR(120)", description: "E-mail address" },
      { name: "CreatedOn", sourceType: "DATE", description: "Created on" },
      { name: "CustGroup", sourceType: "CHAR(20)", description: "Customer group" },
      { name: "Region", sourceType: "CHAR(20)", description: "Sales region" },
    ],
  },
  {
    key: "products",
    name: "Products",
    description: "Material master: products, categories, suppliers, prices and costs.",
    fields: [
      { name: "MatNo", sourceType: "CHAR(18)", description: "Material number" },
      { name: "MatDesc", sourceType: "CHAR(80)", description: "Material description" },
      { name: "ProdHier", sourceType: "CHAR(20)", description: "Product hierarchy" },
      { name: "VendorName", sourceType: "CHAR(60)", description: "Main vendor" },
      { name: "ListPrice", sourceType: "DEC(11,2)", description: "List price" },
      { name: "StdCost", sourceType: "DEC(11,2)", description: "Standard cost" },
    ],
  },
  {
    key: "orders",
    name: "Sales orders",
    description: "Sales order lines: what was sold, to whom, when and through which channel.",
    fields: [
      { name: "SalesDoc", sourceType: "CHAR(10)", description: "Sales document" },
      { name: "ItemNo", sourceType: "NUMC(6)", description: "Item" },
      { name: "DocDate", sourceType: "DATE", description: "Document date" },
      { name: "CustNo", sourceType: "CHAR(10)", description: "Sold-to party" },
      { name: "MatNo", sourceType: "CHAR(18)", description: "Material" },
      { name: "OrderQty", sourceType: "QUAN(13)", description: "Order quantity" },
      { name: "NetPrice", sourceType: "CURR(11,2)", description: "Net price" },
      { name: "NetValue", sourceType: "CURR(15,2)", description: "Net value" },
      { name: "Channel", sourceType: "CHAR(20)", description: "Distribution channel" },
    ],
  },
  {
    key: "inventory",
    name: "Inventory",
    description: "Stock on hand per product, every Monday.",
    fields: [
      { name: "MatNo", sourceType: "CHAR(18)", description: "Material" },
      { name: "StockDate", sourceType: "DATE", description: "Stock date" },
      { name: "UnrestrictedQty", sourceType: "QUAN(13)", description: "Unrestricted stock" },
      { name: "ReorderPoint", sourceType: "QUAN(13)", description: "Reorder point" },
    ],
  },
  {
    key: "purchases",
    name: "Purchase orders",
    description: "Replenishment orders to suppliers: quantities, costs and when goods arrived.",
    fields: [
      { name: "PONumber", sourceType: "CHAR(10)", description: "Purchasing document" },
      { name: "VendorName", sourceType: "CHAR(60)", description: "Vendor" },
      { name: "MatNo", sourceType: "CHAR(18)", description: "Material" },
      { name: "PODate", sourceType: "DATE", description: "Document date" },
      { name: "GRDate", sourceType: "DATE", description: "Goods receipt date" },
      { name: "POQty", sourceType: "QUAN(13)", description: "Order quantity" },
      { name: "UnitCost", sourceType: "CURR(11,2)", description: "Net price" },
    ],
  },
  {
    key: "returns",
    name: "Returns",
    description: "Customer returns with reason codes and refunds.",
    fields: [
      { name: "RMANo", sourceType: "CHAR(10)", description: "Return authorisation" },
      { name: "SalesDoc", sourceType: "CHAR(10)", description: "Reference sales document" },
      { name: "MatNo", sourceType: "CHAR(18)", description: "Material" },
      { name: "ReturnDate", sourceType: "DATE", description: "Return date" },
      { name: "ReasonCode", sourceType: "CHAR(20)", description: "Return reason" },
      { name: "RetQty", sourceType: "QUAN(13)", description: "Returned quantity" },
      { name: "RefundAmt", sourceType: "CURR(15,2)", description: "Refund amount" },
    ],
  },
  {
    key: "invoices",
    name: "Invoices",
    description: "Billing documents: amounts, due dates and whether they were paid.",
    fields: [
      { name: "BillingDoc", sourceType: "CHAR(10)", description: "Billing document" },
      { name: "SalesDoc", sourceType: "CHAR(10)", description: "Reference sales document" },
      { name: "CustNo", sourceType: "CHAR(10)", description: "Payer" },
      { name: "BillingDate", sourceType: "DATE", description: "Billing date" },
      { name: "DueDate", sourceType: "DATE", description: "Net due date" },
      { name: "ClearingDate", sourceType: "DATE", description: "Clearing date" },
      { name: "GrossAmt", sourceType: "CURR(15,2)", description: "Gross amount" },
      { name: "Status", sourceType: "CHAR(10)", description: "Payment status" },
    ],
  },
];

const isKey = (k: string): k is Key => DATASETS.some((d) => d.key === k);

export const demoErp: Connector = {
  id: "demo-erp",
  kind: "erp",
  name: "Demo ERP",
  description: "Northwind Home, a fictional online home-goods retailer: a year of customers, products, orders, stock, purchasing, returns and invoices.",
  async listDatasets() {
    const data = demoErpData();
    return DATASETS.map(({ key, name, description }) => ({ key, name, description, approxRows: data[key].length }));
  },
  async describe(datasetKey) {
    if (!isKey(datasetKey)) throw new Error(`Unknown dataset ${datasetKey}`);
    const d = DATASETS.find((x) => x.key === datasetKey)!;
    return { fields: d.fields, sample: demoErpData()[datasetKey].slice(0, 5) };
  },
  async read(datasetKey) {
    if (!isKey(datasetKey)) throw new Error(`Unknown dataset ${datasetKey}`);
    return demoErpData()[datasetKey];
  },
};
