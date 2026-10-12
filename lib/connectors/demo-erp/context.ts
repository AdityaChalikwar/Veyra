import type { BusinessContext } from "@/lib/types";

/** Northwind Home's business context: what Veyra's AI is told about the Demo ERP's fictional company. */
export const DEMO_CONTEXT: BusinessContext = {
  company: "Northwind Home",
  product: "Online store for home goods — kitchenware, bedding, bath, living and lighting — sold through its website, app and marketplaces.",
  businessModel: "Direct-to-consumer e-commerce, plus trade customers (about 12%) who get 15% off and 30-day payment terms.",
  targetCustomers: "Households furnishing their homes, and small trade buyers such as shops and interior designers.",
  goals: ["Grow repeat purchases", "Protect gross margin", "Keep return rates low"],
  priorities: ["Reduce product returns", "Improve supplier reliability", "Grow app sales"],
  keyMetrics: ["Revenue", "Units sold", "Return rate", "Repeat purchase rate", "Supplier lead time"],
};

/** The question the Demo ERP is built to answer — used to start a first investigation. */
export const DEMO_PROBLEM = "Kitchen product returns are rising and repeat purchases are falling.";
