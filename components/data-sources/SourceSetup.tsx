"use client";

import { AlertTriangle, Check, CheckCircle2, ChevronDown, CircleAlert, Database, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkSource, disconnectSource, saveMapping, selectDatasets, syncSource } from "@/app/(app)/data-sources/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { ENTITIES, getEntity, suggestMapping, type FieldMapping } from "@/lib/data-layer/canonical";
import { routes } from "@/lib/routes";
import { formatRelative } from "@/lib/time";
import type { ConnectedSource, DataCheck, DataMetric, SourceDatasetView } from "@/lib/types";
import { MetricTable } from "./MetricTable";

const OFFLINE = "Couldn't reach Veyra. Check your connection and try again.";

/**
 * Setting up a connected source, in the order the work happens:
 * choose datasets → map fields → check the data → sync.
 * Each step opens once the one before it is done.
 */
export function SourceSetup({ source }: { source: ConnectedSource }) {
  const selected = source.datasets.filter((d) => d.selected);
  const mapped = selected.length > 0 && selected.every((d) => d.mappingConfirmed);
  const synced = selected.some((d) => d.latest);

  return (
    <div className="mt-6 space-y-4">
      <Step n={1} title="Choose datasets" done={selected.length > 0} open>
        <DatasetPicker source={source} />
      </Step>
      <Step n={2} title="Map fields to Veyra" done={mapped} open={selected.length > 0} lockedText="Choose datasets first.">
        <p className="mb-3 text-[13px] text-ink-muted">
          Veyra read each dataset&rsquo;s structure and suggested which of its fields fill Veyra&rsquo;s. Check the suggestions — this is where
          you confirm what the data means.
        </p>
        <div className="space-y-3">
          {selected.map((d, i) => (
            <MappingCard key={d.id} dataset={d} startOpen={!d.mappingConfirmed && selected.findIndex((x) => !x.mappingConfirmed) === i} />
          ))}
        </div>
      </Step>
      <Step n={3} title="Check the data" done={synced} open={mapped} lockedText="Confirm every mapping first.">
        <Validation sourceId={source.id} />
      </Step>
      <Step n={4} title="Sync" done={synced} open={mapped} lockedText="Confirm every mapping first.">
        <Sync source={source} />
      </Step>
      <Disconnect source={source} />
    </div>
  );
}

function Step({ n, title, done, open, lockedText, children }: { n: number; title: string; done: boolean; open: boolean; lockedText?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-surface p-5 shadow-card", open ? "border-line" : "border-dashed border-line-strong bg-canvas/50 shadow-none")}>
      <h2 className="flex items-center gap-2.5 text-[15px] font-semibold">
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs",
            done ? "bg-confirmed-600 text-white" : open ? "bg-brand-600 text-white" : "bg-line text-ink-subtle",
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" /> : n}
        </span>
        {title}
      </h2>
      <div className="mt-3">{open ? children : <p className="text-[13px] text-ink-faint">{lockedText}</p>}</div>
    </section>
  );
}

function DatasetPicker({ source }: { source: ConnectedSource }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(source.datasets.filter((d) => d.selected).map((d) => d.id)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = new Set(source.datasets.filter((d) => d.selected).map((d) => d.id));
  const changed = chosen.size !== saved.size || [...chosen].some((id) => !saved.has(id));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const r = await selectDatasets(source.id, [...chosen]);
      if ("error" in r) setError(r.error);
      else router.refresh();
    } catch {
      setError(OFFLINE);
    }
    setBusy(false);
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {source.datasets.map((d) => {
          const on = chosen.has(d.id);
          return (
            <li key={d.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => setChosen((c) => (c.has(d.id) ? new Set([...c].filter((x) => x !== d.id)) : new Set([...c, d.id])))}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                  on ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500" : "border-line hover:border-line-strong",
                )}
              >
                <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border", on ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong")}>
                  {on && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium">
                    {d.name} <span className="font-normal text-ink-faint">· {d.approxRows.toLocaleString("en")} rows</span>
                  </span>
                  <span className="block text-xs text-ink-subtle">{d.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={save} disabled={busy || chosen.size === 0 || !changed}>
          {busy ? <Spinner /> : <Check className="h-3.5 w-3.5" />} {saved.size ? "Save choice" : `Continue with ${chosen.size} dataset${chosen.size === 1 ? "" : "s"}`}
        </Button>
        <button type="button" className="text-xs font-medium text-brand-600 hover:text-brand-700" onClick={() => setChosen(new Set(source.datasets.map((d) => d.id)))}>
          Choose all
        </button>
        {error && (
          <p role="alert" className="text-sm text-danger-600">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

const select =
  "h-9 w-full rounded-lg border border-line-strong bg-surface px-2.5 text-[13px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function MappingCard({ dataset: d, startOpen }: { dataset: SourceDatasetView; startOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [entityKey, setEntityKey] = useState(d.entity ?? "");
  const [mapping, setMapping] = useState<FieldMapping>(d.mapping);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entity = getEntity(entityKey);
  const fields = d.schema?.fields ?? [];
  const sample = d.schema?.sample[0] ?? {};

  function chooseEntity(key: string) {
    setEntityKey(key);
    const e = getEntity(key);
    setMapping(e ? suggestMapping(e, fields) : {});
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const r = await saveMapping(d.id, entityKey, mapping);
      if ("error" in r) setError(r.error);
      else {
        setOpen(false);
        router.refresh();
      }
    } catch {
      setError(OFFLINE);
    }
    setBusy(false);
  }

  const missing = entity?.fields.filter((f) => f.required && !mapping[f.key]) ?? [];

  return (
    <article className="rounded-lg border border-line">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="min-w-0 text-[14px] font-medium">
          {d.name}
          <span className="ml-2 text-xs font-normal text-ink-subtle">
            {fields.length} fields found{entity ? ` · holds ${entity.label.toLowerCase()}` : ""}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {d.mappingConfirmed ? (
            <span className="inline-flex items-center gap-1 rounded bg-confirmed-50 px-1.5 py-0.5 text-[11px] font-medium text-confirmed-600">
              <Check className="h-3 w-3" /> Confirmed
            </span>
          ) : (
            <span className="rounded bg-uncertain-50 px-1.5 py-0.5 text-[11px] font-medium text-uncertain-600">To confirm</span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-ink-subtle transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3">
          <label className="block text-[13px] font-medium text-ink" htmlFor={`entity-${d.id}`}>
            What does this dataset contain?
          </label>
          <select id={`entity-${d.id}`} value={entityKey} onChange={(e) => chooseEntity(e.target.value)} className={`${select} mt-1.5 max-w-xs`}>
            <option value="">Choose…</option>
            {ENTITIES.map((e) => (
              <option key={e.key} value={e.key}>
                {e.label} — {e.description}
              </option>
            ))}
          </select>

          {entity && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="text-[11px] uppercase tracking-wider text-ink-faint">
                  <tr>
                    <th className="pb-2 font-semibold">Veyra field</th>
                    <th className="pb-2 font-semibold">Field in {d.name}</th>
                    <th className="pb-2 font-semibold">Example value</th>
                  </tr>
                </thead>
                <tbody>
                  {entity.fields.map((f) => {
                    const src = mapping[f.key] ?? "";
                    return (
                      <tr key={f.key} className="border-t border-line">
                        <td className="py-2 pr-3">
                          <span className="font-medium">{f.label}</span>
                          {f.required && <span className="ml-1.5 rounded bg-canvas px-1 text-[10.5px] text-ink-subtle">Required</span>}
                          {f.personal && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-violet-50 px-1 text-[10.5px] text-violet-700">
                              <ShieldCheck className="h-3 w-3" /> Personal — hidden from AI
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            aria-label={`Source field for ${f.label}`}
                            value={src}
                            onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || null }))}
                            className={select}
                          >
                            <option value="">— Not in this data —</option>
                            {fields.map((sf) => (
                              <option key={sf.name} value={sf.name}>
                                {sf.name} ({sf.sourceType}){sf.description ? ` — ${sf.description}` : ""}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="max-w-[180px] truncate py-2 font-mono text-[12px] text-ink-subtle">{src ? (f.personal ? "•••" : sample[src] || "—") : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" size="sm" onClick={confirm} disabled={busy || !entity || missing.length > 0}>
              {busy ? <Spinner /> : <Check className="h-3.5 w-3.5" />} Confirm mapping
            </Button>
            {missing.length > 0 && <p className="text-xs text-uncertain-600">Map {missing.map((f) => f.label).join(", ")} to continue.</p>}
            {error && (
              <p role="alert" className="text-sm text-danger-600">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function CheckList({ checks }: { checks: DataCheck[] }) {
  return (
    <ul className="space-y-1">
      {checks.map((c) => (
        <li key={c.text} className="flex items-start gap-2 text-[13px]">
          {c.level === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-confirmed-600" />
          ) : c.level === "warning" ? (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-uncertain-600" />
          ) : (
            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-600" />
          )}
          <span className={c.level === "error" ? "text-danger-600" : "text-ink"}>{c.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Validation({ sourceId }: { sourceId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ datasetId: string; name: string; usable: boolean; checks: DataCheck[] }[] | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const r = await checkSource(sourceId);
      if ("error" in r) setError(r.error);
      else setResults(r.results);
    } catch {
      setError(OFFLINE);
    }
    setBusy(false);
  }

  return (
    <>
      <p className="text-[13px] text-ink-muted">
        Veyra reads every row with your mapping and checks it: required values present, dates and numbers readable, quantities above zero, no
        duplicates. Rows that fail are left out, and you see why.
      </p>
      <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={run} disabled={busy}>
        {busy ? <Spinner /> : <ShieldCheck className="h-3.5 w-3.5" />} {results ? "Check again" : "Check the data"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      )}
      {results && (
        <div className="mt-4 space-y-3">
          {results.map((r) => (
            <div key={r.datasetId} className="rounded-lg bg-canvas px-3.5 py-3">
              <p className="mb-1.5 text-[13.5px] font-medium">{r.name}</p>
              <CheckList checks={r.checks} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Sync({ source }: { source: ConnectedSource }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const synced = source.datasets.filter((d) => d.selected && d.latest);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const r = await syncSource(source.id);
      if ("error" in r) setError(r.error);
      else router.refresh();
    } catch {
      setError(OFFLINE);
    }
    setBusy(false);
  }

  return (
    <>
      <p className="text-[13px] text-ink-muted">
        Syncing takes a snapshot of each dataset in Veyra&rsquo;s format and works out its metrics — trends by month, breakdowns, rates —
        in code. Snapshots never change, so findings can always be traced to the exact data they used.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={run} disabled={busy}>
          {busy ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" />} {synced.length ? "Sync again" : "Sync now"}
        </Button>
        {busy && <span className="text-xs text-ink-subtle">Reading and checking every row…</span>}
        {source.lastSyncedAt && !busy && <span className="text-xs text-ink-subtle">Last synced {formatRelative(source.lastSyncedAt).toLowerCase()}</span>}
        {error && (
          <p role="alert" className="text-sm text-danger-600">
            {error}
          </p>
        )}
      </div>

      {synced.length > 0 && (
        <>
          <ul className="mt-4 space-y-3">
            {synced.map((d) => (
              <SnapshotCard key={d.id} name={d.name} snapshot={d.latest!} />
            ))}
          </ul>
          <p className="mt-4 flex gap-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3.5 py-2.5 text-[13px] text-brand-700">
            <Database className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Ready. Open an investigation, go to its <b className="font-semibold">Evidence</b> tab and choose <b className="font-semibold">Add from your data</b>.{" "}
              <Link href={routes.investigations} className="font-medium underline">
                Go to investigations
              </Link>
            </span>
          </p>
        </>
      )}
    </>
  );
}

function SnapshotCard({ name, snapshot: s }: { name: string; snapshot: NonNullable<SourceDatasetView["latest"]> }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-line">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left">
        <span className="min-w-0">
          <span className="block text-[14px] font-medium">{name}</span>
          <span className="block text-xs text-ink-subtle">
            {s.rowCount.toLocaleString("en")} rows{s.rejectedCount ? ` · ${s.rejectedCount.toLocaleString("en")} left out` : ""}
            {s.coverage ? ` · ${s.coverage}` : ""} · {s.metrics.length} metrics · synced {formatRelative(s.createdAt).toLowerCase()}
          </span>
        </span>
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-ink-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-line px-4 pb-4 pt-3">
          <CheckList checks={s.checks} />
          {s.metrics.map((m: DataMetric) => (
            <MetricTable key={m.id} metric={m} />
          ))}
        </div>
      )}
    </li>
  );
}

function Disconnect({ source }: { source: ConnectedSource }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!window.confirm(`Disconnect ${source.name}? Its snapshots are removed. Evidence already added to investigations stays.`)) return;
    setBusy(true);
    try {
      const r = await disconnectSource(source.id);
      if ("error" in r) {
        setError(r.error);
        setBusy(false);
      } else {
        router.push(routes.dataSources);
        router.refresh();
      }
    } catch {
      setError(OFFLINE);
      setBusy(false);
    }
  }

  return (
    <div className="pt-2">
      <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-danger-600 hover:underline disabled:opacity-60">
        {busy ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />} Disconnect {source.name}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
}
