/**
 * The connector interface. Every data source — Demo ERP today; SAP, Oracle,
 * Dynamics, a CRM or product analytics later — is a module with these three
 * operations. Everything after them (mapping, validation, snapshots, metrics,
 * evidence) is shared, so adding a connector never touches the investigation
 * engine.
 */

/** The kinds of system Veyra can take data from. */
export type SourceKind = "erp" | "crm" | "analytics" | "support" | "finance" | "csv" | "research";

/** A field as the source system describes it (schema discovery). */
export type SourceField = {
  name: string;
  /** The source's own type name, e.g. "CHAR(10)" or "date". Shown as-is. */
  sourceType: string;
  description?: string;
};

/** A dataset (table, object, report) the source offers. */
export type SourceDataset = {
  key: string;
  name: string;
  description: string;
  /** Rough size, so people know what they're choosing. */
  approxRows: number;
};

export type DiscoveredSchema = {
  fields: SourceField[];
  /** A few rows as the source returns them, values as text. */
  sample: Record<string, string>[];
};

export type Connector = {
  id: string;
  kind: SourceKind;
  name: string;
  description: string;
  listDatasets(): Promise<SourceDataset[]>;
  describe(datasetKey: string): Promise<DiscoveredSchema>;
  /** Every row of a dataset, values as text keyed by source field name. */
  read(datasetKey: string): Promise<Record<string, string>[]>;
};
