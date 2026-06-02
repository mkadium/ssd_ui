import {
  Download,
  Edit3,
  Eye,
  FileUp,
  Link2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
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
  globalIndicatorOptions,
  indicatorMappingNodeOptions,
  officerOptions,
  organizationOptions,
  periodicityOptions,
  type MasterRow,
} from "@/data/mastersManagement.sample";

type IndicatorTab = "overview" | "versions" | "measures" | "metadata" | "global-mapping" | "sources";
type DialogEntity = "indicator" | "version" | "measure" | "metadata" | "global-mapping" | "source";
type DialogState = {
  mode: "view" | "create" | "edit" | "delete" | "map";
  title: string;
  row?: MasterRow;
  entity?: DialogEntity;
} | null;

const nationalIndicators = getMasterTab("national-indicators")?.rows ?? [];
const globalMappings = getMasterTab("global-mappings")?.rows ?? [];
const versions = getMasterTab("indicator-versions")?.rows ?? [];
const measures = getMasterTab("measures")?.rows ?? [];
const metadataDetails = getMasterTab("metadata-details")?.rows ?? [];
const sourceAssignments = getMasterTab("source-assignments")?.rows ?? [];

const activeVersionChanges: MasterRow[] = [
  {
    id: "CHG_NIF_1_2_1_UNIT",
    national_indicator_code: "NIF_1_2_1",
    version_code: "NIF_1_2_1_V1",
    change_type: "Metadata update",
    field: "latest_data_availability",
    current_value: "2025-26",
    proposed_value: "2026-27",
    status: "PENDING",
  },
  {
    id: "CHG_NIF_3_8_1_SOURCE",
    national_indicator_code: "NIF_3_8_1",
    version_code: "NIF_3_8_1_V1",
    change_type: "Mapping update",
    field: "global_indicator_code",
    current_value: "NONE",
    proposed_value: "GIND_3_8_1",
    status: "PENDING",
  },
];

const statusVariant = (value?: string) => {
  if (["ACTIVE", "YES", "DIRECT"].includes(value ?? "")) return "secondary";
  if (["DRAFT", "NO", "PARTIAL", "PROXY"].includes(value ?? "")) return "outline";
  if (["MISSING", "NONE", "RETIRED"].includes(value ?? "")) return "destructive";
  return "ghost";
};

function RelatedTable({
  rows,
  columns,
  onAction,
}: {
  rows: MasterRow[];
  columns: { key: string; label: string }[];
  onAction: (mode: NonNullable<DialogState>["mode"], row?: MasterRow) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {columns.map((column) => (
              <TableCell key={column.key} className="max-w-80 whitespace-normal font-mono text-[11px]">
                {["status", "is_active", "mapping_type"].includes(column.key)
                  ? <Badge variant={statusVariant(row[column.key])}>{row[column.key]}</Badge>
                  : row[column.key] ?? "-"}
              </TableCell>
            ))}
            <TableCell>
              <div className="flex gap-1">
                <Button size="icon-xs" variant="outline" aria-label="View" onClick={() => onAction("view", row)}>
                  <Eye aria-hidden="true" className="size-3" />
                </Button>
                <Button size="icon-xs" variant="outline" aria-label="Edit" onClick={() => onAction("edit", row)}>
                  <Edit3 aria-hidden="true" className="size-3" />
                </Button>
                <Button size="icon-xs" variant="destructive" aria-label="Delete" onClick={() => onAction("delete", row)}>
                  <Trash2 aria-hidden="true" className="size-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SelectField({ label, value, options }: { label: string; value?: string; options: MasterRow[] }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={value}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.national_indicator_code ?? option.global_indicator_code ?? option.node_code ?? option.organization_code ?? option.officer_code ?? option.periodicity_code ?? option.unit_code ?? option.id}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value }: { label: string; value?: string }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <Input defaultValue={value ?? ""} />
    </label>
  );
}

function IndicatorDialog({ dialog, onClose }: { dialog: DialogState; onClose: () => void }) {
  if (!dialog) return null;

  const isDelete = dialog.mode === "delete";
  const row = dialog.row;
  const entity = dialog.entity ?? "indicator";
  const isFormMode = ["create", "edit", "map"].includes(dialog.mode);
  const isIndicatorForm = isFormMode && (entity === "indicator" || entity === "global-mapping");
  const isSourceForm = isFormMode && entity === "source";
  const isGenericRelatedForm = isFormMode && ["version", "measure", "metadata"].includes(entity);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="indicator-dialog-title">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Indicator management</p>
            <h2 id="indicator-dialog-title" className="text-xl font-bold">{dialog.title}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-5">
          {dialog.mode === "view" && row ? (
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
              Confirm delete for <strong>{row.national_indicator_code ?? row.id}</strong>. Related versions, mappings, assignments, requests, validation, and review history must be checked.
            </div>
          ) : null}

          {isIndicatorForm ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
                <TextField label="national_indicator_code" value={row?.national_indicator_code} />
                <TextField label="indicator_number" value={row?.indicator_number} />
                <TextField label="owning_unit_code" value={row?.owning_unit_code ?? "SDG"} />
                <SelectField label="framework_node" value={row?.mapped_node_code} options={indicatorMappingNodeOptions} />
              </div>
              <TextField label="name" value={row?.name} />
              <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
                <SelectField label="global_indicator" value={row?.global_indicator_code} options={globalIndicatorOptions} />
                <TextField label="status" value={row?.status ?? "ACTIVE"} />
                <TextField label="color_value" value={row?.color_value} />
                <TextField label="sort_order" value={row?.sort_order ?? "10"} />
              </div>
              <div className="rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
                Source ministry, department, officer, and cadence are managed as multiple rows from the Sources tab.
              </div>
            </div>
          ) : null}

          {isSourceForm ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-2">
                <SelectField label="national_indicator" value={row?.national_indicator_code} options={nationalIndicators} />
                <SelectField label="source_organization" value={row?.source_organization_code} options={organizationOptions} />
                <SelectField label="officer" value={row?.officer_code} options={officerOptions} />
                <SelectField label="periodicity" value={row?.periodicity_code} options={periodicityOptions} />
                <label className="grid gap-1 text-xs font-semibold">
                  assignment_role
                  <select className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={row?.assignment_role ?? "PRIMARY_SOURCE"}>
                    <option>PRIMARY_SOURCE</option>
                    <option>SECONDARY_SOURCE</option>
                    <option>REVIEW_SOURCE</option>
                  </select>
                </label>
                <TextField label="valid_from" value={row?.valid_from ?? "2025-04-01"} />
              </div>
              <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Add one row per source. The same indicator can have primary, secondary, and review source assignments.
              </div>
            </div>
          ) : null}

          {isGenericRelatedForm ? (
            <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
              {Object.entries(row ?? {}).filter(([key]) => key !== "id").map(([key, value]) => (
                <TextField key={key} label={key} value={value} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/70 bg-muted/40 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          {dialog.mode !== "view" ? (
            <Button type="button" variant={isDelete ? "destructive" : "default"} onClick={onClose}>
              {isDelete ? "Delete" : "Save/Submit"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function IndicatorManagementPage() {
  const [query, setQuery] = useState("");
  const [selectedIndicatorCode, setSelectedIndicatorCode] = useState(nationalIndicators[0]?.national_indicator_code ?? "");
  const [activeTab, setActiveTab] = useState<IndicatorTab>("overview");
  const [dialog, setDialog] = useState<DialogState>(null);

  const selectedIndicator = nationalIndicators.find((indicator) => indicator.national_indicator_code === selectedIndicatorCode) ?? nationalIndicators[0];
  const indicatorVersions = versions.filter((item) => item.national_indicator_code === selectedIndicator?.national_indicator_code);
  const indicatorMeasures = measures.filter((item) => indicatorVersions.some((version) => version.version_code === item.version_code));
  const indicatorMetadata = metadataDetails.filter((item) => indicatorVersions.some((version) => version.version_code === item.version_code));
  const indicatorGlobalMappings = globalMappings.filter((item) => item.national_indicator_code === selectedIndicator?.national_indicator_code);
  const indicatorSources = sourceAssignments.filter((item) => item.national_indicator_code === selectedIndicator?.national_indicator_code);

  const filteredIndicators = useMemo(
    () => nationalIndicators.filter((item) => Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const openDialog = (
    mode: NonNullable<DialogState>["mode"],
    title: string,
    row?: MasterRow,
    entity: DialogEntity = "indicator",
  ) => setDialog({ mode, title, row, entity });

  const tabConfig: { code: IndicatorTab; label: string }[] = [
    { code: "overview", label: "Overview" },
    { code: "versions", label: "Versions" },
    { code: "measures", label: "Measures" },
    { code: "metadata", label: "Metadata" },
    { code: "global-mapping", label: "Global mapping" },
    { code: "sources", label: "Sources" },
  ];
  const currentVersion = indicatorVersions.find((item) => item.is_current === "YES") ?? indicatorVersions[0];
  const selectedVersionChanges = activeVersionChanges.filter((item) => item.national_indicator_code === selectedIndicator?.national_indicator_code);

  return (
    <AppShell persona="Super Admin" activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="indicator-management-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="indicator-management-title" className="text-2xl font-bold">Indicator Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage national indicators, versions, metadata, global mappings, and multiple source assignments.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Download aria-hidden="true" className="size-4" /> Format</Button>
            <Button variant="outline"><FileUp aria-hidden="true" className="size-4" /> Bulk upload</Button>
            <Button onClick={() => openDialog("create", "Create national indicator")}><Plus aria-hidden="true" className="size-4" /> New indicator</Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
          {[
            ["National indicators", nationalIndicators.length, "metadata.national_indicators"],
            ["Global mappings", globalMappings.length, "metadata.national_global_indicator_mappings"],
            ["Versions", versions.length, "metadata.indicator_versions"],
            ["Measures", measures.length, "metadata.indicator_measures"],
          ].map(([label, value, helper]) => (
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
              <h2 className="text-base font-bold">National indicator records</h2>
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search indicators</span>
                <Input className="border-0 bg-transparent" placeholder="Search code, name, node, status" value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead>Mapped framework node</TableHead>
                  <TableHead>Global</TableHead>
                  <TableHead>Sources</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicators.map((indicator) => {
                  const sourceCount = sourceAssignments.filter((item) => item.national_indicator_code === indicator.national_indicator_code).length;
                  const global = globalMappings.find((item) => item.national_indicator_code === indicator.national_indicator_code);
                  return (
                    <TableRow key={indicator.id} className={selectedIndicatorCode === indicator.national_indicator_code ? "bg-accent/60" : ""}>
                      <TableCell className="max-w-80 whitespace-normal">
                        <button type="button" className="text-left" onClick={() => setSelectedIndicatorCode(indicator.national_indicator_code ?? "")}>
                          <span className="block font-mono text-[11px]">{indicator.national_indicator_code}</span>
                          <span className="block font-semibold">{indicator.indicator_number} {indicator.name}</span>
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{indicator.mapped_node_path}</TableCell>
                      <TableCell><Badge variant={statusVariant(global?.global_indicator_code)}>{global?.global_indicator_code ?? "NONE"}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{sourceCount} source(s)</Badge></TableCell>
                      <TableCell><Badge variant={statusVariant(indicator.status)}>{indicator.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon-xs" variant="outline" aria-label="View" onClick={() => openDialog("view", "Indicator detail", indicator)}><Eye aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Edit" onClick={() => openDialog("edit", "Edit national indicator", indicator)}><Edit3 aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Map" onClick={() => openDialog("map", "Map indicator", indicator, "global-mapping")}><Link2 aria-hidden="true" className="size-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">{selectedIndicator?.indicator_number} {selectedIndicator?.name}</h2>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{selectedIndicator?.national_indicator_code}</p>
              </div>
              <Button variant="outline" onClick={() => openDialog("edit", "Edit selected indicator", selectedIndicator)}>Edit selected</Button>
            </div>

            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Indicator detail tabs">
              {tabConfig.map((tab) => (
                <button
                  key={tab.code}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.code}
                  onClick={() => setActiveTab(tab.code)}
                  className={[
                    "shrink-0 border-b-2 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground",
                    activeTab === tab.code ? "border-primary text-primary" : "border-transparent",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" ? (
              <div className="grid gap-3">
                <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
                  {[
                    ["Framework node", selectedIndicator?.mapped_node_code],
                    ["Node path", selectedIndicator?.mapped_node_path],
                    ["Owning unit", selectedIndicator?.owning_unit_code],
                    ["Status", selectedIndicator?.status],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-muted/50 p-3">
                      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                      <p className="mt-1 break-words font-mono text-[11px] font-bold">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-[280px_minmax(0,1fr)] gap-3 max-lg:grid-cols-1">
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-semibold text-muted-foreground">Active version</p>
                    <p className="mt-1 font-mono text-sm font-bold">{currentVersion?.version_code ?? "No active version"}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {currentVersion?.data_type ?? "-"} / {currentVersion?.unit_of_measure_code ?? "-"} / {currentVersion?.decimal_places ?? "-"} decimals
                    </p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{indicatorMeasures.length} measure(s) configured for this indicator.</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-muted-foreground">Pending changes against active version</p>
                      <Badge variant={selectedVersionChanges.length ? "outline" : "secondary"}>{selectedVersionChanges.length}</Badge>
                    </div>
                    <div className="mt-2 grid gap-2">
                      {(selectedVersionChanges.length ? selectedVersionChanges : [{ id: "none", change_type: "No pending change", field: "-", current_value: "-", proposed_value: "-", status: "READY" }]).map((change) => (
                        <div key={change.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-[11px] max-lg:grid-cols-2">
                          <span className="font-semibold">{change.change_type}</span>
                          <span>{change.field}</span>
                          <span className="truncate">{change.current_value}{" -> "}{change.proposed_value}</span>
                          <Badge variant={statusVariant(change.status)}>{change.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === "versions" ? (
              <RelatedTable
                rows={indicatorVersions}
                columns={[
                  { key: "version_code", label: "Version" },
                  { key: "data_type", label: "Data type" },
                  { key: "unit_of_measure_code", label: "Unit" },
                  { key: "decimal_places", label: "Decimals" },
                  { key: "is_current", label: "Current" },
                ]}
                onAction={(mode, row) => openDialog(mode, "Indicator version", row, "version")}
              />
            ) : null}

            {activeTab === "measures" ? (
              <div className="grid gap-3">
                <div className="flex justify-end">
                  <Button onClick={() => openDialog("create", "Add indicator measure", currentVersion, "measure")}>
                    <Plus aria-hidden="true" className="size-4" />
                    Add measure
                  </Button>
                </div>
                <RelatedTable
                  rows={indicatorMeasures}
                  columns={[
                    { key: "version_code", label: "Version" },
                    { key: "measure_code", label: "Measure" },
                    { key: "value_type", label: "Type" },
                    { key: "unit_code", label: "Unit" },
                    { key: "decimal_places", label: "Decimals" },
                    { key: "validation_rule_code", label: "Validation" },
                    { key: "aggregation_type", label: "Aggregation" },
                    { key: "is_required", label: "Required" },
                  ]}
                  onAction={(mode, row) => openDialog(mode, "Indicator measure", row, "measure")}
                />
              </div>
            ) : null}

            {activeTab === "metadata" ? (
              <RelatedTable
                rows={indicatorMetadata}
                columns={[
                  { key: "version_code", label: "Version" },
                  { key: "data_reference_period", label: "Reference period" },
                  { key: "latest_data_availability", label: "Availability" },
                  { key: "source_reference_code", label: "Source ref" },
                  { key: "is_active", label: "Active" },
                ]}
                onAction={(mode, row) => openDialog(mode, "Metadata detail", row, "metadata")}
              />
            ) : null}

            {activeTab === "global-mapping" ? (
              <RelatedTable
                rows={indicatorGlobalMappings}
                columns={[
                  { key: "national_indicator_code", label: "National" },
                  { key: "global_indicator_code", label: "Global" },
                  { key: "mapping_type", label: "Type" },
                  { key: "mapping_note", label: "Note" },
                  { key: "is_active", label: "Active" },
                ]}
                onAction={(mode, row) => openDialog(mode, "Global mapping", row, "global-mapping")}
              />
            ) : null}

            {activeTab === "sources" ? (
              <div className="grid gap-3">
                <div className="flex justify-end">
                  <Button onClick={() => openDialog("create", "Add source assignment", selectedIndicator, "source")}>
                    <Plus aria-hidden="true" className="size-4" />
                    Add source
                  </Button>
                </div>
                <RelatedTable
                  rows={indicatorSources}
                  columns={[
                    { key: "source_organization_code", label: "Source org" },
                    { key: "officer_code", label: "Officer" },
                    { key: "periodicity_code", label: "Periodicity" },
                    { key: "assignment_role", label: "Role" },
                    { key: "is_active", label: "Active" },
                  ]}
                  onAction={(mode, row) => openDialog(mode, "Source assignment", row, "source")}
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <IndicatorDialog dialog={dialog} onClose={() => setDialog(null)} />
    </AppShell>
  );
}
