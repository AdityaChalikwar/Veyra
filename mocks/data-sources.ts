import { ago } from "@/lib/time";
import type { DataSource } from "@/lib/types";

export function buildDataSources(): DataSource[] {
  return [
    { id: "ds-product", name: "Product analytics", kind: "Product analytics", description: "Events, active users, funnels and retention.", status: "connected", lastSyncedAt: ago({ hours: 2 }), itemCount: 3 },
    { id: "ds-ads", name: "Paid social ads", kind: "Marketing", description: "Campaign spend, installs and targeting.", status: "connected", lastSyncedAt: ago({ days: 1 }), itemCount: 1 },
    { id: "ds-payments", name: "Payments", kind: "Payments", description: "Subscriptions, revenue and churn.", status: "connected", lastSyncedAt: ago({ hours: 3 }), itemCount: 2 },
    { id: "ds-crm", name: "CRM", kind: "CRM", description: "Deals, pipeline and customer accounts.", status: "not-connected" },
    { id: "ds-web", name: "Web analytics", kind: "Web analytics", description: "Website traffic, sources and conversion.", status: "not-connected" },
  ];
}
