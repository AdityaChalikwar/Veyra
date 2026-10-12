import "server-only";
import { demoErp } from "./demo-erp";
import type { Connector } from "./types";

/** Every connector Veyra can use. A real ERP, CRM or analytics connector is added here. */
const CONNECTORS: Connector[] = [demoErp];

export function getConnector(id: string): Connector | undefined {
  return CONNECTORS.find((c) => c.id === id);
}

export type { Connector, SourceKind } from "./types";
