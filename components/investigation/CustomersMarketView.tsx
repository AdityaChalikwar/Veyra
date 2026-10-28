"use client";

import { LiveCustomers } from "./LiveCustomers";
import { useWorkspace } from "./workspace-context";

/** Customers & Market: who is affected, what customers say and the outside context. */
export function CustomersMarketView() {
  const { workspace } = useWorkspace();
  return <LiveCustomers live={workspace.live} />;
}
