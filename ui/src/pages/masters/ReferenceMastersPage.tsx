import { Download, Edit3, Eye, FileUp, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getMasterTab,
  organizationOptions,
  unitOptions,
  type MasterRow,
  type MasterTab,
  type MasterTabCode,
} from "@/data/mastersManagement.sample";

type ReferenceTab = Extract<MasterTabCode, "locales" | "organizations" | "officers" | "periodicities" | "units" | "measures">;
type DialogState = { mode: "view" | "create" | "edit" | "delete"; tab: MasterTab; row?: MasterRow } | null;

const referenceTabCodes: ReferenceTab[] = ["locales", "organizations", "officers", "periodicities", "units", "measures"];
const referenceTabs = referenceTabCodes.map((code) => getMasterTab(code)).filter(Boolean) as MasterTab[];

const statusVariant = (value?: string) => {
  if (["ACTIVE", "YES", "NUMERIC"].includes(value ?? "")) return "secondary";
  if (["NO", "TEXT", "DATE"].includes(value ?? "")) return "outline";
  if (["RETIRED", "MISSING"].includes(value ?? "")) return "destructive";
  return "ghost";
};

function TextField({ label, value }: { label: string; value?: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <Input defaultValue={value ?? ""} />
    </label>
  );
}

function ParentOrganizationField({ value }: { value?: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      parent_organization_code
      <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={value}>
        <option value="">No parent</option>
        {organizationOptions.map((item) => (
          <option key={item.id} value={item.organization_code}>{item.organization_code} / {item.name}</option>
        ))}
      </select>
    </label>
  );
}

function OrganizationField({ label, value }: { label: string; value?: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={value}>
        <option value="">Select organization</option>
        {organizationOptions.map((item) => (
          <option key={item.id} value={item.organization_code}>
            {item.organization_type} / {item.organization_code} / {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function UnitField({ value }: { value?: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      unit_code
      <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={value}>
        <option value="">Select unit</option>
        {unitOptions.map((item) => (
          <option key={item.id} value={item.unit_code}>
            {item.unit_code} / {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function getReferenceStats(tab: MasterTab) {
  const activeRows = tab.rows.filter((row) => ["YES", "ACTIVE"].includes(row.is_active ?? row.status ?? ""));

  if (tab.code === "locales") {
    return [
      ["Locales", tab.rows.length, tab.tableName],
      ["Active", activeRows.length, "enabled languages"],
      ["Default", tab.rows.filter((row) => row.is_default === "YES").length, "fallback locale"],
      ["Hindi ready", tab.rows.filter((row) => row.locale_code === "hi-IN" && row.is_active === "YES").length, "bilingual access"],
    ];
  }

  if (tab.code === "organizations") {
    return [
      ["Organizations", tab.rows.length, tab.tableName],
      ["Ministries", tab.rows.filter((row) => row.organization_type === "MINISTRY").length, "top level"],
      ["Departments", tab.rows.filter((row) => row.organization_type !== "MINISTRY").length, "child units"],
      ["Active", activeRows.length, "usable records"],
    ];
  }

  if (tab.code === "officers") {
    return [
      ["Officers", tab.rows.length, tab.tableName],
      ["Active", activeRows.length, "usable records"],
      ["Mapped orgs", new Set(tab.rows.map((row) => row.organization_code).filter(Boolean)).size, "ministry/unit links"],
      ["Auth linked", tab.rows.filter((row) => row.auth_user_id && row.auth_user_id !== "not set").length, "optional future link"],
    ];
  }

  if (tab.code === "periodicities") {
    return [
      ["Cadences", tab.rows.length, tab.tableName],
      ["Annual", tab.rows.filter((row) => row.months_interval === "12").length, "12 month interval"],
      ["Sub annual", tab.rows.filter((row) => row.months_interval !== "12").length, "shorter cycles"],
      ["Active", activeRows.length, "usable records"],
    ];
  }

  if (tab.code === "units") {
    return [
      ["Units", tab.rows.length, tab.tableName],
      ["Ratio units", tab.rows.filter((row) => row.unit_type === "RATIO").length, "percent/rate"],
      ["Number units", tab.rows.filter((row) => row.unit_type === "NUMBER").length, "count values"],
      ["Active", activeRows.length, "usable records"],
    ];
  }

  return [
    ["Measures", tab.rows.length, tab.tableName],
    ["Required", tab.rows.filter((row) => row.is_required === "YES").length, "mandatory inputs"],
    ["Numeric", tab.rows.filter((row) => row.value_type === "NUMERIC").length, "numeric collection"],
    ["Linked units", new Set(tab.rows.map((row) => row.unit_code).filter(Boolean)).size, "unit references"],
  ];
}

function ReferenceDialog({ dialog, onClose }: { dialog: DialogState; onClose: () => void }) {
  if (!dialog) return null;

  const { tab, row, mode } = dialog;
  const isDelete = mode === "delete";
  const isView = mode === "view";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reference-dialog-title">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">{tab.tableName}</p>
            <h2 id="reference-dialog-title" className="text-xl font-bold">
              {mode === "create" ? "Create" : mode === "edit" ? "Edit" : mode === "delete" ? "Delete" : "View"} {tab.label}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-5">
          {isView && row ? (
            <dl className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
              {Object.entries(row).filter(([key]) => key !== "id").map(([key, value]) => (
                <div key={key} className="rounded-md bg-muted/50 p-3">
                  <dt className="text-[11px] font-semibold text-muted-foreground">{key}</dt>
                  <dd className="mt-1 break-words font-mono text-[11px] font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {isDelete && row ? (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-900">
              Confirm delete for <strong>{row.organization_code ?? row.officer_code ?? row.periodicity_code ?? row.measure_code ?? row.locale_code ?? row.id}</strong>. Dependency checks are required.
            </div>
          ) : null}

          {!isView && !isDelete ? (
            <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
              {tab.columns.map((column) =>
                column.key === "parent_organization_code" ? (
                  <ParentOrganizationField key={column.key} value={row?.[column.key]} />
                ) : column.key === "organization_code" && tab.code === "officers" ? (
                  <OrganizationField key={column.key} label={column.key} value={row?.[column.key]} />
                ) : column.key === "unit_code" && tab.code === "measures" ? (
                  <UnitField key={column.key} value={row?.[column.key]} />
                ) : (
                  <TextField key={column.key} label={column.key} value={row?.[column.key]} />
                ),
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/40 px-5 py-4">
          <span className="text-xs text-muted-foreground">{tab.dependency}</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {!isView ? (
              <Button variant={isDelete ? "destructive" : "default"} onClick={onClose}>
                {isDelete ? "Delete" : "Save/Submit"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReferenceMastersPage() {
  const [activeCode, setActiveCode] = useState<ReferenceTab>("organizations");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const activeTab = referenceTabs.find((tab) => tab.code === activeCode) ?? referenceTabs[0];
  const filteredRows = useMemo(
    () => activeTab.rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())),
    [activeTab.rows, query],
  );

  return (
    <AppShell persona="Super Admin" activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="reference-masters-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="reference-masters-title" className="text-2xl font-bold">Masters</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage reusable reference masters used by indicators, requests, and source assignment.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Download aria-hidden="true" className="size-4" /> Format</Button>
            <Button variant="outline"><FileUp aria-hidden="true" className="size-4" /> Bulk upload</Button>
            <Button onClick={() => setDialog({ mode: "create", tab: activeTab })}><Plus aria-hidden="true" className="size-4" /> New record</Button>
          </div>
        </div>

        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Reference master tabs">
          {referenceTabs.map((tab) => (
            <button
              key={tab.code}
              type="button"
              role="tab"
              aria-selected={activeCode === tab.code}
              onClick={() => {
                setActiveCode(tab.code as ReferenceTab);
                setQuery("");
              }}
              className={[
                "shrink-0 border-b-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground",
                activeCode === tab.code ? "border-primary text-primary" : "border-transparent",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
          {getReferenceStats(activeTab).map(([label, value, helper]) => (
            <div key={label} className="rounded-md bg-card p-3 shadow-sm ring-1 ring-border/60">
              <p className="text-xs font-semibold text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
              <p className="truncate text-[11px] text-muted-foreground">{helper}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">{activeTab.label}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{activeTab.dependency}</p>
              </div>
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search records</span>
                <Input className="border-0 bg-transparent" placeholder={`Search ${activeTab.label.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab.columns.map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    {activeTab.columns.map((column) => (
                      <TableCell key={column.key} className="max-w-80 whitespace-normal font-mono text-[11px]">
                        {["status", "is_active", "value_type"].includes(column.key)
                          ? <Badge variant={statusVariant(row[column.key])}>{row[column.key]}</Badge>
                          : row[column.key] ?? "-"}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon-xs" variant="outline" aria-label="View" onClick={() => setDialog({ mode: "view", tab: activeTab, row })}><Eye aria-hidden="true" className="size-3" /></Button>
                        <Button size="icon-xs" variant="outline" aria-label="Edit" onClick={() => setDialog({ mode: "edit", tab: activeTab, row })}><Edit3 aria-hidden="true" className="size-3" /></Button>
                        <Button size="icon-xs" variant="destructive" aria-label="Delete" onClick={() => setDialog({ mode: "delete", tab: activeTab, row })}><Trash2 aria-hidden="true" className="size-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rows 1-{filteredRows.length} of {filteredRows.length}</span>
              <div className="flex gap-2">
                <Button size="xs" variant="outline">Previous</Button>
                <Button size="xs" variant="outline">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <ReferenceDialog dialog={dialog} onClose={() => setDialog(null)} />
    </AppShell>
  );
}
