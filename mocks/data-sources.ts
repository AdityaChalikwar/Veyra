import { ago } from "@/lib/time";
import type { DataSource } from "@/lib/types";

/** Mock connectors. Nothing is actually connected — this shows the future architecture. */
export function buildDataSources(): DataSource[] {
  return [
    {
      id: "ds-analytics",
      name: "Product Analytics",
      group: "company-systems",
      description: "Events, active users, funnels and retention cohorts.",
      status: "connected",
      lastSyncedAt: ago({ hours: 1 }),
      metrics: [
        { label: "Events", value: "12.4M" },
        { label: "Users", value: "183,421" },
      ],
    },
    {
      id: "ds-erp",
      name: "ERP",
      group: "company-systems",
      description: "Orders, customers and inventory — what merchants actually sell.",
      status: "connected",
      lastSyncedAt: ago({ hours: 2 }),
      metrics: [
        { label: "Orders", value: "182,421" },
        { label: "Customers", value: "12,482" },
        { label: "Inventory records", value: "48,231" },
      ],
    },
    {
      id: "ds-crm",
      name: "CRM",
      group: "company-systems",
      description: "Accounts, leads, lead sources and win/loss notes.",
      status: "connected",
      lastSyncedAt: ago({ hours: 3 }),
      metrics: [
        { label: "Accounts", value: "12,904" },
        { label: "Leads", value: "41,870" },
      ],
    },
    {
      id: "ds-sales",
      name: "Sales",
      group: "company-systems",
      description: "Pipeline, deals and plan upgrades.",
      status: "connected",
      lastSyncedAt: ago({ hours: 3 }),
      metrics: [
        { label: "Deals closed (12 mo)", value: "1,284" },
        { label: "Open pipeline", value: "$4.2M" },
      ],
    },
    {
      id: "ds-docs",
      name: "Internal Documents",
      group: "company-systems",
      description: "Product specs, release notes and decision docs.",
      status: "connected",
      lastSyncedAt: ago({ days: 1 }),
      metrics: [{ label: "Documents", value: "1,142" }],
    },
    {
      id: "ds-finance",
      name: "Finance",
      group: "company-systems",
      description: "Revenue, billing and unit economics.",
      status: "not-connected",
    },
    {
      id: "ds-support",
      name: "Support",
      group: "customer-evidence",
      description: "Support tickets and their tags.",
      status: "connected",
      lastSyncedAt: ago({ minutes: 30 }),
      metrics: [{ label: "Tickets", value: "48,902" }],
    },
    {
      id: "ds-feedback",
      name: "Customer Feedback",
      group: "customer-evidence",
      description: "In-app feedback and NPS comments.",
      status: "connected",
      lastSyncedAt: ago({ hours: 4 }),
      metrics: [
        { label: "Responses", value: "9,431" },
        { label: "NPS", value: "41" },
      ],
    },
    {
      id: "ds-surveys",
      name: "Surveys",
      group: "customer-evidence",
      description: "Customer surveys and results.",
      status: "not-connected",
    },
    {
      id: "ds-research",
      name: "User Research",
      group: "customer-evidence",
      description: "Interview notes, transcripts and usability tests.",
      status: "not-connected",
    },
    {
      id: "ds-market",
      name: "Market Research",
      group: "external",
      description: "Analyst and industry reports you upload.",
      status: "connected",
      lastSyncedAt: ago({ days: 6 }),
      metrics: [{ label: "Reports", value: "6" }],
    },
    {
      id: "ds-competitors",
      name: "Competitor Intelligence",
      group: "external",
      description: "Competitor pricing, releases and positioning.",
      status: "not-connected",
    },
    {
      id: "ds-web",
      name: "Public Web",
      group: "external",
      description: "Searched only on request, and always labelled as public research.",
      status: "not-connected",
    },
  ];
}
