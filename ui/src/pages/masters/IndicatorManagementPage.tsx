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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { ApiError } from "@/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  indicatorMappingNodeOptions,
  type MasterRow,
} from "@/data/mastersManagement.sample";
import { useLanguage } from "@/providers/language-context";
import { mastersService } from "@/services/mastersService";
import type {
  IndicatorDetail,
  FrameworkEditionListItem,
  IndicatorListItem,
  IndicatorVersionDetail,
  OfficerListItem,
  OrganizationListItem,
  PeriodicityListItem,
  SourceAssignmentListItem,
} from "@/types/masters";

type IndicatorTab = "overview" | "versions" | "measures" | "metadata" | "global-mapping" | "sources";
type DialogEntity = "indicator" | "version" | "measure" | "metadata" | "global-mapping" | "source";
type DialogState = {
  mode: "view" | "create" | "edit" | "delete" | "map";
  title: string;
  row?: MasterRow;
  entity?: DialogEntity;
} | null;

const globalMappings: MasterRow[] = [];
const globalIndicatorMappingOptions: MasterRow[] = [
  {
    id: "SDG_1_2_1",
    global_indicator_code: "SDG_1_2_1",
    indicator_number: "1.2.1",
    name: "SDG global indicator 1.2.1",
    status: "ACTIVE",
  },
];

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

function safeApiMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sign in again to load indicator data.";
    if (error.status === 403) return "You do not have permission to view indicator data.";
    if (error.status === 0) return "Unable to reach the API.";
    if (typeof error.detail === "object" && error.detail && "detail" in error.detail) {
      return String(error.detail.detail);
    }
  }

  if (error instanceof Error) return error.message;

  return "Indicator data is temporarily unavailable.";
}

function valueToString(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value ? "YES" : "NO";
  return String(value);
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value || null;
}

function readBoolean(formData: FormData, key: string, fallback = true) {
  const value = readString(formData, key).toUpperCase();
  if (!value) return fallback;
  return value === "YES" || value === "TRUE" || value === "ACTIVE";
}

function readInteger(formData: FormData, key: string, fallback?: number) {
  const value = readString(formData, key);
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildVersionCode(indicatorCode: string, versionNumber = 1) {
  const normalizedIndicatorCode = indicatorCode.trim().toUpperCase();
  if (!normalizedIndicatorCode) return "";
  return `${normalizedIndicatorCode}_V${versionNumber}`;
}

function indicatorToRow(indicator: IndicatorListItem): MasterRow {
  return {
    id: indicator.national_indicator_code,
    national_indicator_code: indicator.national_indicator_code,
    indicator_number: indicator.indicator_number,
    name: indicator.name,
    description: indicator.description ?? undefined,
    owning_unit_code: indicator.owning_unit_code ?? undefined,
    framework_code: indicator.framework_code ?? undefined,
    edition_code: indicator.edition_code ?? undefined,
    current_version_code: indicator.current_version_code ?? undefined,
    mapped_node_code: "NOT_AVAILABLE",
    mapped_node_path: "Framework mapping not available",
    status: indicator.status ?? "ACTIVE",
    color_value: indicator.color_value ?? undefined,
  };
}

function sourceToRow(source: SourceAssignmentListItem): MasterRow {
  return {
    id: `${source.national_indicator_code}-${source.source_organization_code}-${source.assignment_role ?? "SOURCE"}`,
    national_indicator_code: source.national_indicator_code,
    source_organization_code: source.source_organization_code,
    source_organization_name: source.source_organization_name ?? undefined,
    officer_code: source.officer_code ?? undefined,
    officer_display_name: source.officer_display_name ?? undefined,
    periodicity_code: source.periodicity_code ?? undefined,
    assignment_role: source.assignment_role ?? undefined,
    valid_from: source.valid_from ?? undefined,
    valid_to: source.valid_to ?? undefined,
    is_active: valueToString(source.is_active ?? true),
  };
}

function versionToRows(
  selectedIndicatorCode: string | undefined,
  detail?: IndicatorDetail,
  version?: IndicatorVersionDetail,
): MasterRow[] {
  const detailVersions = detail?.versions ?? [];
  const versionRows = detailVersions.map((item) => ({
    id: item.version_code,
    national_indicator_code: selectedIndicatorCode,
    version_code: item.version_code,
    data_type: item.version_code === version?.version_code ? version.data_type ?? undefined : undefined,
    unit_of_measure_code: item.version_code === version?.version_code ? version.unit_of_measure_code ?? undefined : undefined,
    decimal_places: item.version_code === version?.version_code ? valueToString(version.decimal_places) : undefined,
    is_current: valueToString(item.is_current),
    status: "ACTIVE",
  }));

  if (version && !versionRows.some((item) => item.version_code === version.version_code)) {
    versionRows.push({
      id: version.version_code,
      national_indicator_code: version.national_indicator_code,
      version_code: version.version_code,
      data_type: version.data_type ?? undefined,
      unit_of_measure_code: version.unit_of_measure_code ?? undefined,
      decimal_places: valueToString(version.decimal_places),
      is_current: "YES",
      status: "ACTIVE",
    });
  }

  return versionRows;
}

function metadataRowsFromVersion(version?: IndicatorVersionDetail): MasterRow[] {
  if (!version) return [];

  return (version.measures ?? []).map((measure) => ({
    id: `${version.version_code}-${measure.measure_code}`,
    version_code: version.version_code,
    measure_code: measure.measure_code,
    value_type: measure.value_type ?? undefined,
    unit_code: measure.unit_code ?? version.unit_of_measure_code ?? undefined,
    is_required: valueToString(measure.is_required),
    name: measure.name ?? undefined,
    is_active: "YES",
  }));
}

function organizationRows(items: OrganizationListItem[]): MasterRow[] {
  return items.map((item) => ({
    id: item.organization_code,
    organization_code: item.organization_code,
    organization_type: item.organization_type,
    parent_organization_code: item.parent_organization_code ?? undefined,
    short_code: item.short_code ?? undefined,
    name: item.name,
    is_active: "YES",
  }));
}

function officerRows(items: OfficerListItem[]): MasterRow[] {
  return items.map((item) => ({
    id: item.officer_code,
    officer_code: item.officer_code,
    display_name: item.display_name,
    email: item.email ?? undefined,
    mobile_number: item.mobile_number ?? undefined,
    designation: item.designation ?? undefined,
    organization_code: item.organization_code,
    is_active: "YES",
  }));
}

function periodicityRows(items: PeriodicityListItem[]): MasterRow[] {
  return items.map((item) => ({
    id: item.periodicity_code,
    periodicity_code: item.periodicity_code,
    months_interval: valueToString(item.months_interval),
    name: item.name,
    is_active: "YES",
  }));
}

function RelatedTable({
  rows,
  columns,
  onAction,
  onCreate,
  createDisabled = false,
  createTitle = "Add",
}: {
  rows: MasterRow[];
  columns: { key: string; label: string }[];
  onAction: (mode: NonNullable<DialogState>["mode"], row?: MasterRow) => void;
  onCreate?: () => void;
  createDisabled?: boolean;
  createTitle?: string;
}) {
  return (
    <div className="grid gap-2">
      {onCreate ? (
        <div className="flex justify-end">
          <Button size="sm" onClick={onCreate} disabled={createDisabled} title={createTitle}>
            <Plus aria-hidden="true" className="size-4" />
            Add
          </Button>
        </div>
      ) : null}
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
                  <Button size="icon-xs" variant="destructive" aria-label="Deactivate" onClick={() => onAction("delete", row)}>
                    <Trash2 aria-hidden="true" className="size-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SelectField({ label, value, options, name = label, required = false }: { label: string; value?: string; options: MasterRow[]; name?: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <select name={name} className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={value} required={required}>
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

function TextField({
  label,
  value,
  name = label,
  required = false,
  className = "",
}: {
  label: string;
  value?: string;
  name?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={["grid min-w-0 gap-1 text-xs font-semibold", className].join(" ")}>
      {label}
      <Input name={name} defaultValue={value ?? ""} required={required} />
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
  name = label,
  required = false,
  className = "",
}: {
  label: string;
  value?: string;
  name?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={["grid min-w-0 gap-1 text-xs font-semibold", className].join(" ")}>
      {label}
      <Input name={name} value={value ?? ""} readOnly required={required} className="bg-muted/60" />
    </label>
  );
}

type FrameworkEditionOption = {
  label: string;
  value: string;
  framework_code: string;
  edition_code: string;
  status: string;
  is_active?: boolean;
};

function FrameworkEditionField({
  value,
  options,
  isLoading = false,
  error,
  onRetry,
  className = "",
}: {
  value?: string;
  options: FrameworkEditionOption[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const isSearchable = options.length > 10;
  
  const filteredOptions = useMemo(() => {
    if (!isSearchable || !searchTerm) return options;
    return options.filter((opt) => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.edition_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, isSearchable]);

  if (error) {
    return (
      <div className={["grid min-w-0 gap-2 text-xs font-semibold", className].join(" ")}>
        <label>framework_edition</label>
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-red-700 text-xs font-medium mb-2">{error}</p>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} type="button">
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={["grid min-w-0 gap-1 text-xs font-semibold", className].join(" ")}>
        <label>framework_edition</label>
        <div className="h-9 rounded-md border border-input bg-input/20 flex items-center px-2">
          <Loader className="size-3" />
          <span className="ml-2 text-xs text-muted-foreground">Loading framework editions...</span>
        </div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className={["grid min-w-0 gap-1 text-xs font-semibold", className].join(" ")}>
        <label>framework_edition</label>
        <div className="h-9 rounded-md border border-input bg-input/20 flex items-center px-2 text-muted-foreground">
          No active framework editions available
        </div>
      </div>
    );
  }

  return (
    <div className={["grid min-w-0 gap-1 text-xs font-semibold", className].join(" ")}>
      <label>framework_edition</label>
      {isSearchable && (
        <input
          type="text"
          placeholder="Search framework editions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 min-w-0 rounded-md border border-input bg-input/20 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}
      <select 
        name="framework_edition_key" 
        className="h-9 min-w-0 rounded-md border border-input bg-input/20 px-2 text-xs" 
        defaultValue={value} 
        required
      >
        <option value="">Select framework edition</option>
        {filteredOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.edition_code})
          </option>
        ))}
      </select>
      {isSearchable && filteredOptions.length === 0 && (
        <p className="text-xs text-muted-foreground">No matches found</p>
      )}
    </div>
  );
}

function IndicatorDialog({
  dialog,
  selectedIndicator,
  selectedVersion,
  selectedUnitCode,
  frameworkEditionOptions,
  frameworkEditionsLoading,
  frameworkEditionsError,
  onRetryFrameworkEditions,
  organizationRowsData,
  officerRowsData,
  periodicityRowsData,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: {
  dialog: DialogState;
  selectedIndicator?: MasterRow;
  selectedVersion?: MasterRow;
  selectedUnitCode: string;
  frameworkEditionOptions: FrameworkEditionOption[];
  frameworkEditionsLoading?: boolean;
  frameworkEditionsError?: string | null;
  onRetryFrameworkEditions?: () => void;
  organizationRowsData: MasterRow[];
  officerRowsData: MasterRow[];
  periodicityRowsData: MasterRow[];
  isSubmitting: boolean;
  errorMessage?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  if (!dialog) return null;

  const isDelete = dialog.mode === "delete";
  const row = dialog.row;
  const entity = dialog.entity ?? "indicator";
  const isFormMode = ["create", "edit", "map"].includes(dialog.mode);
  const isIndicatorForm = isFormMode && entity === "indicator";
  const isVersionForm = isFormMode && entity === "version";
  const isMeasureForm = isFormMode && (entity === "measure" || entity === "metadata");
  const isGlobalMappingForm = isFormMode && entity === "global-mapping";
  const isSourceForm = isFormMode && entity === "source";
  const activeFrameworkCode = row?.framework_code ?? selectedIndicator?.framework_code ?? "SDG_NIF";
  const activeEditionCode = row?.edition_code ?? selectedIndicator?.edition_code ?? "SDG_NIF_2025";
  const activeFrameworkEditionKey = activeEditionCode;
  const activeIndicatorCode = row?.national_indicator_code ?? selectedIndicator?.national_indicator_code ?? "";
  const activeVersionCode = row?.version_code ?? selectedVersion?.version_code ?? selectedIndicator?.current_version_code ?? "";
  const defaultVersionNumber = row?.version_number ?? "1";
  const defaultVersionCode = row?.version_code ?? buildVersionCode(activeIndicatorCode, Number.parseInt(defaultVersionNumber, 10) || 1);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="indicator-dialog-title">
      <form onSubmit={onSubmit} className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
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
              Confirm deactivate for <strong>{row.national_indicator_code ?? row.version_code ?? row.measure_code ?? row.global_indicator_code ?? row.source_organization_code ?? row.id}</strong>. Related versions, mappings, assignments, requests, validation, and review history must be checked.
              {Object.entries(row).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value ?? ""} />
              ))}
            </div>
          ) : null}

          {isIndicatorForm ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-6 gap-3 max-lg:grid-cols-2">
                <FrameworkEditionField 
                  value={activeFrameworkEditionKey} 
                  options={frameworkEditionOptions} 
                  isLoading={frameworkEditionsLoading}
                  error={frameworkEditionsError}
                  onRetry={onRetryFrameworkEditions}
                  className="col-span-3 max-lg:col-span-2" 
                />
                <TextField label="national_indicator_code" value={row?.national_indicator_code} className="col-span-2 max-lg:col-span-1" />
                <TextField label="indicator_number" value={row?.indicator_number} className="col-span-1 max-lg:col-span-1" />
              </div>
              <TextField label="name" value={row?.name} required />
              <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
                <TextField label="owning_unit_code" value={row?.owning_unit_code ?? (selectedUnitCode || "SDG")} />
                <SelectField label="framework_node" name="node_code" value={row?.mapped_node_code} options={indicatorMappingNodeOptions} />
                <TextField label="status" value={row?.status ?? "ACTIVE"} />
                <TextField label="color_value" value={row?.color_value} />
              </div>
              <div className="rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
                If a framework node is selected, the UI also submits the framework-indicator mapping after saving the indicator.
              </div>
            </div>
          ) : null}

          {isVersionForm ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
                <TextField label="framework_code" value={row?.framework_code ?? activeFrameworkCode} required />
                <TextField label="edition_code" value={row?.edition_code ?? activeEditionCode} required />
                <TextField label="national_indicator_code" value={activeIndicatorCode} required />
                <TextField label="version_code" value={defaultVersionCode} />
                <TextField label="name" value={row?.name ?? selectedIndicator?.name} required />
                <TextField label="version_number" value={defaultVersionNumber} />
                <TextField label="data_type" value={row?.data_type ?? "NUMERIC"} />
                <TextField label="unit_of_measure_code" value={row?.unit_of_measure_code ?? "PERCENT"} />
                <TextField label="decimal_places" value={row?.decimal_places ?? "2"} />
                <SelectField label="is_current" value={row?.is_current ?? "YES"} options={[{ id: "YES" }, { id: "NO" }]} />
                <TextField label="status" value={row?.status ?? "ACTIVE"} />
              </div>
            </div>
          ) : null}

          {isMeasureForm ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
                <ReadOnlyField label="version_code" value={activeVersionCode} required />
                <TextField label="measure_code" value={row?.measure_code} />
                <TextField label="name" value={row?.name ?? "Indicator value"} required />
                <TextField label="value_type" value={row?.value_type ?? "NUMERIC"} />
                <TextField label="unit_code" value={row?.unit_code ?? "PERCENT"} />
                <TextField label="aggregation_type" value={row?.aggregation_type ?? "SUM"} />
                <SelectField label="is_required" value={row?.is_required ?? "YES"} options={[{ id: "YES" }, { id: "NO" }]} />
                <SelectField label="is_active" value={row?.is_active ?? "YES"} options={[{ id: "YES" }, { id: "NO" }]} />
              </div>
            </div>
          ) : null}

          {isGlobalMappingForm ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
                <TextField label="framework_code" value={row?.framework_code ?? activeFrameworkCode} required />
                <TextField label="edition_code" value={row?.edition_code ?? activeEditionCode} required />
                <TextField label="national_indicator_code" value={activeIndicatorCode} required />
                <SelectField label="global_indicator_code" value={row?.global_indicator_code} options={globalIndicatorMappingOptions} required />
                <TextField label="mapping_type" value={row?.mapping_type ?? "DIRECT"} />
                <TextField label="mapping_note" value={row?.mapping_note} />
                <SelectField label="is_active" value={row?.global_indicator_code ? row?.is_active ?? "YES" : "YES"} options={[{ id: "YES" }, { id: "NO" }]} />
              </div>
            </div>
          ) : null}

          {isSourceForm ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-3 max-lg:grid-cols-2">
                <TextField label="framework_code" value={row?.framework_code ?? activeFrameworkCode} required />
                <TextField label="edition_code" value={row?.edition_code ?? activeEditionCode} required />
                <TextField label="national_indicator_code" value={activeIndicatorCode} required />
                <SelectField label="source_organization_code" value={row?.source_organization_code} options={organizationRowsData} />
                <SelectField label="officer_code" value={row?.officer_code} options={officerRowsData} />
                <SelectField label="periodicity_code" value={row?.periodicity_code} options={periodicityRowsData} />
                <label className="grid gap-1 text-xs font-semibold">
                  assignment_role
                  <select name="assignment_role" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={row?.assignment_role ?? "PRIMARY_SOURCE"}>
                    <option value="PRIMARY_SOURCE">PRIMARY_SOURCE</option>
                    <option value="SECONDARY_SOURCE">SECONDARY_SOURCE</option>
                    <option value="REVIEW_SOURCE">REVIEW_SOURCE</option>
                  </select>
                </label>
                <TextField label="valid_from" value={row?.valid_from ?? "2025-04-01"} />
                <SelectField label="is_active" value={row?.is_active ?? "YES"} options={[{ id: "YES" }, { id: "NO" }]} />
              </div>
              <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Add one row per source. The same indicator can have primary, secondary, and review source assignments.
              </div>
            </div>
          ) : null}

        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/70 bg-muted/40 px-5 py-4">
          {errorMessage ? <span className="mr-auto text-xs font-semibold text-red-700">{errorMessage}</span> : null}
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          {dialog.mode !== "view" ? (
            <Button type="submit" variant={isDelete ? "destructive" : "default"} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isDelete ? "Deactivate" : "Save/Submit"}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export function IndicatorManagementPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const selectedUnitCode = searchParams.get("unit_code") ?? "";
  const [query, setQuery] = useState("");
  const [selectedIndicatorCode, setSelectedIndicatorCode] = useState("");
  const [activeTab, setActiveTab] = useState<IndicatorTab>("overview");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const indicatorsQuery = useQuery({
    queryKey: ["masters", "indicators", language, selectedUnitCode],
    queryFn: () => mastersService.listIndicators({ locale: language, unitCode: selectedUnitCode || undefined }),
  });

  const frameworkEditionsQuery = useQuery({
    queryKey: ["masters", "framework-editions", language],
    queryFn: () => mastersService.listFrameworkEditions({ locale: language, includeInactive: false }),
  });

  const sourceAssignmentsQuery = useQuery({
    queryKey: ["masters", "source-assignments", language, selectedUnitCode],
    queryFn: () => mastersService.listSourceAssignments({ locale: language, unitCode: selectedUnitCode || undefined }),
  });

  const organizationsQuery = useQuery({
    queryKey: ["masters", "organizations", language],
    queryFn: () => mastersService.listOrganizations({ locale: language }),
  });

  const officersQuery = useQuery({
    queryKey: ["masters", "officers", language],
    queryFn: () => mastersService.listOfficers({ locale: language }),
  });

  const periodicitiesQuery = useQuery({
    queryKey: ["masters", "periodicities", language],
    queryFn: () => mastersService.listPeriodicities({ locale: language }),
  });

  const liveNationalIndicatorRows = useMemo(
    () => (indicatorsQuery.data?.data ?? []).map(indicatorToRow),
    [indicatorsQuery.data],
  );
  const nationalIndicatorRows = liveNationalIndicatorRows;
  
  const frameworkEditionOptions = useMemo((): FrameworkEditionOption[] => {
    // Filter active framework editions from API response
    const activeFrameworkEditions = (frameworkEditionsQuery.data?.data ?? []).filter(
      (item) => item.status === "ACTIVE" && (item.is_active !== false)
    );
    
    // Convert to FrameworkEditionOption format
    const options: FrameworkEditionOption[] = activeFrameworkEditions.map((item) => ({
      label: item.name,
      value: item.edition_code,
      framework_code: item.framework_code,
      edition_code: item.edition_code,
      status: item.status,
      is_active: item.is_active,
    }));
    
    // Keep track of existing options to avoid duplicates
    const existingValues = new Set(options.map((opt) => opt.value));

    // Add fallback framework editions from indicators if not already present
    for (const indicator of nationalIndicatorRows) {
      if (indicator.framework_code && indicator.edition_code) {
        if (!existingValues.has(indicator.edition_code)) {
          options.push({
            label: `${indicator.framework_code} / ${indicator.edition_code}`,
            value: indicator.edition_code,
            framework_code: indicator.framework_code,
            edition_code: indicator.edition_code,
            status: "ACTIVE",
            is_active: true,
          });
          existingValues.add(indicator.edition_code);
        }
      }
    }

    return options;
  }, [frameworkEditionsQuery.data, nationalIndicatorRows]);
  const selectedIndicator = nationalIndicatorRows.find((indicator) => indicator.national_indicator_code === selectedIndicatorCode) ?? nationalIndicatorRows[0];

  const selectedIndicatorDetailQuery = useQuery({
    queryKey: ["masters", "indicator-detail", language, selectedUnitCode, selectedIndicator?.national_indicator_code],
    queryFn: () => mastersService.getIndicator({
      indicatorCode: selectedIndicator?.national_indicator_code ?? "",
      locale: language,
      unitCode: selectedUnitCode || undefined,
    }),
    enabled: Boolean(selectedIndicator?.national_indicator_code),
  });

  const selectedVersionCode =
    selectedIndicatorDetailQuery.data?.data.current_version_code ??
    selectedIndicator?.current_version_code;

  const selectedVersionQuery = useQuery({
    queryKey: ["masters", "indicator-version", language, selectedUnitCode, selectedVersionCode],
    queryFn: () => mastersService.getIndicatorVersion({
      versionCode: selectedVersionCode ?? "",
      locale: language,
      unitCode: selectedUnitCode || undefined,
    }),
    enabled: Boolean(selectedVersionCode),
  });

  const liveIndicatorVersions = useMemo(
    () => versionToRows(
      selectedIndicator?.national_indicator_code,
      selectedIndicatorDetailQuery.data?.data,
      selectedVersionQuery.data?.data,
    ),
    [selectedIndicator?.national_indicator_code, selectedIndicatorDetailQuery.data, selectedVersionQuery.data],
  );
  const indicatorVersions = liveIndicatorVersions.length
    ? liveIndicatorVersions
    : [];
  const currentVersion = indicatorVersions.find((item) => item.is_current === "YES") ?? indicatorVersions[0];
  const indicatorMetadataRows = metadataRowsFromVersion(selectedVersionQuery.data?.data);
  const indicatorMeasures = indicatorMetadataRows.length
    ? indicatorMetadataRows
    : [];
  const indicatorGlobalMappings = globalMappings.filter((item) => item.national_indicator_code === selectedIndicator?.national_indicator_code);
  const liveSourceAssignmentRows = useMemo(
    () => (sourceAssignmentsQuery.data?.data ?? selectedIndicatorDetailQuery.data?.data.source_assignments ?? []).map(sourceToRow),
    [sourceAssignmentsQuery.data, selectedIndicatorDetailQuery.data],
  );
  const sourceAssignmentRows = liveSourceAssignmentRows;
  const indicatorSources = sourceAssignmentRows.filter((item) => item.national_indicator_code === selectedIndicator?.national_indicator_code);
  const organizationRowsData = useMemo(
    () => (organizationsQuery.data?.data ? organizationRows(organizationsQuery.data.data) : []),
    [organizationsQuery.data],
  );
  const officerRowsData = useMemo(
    () => (officersQuery.data?.data ? officerRows(officersQuery.data.data) : []),
    [officersQuery.data],
  );
  const periodicityRowsData = useMemo(
    () => (periodicitiesQuery.data?.data ? periodicityRows(periodicitiesQuery.data.data) : []),
    [periodicitiesQuery.data],
  );
  const selectedVersionChanges = activeVersionChanges.filter((item) => item.national_indicator_code === selectedIndicator?.national_indicator_code);
  const isLiveDataLoading =
    indicatorsQuery.isFetching ||
    frameworkEditionsQuery.isFetching ||
    sourceAssignmentsQuery.isFetching ||
    organizationsQuery.isFetching ||
    officersQuery.isFetching ||
    periodicitiesQuery.isFetching ||
    selectedIndicatorDetailQuery.isFetching ||
    selectedVersionQuery.isFetching;
  const liveDataError =
    indicatorsQuery.error ||
    frameworkEditionsQuery.error ||
    sourceAssignmentsQuery.error ||
    organizationsQuery.error ||
    officersQuery.error ||
    periodicitiesQuery.error ||
    selectedIndicatorDetailQuery.error ||
    selectedVersionQuery.error;

  const filteredIndicators = useMemo(
    () => nationalIndicatorRows.filter((item) => Object.values(item).join(" ").toLowerCase().includes(query.toLowerCase())),
    [nationalIndicatorRows, query],
  );

  const openDialog = (
    mode: NonNullable<DialogState>["mode"],
    title: string,
    row?: MasterRow,
    entity: DialogEntity = "indicator",
  ) => {
    setMutationError(null);
    setMutationMessage(null);
    setDialog({ mode, title, row, entity });
  };

  const invalidateIndicatorQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["masters", "indicators"] }),
      queryClient.invalidateQueries({ queryKey: ["masters", "indicator-detail"] }),
      queryClient.invalidateQueries({ queryKey: ["masters", "indicator-version"] }),
      queryClient.invalidateQueries({ queryKey: ["masters", "source-assignments"] }),
    ]);
  };

  const indicatorMutation = useMutation({
    mutationFn: async ({
      currentDialog,
      formData,
    }: {
      currentDialog: NonNullable<DialogState>;
      formData: FormData;
    }) => {
      const entity = currentDialog.entity ?? "indicator";
      const row = currentDialog.row;
      const isDeactivate = currentDialog.mode === "delete";
      const frameworkEditionKey = readString(formData, "framework_edition_key");
      const selectedFrameworkEdition = frameworkEditionOptions.find((option) => option.value === frameworkEditionKey);
      const frameworkCode =
        selectedFrameworkEdition?.framework_code ||
        readString(formData, "framework_code") ||
        row?.framework_code ||
        selectedIndicator?.framework_code ||
        "SDG_NIF";
      const editionCode =
        selectedFrameworkEdition?.edition_code ||
        readString(formData, "edition_code") ||
        row?.edition_code ||
        selectedIndicator?.edition_code ||
        "SDG_NIF_2025";
      const nationalIndicatorCode = readString(formData, "national_indicator_code") || row?.national_indicator_code || selectedIndicator?.national_indicator_code || "";

      if (entity === "indicator") {
        if (frameworkEditionKey && !selectedFrameworkEdition) {
          throw new Error("Select a valid framework edition before saving the indicator.");
        }

        const body = {
          framework_code: frameworkCode,
          edition_code: editionCode,
          national_indicator_code: nationalIndicatorCode || null,
          indicator_number: readOptionalString(formData, "indicator_number"),
          owning_unit_code: readOptionalString(formData, "owning_unit_code"),
          name: readString(formData, "name") || row?.name || "",
          color_value: readOptionalString(formData, "color_value"),
          status: isDeactivate ? "RETIRED" : readString(formData, "status") || "ACTIVE",
          is_active: !isDeactivate,
        };

        if (currentDialog.mode === "create") {
          await mastersService.createIndicator({ locale: language, body });
        } else {
          await mastersService.updateIndicator({
            indicatorCode: row?.national_indicator_code ?? nationalIndicatorCode,
            locale: language,
            body,
          });
        }

        const nodeCode = readString(formData, "node_code");
        if (!isDeactivate && nodeCode && nationalIndicatorCode) {
          await mastersService.createFrameworkIndicatorMapping({
            locale: language,
            body: {
              framework_code: frameworkCode,
              edition_code: editionCode,
              node_code: nodeCode,
              national_indicator_code: nationalIndicatorCode,
              mapping_type: "PRIMARY",
              is_active: true,
            },
          });
        }

        setSelectedIndicatorCode(nationalIndicatorCode || row?.national_indicator_code || selectedIndicatorCode);
        return;
      }

      if (entity === "version") {
        const versionNumber = readInteger(formData, "version_number", 1) ?? 1;
        const versionCode = readString(formData, "version_code") || row?.version_code || buildVersionCode(nationalIndicatorCode, versionNumber);
        if (!versionCode) {
          throw new Error("Create or select a national indicator before adding a version.");
        }

        const body = {
          framework_code: frameworkCode,
          edition_code: editionCode,
          national_indicator_code: nationalIndicatorCode,
          version_code: versionCode,
          name: readString(formData, "name") || selectedIndicator?.name || "",
          version_number: versionNumber,
          unit_of_measure_code: readOptionalString(formData, "unit_of_measure_code"),
          data_type: readString(formData, "data_type") || "NUMERIC",
          decimal_places: readInteger(formData, "decimal_places"),
          is_current: readBoolean(formData, "is_current", true),
          status: isDeactivate ? "RETIRED" : readString(formData, "status") || "ACTIVE",
        };

        if (currentDialog.mode === "create") {
          await mastersService.createIndicatorVersion({ locale: language, body });
        } else {
          await mastersService.updateIndicatorVersion({
            versionCode: row?.version_code ?? versionCode,
            locale: language,
            body: { ...body, is_current: isDeactivate ? false : body.is_current },
          });
        }
        return;
      }

      if (entity === "metadata" || entity === "measure") {
        const versionCode = row?.version_code || currentVersion?.version_code || selectedVersionCode || "";
        if (!versionCode) {
          throw new Error(entity === "metadata" ? "Create an indicator version before adding measure metadata." : "Create an indicator version before adding a measure.");
        }

        const measureCode = readString(formData, "measure_code") || row?.measure_code || "";
        const body = {
          measure_code: measureCode || null,
          name: readString(formData, "name") || row?.name || "Indicator value",
          value_type: readString(formData, "value_type") || "NUMERIC",
          unit_code: readOptionalString(formData, "unit_code"),
          aggregation_type: readOptionalString(formData, "aggregation_type"),
          is_required: readBoolean(formData, "is_required", true),
          is_active: isDeactivate ? false : readBoolean(formData, "is_active", true),
        };

        if (currentDialog.mode === "create") {
          await mastersService.createIndicatorMeasure({ versionCode, locale: language, body });
        } else {
          await mastersService.updateIndicatorMeasure({
            versionCode,
            measureCode: row?.measure_code ?? measureCode,
            locale: language,
            body,
          });
        }
        return;
      }

      if (entity === "global-mapping") {
        const globalIndicatorCode = readString(formData, "global_indicator_code") || row?.global_indicator_code || "";
        if (!globalIndicatorCode) {
          throw new Error("Select a global indicator before saving the mapping.");
        }

        await mastersService.createNationalGlobalIndicatorMapping({
          locale: language,
          body: {
            framework_code: frameworkCode,
            edition_code: editionCode,
            national_indicator_code: nationalIndicatorCode,
            global_indicator_code: globalIndicatorCode,
            mapping_type: readString(formData, "mapping_type") || "DIRECT",
            mapping_note: readOptionalString(formData, "mapping_note"),
            is_active: currentDialog.mode === "map" ? true : !isDeactivate && readBoolean(formData, "is_active", true),
          },
        });
        return;
      }

      if (entity === "source") {
        await mastersService.createSourceAssignment({
          locale: language,
          body: {
            framework_code: frameworkCode,
            edition_code: editionCode,
            national_indicator_code: nationalIndicatorCode,
            source_organization_code: readString(formData, "source_organization_code") || row?.source_organization_code || "",
            officer_code: readOptionalString(formData, "officer_code"),
            periodicity_code: readOptionalString(formData, "periodicity_code"),
            assignment_role: readString(formData, "assignment_role") || "PRIMARY_SOURCE",
            valid_from: readOptionalString(formData, "valid_from"),
            is_active: !isDeactivate && readBoolean(formData, "is_active", true),
          },
        });
      }
    },
    onSuccess: async () => {
      await invalidateIndicatorQueries();
      setMutationError(null);
      setMutationMessage("Indicator setup saved. Latest API data is being refreshed.");
      setDialog(null);
      window.setTimeout(() => setMutationMessage(null), 5000);
    },
    onError: (error) => {
      setMutationMessage(null);
      setMutationError(safeApiMessage(error));
    },
  });

  const handleDialogSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog) return;
    setMutationError(null);
    indicatorMutation.mutate({
      currentDialog: dialog,
      formData: new FormData(event.currentTarget),
    });
  };

  const tabConfig: { code: IndicatorTab; label: string }[] = [
    { code: "overview", label: "Overview" },
    { code: "versions", label: "Versions" },
    { code: "measures", label: "Measures" },
    { code: "metadata", label: "Metadata" },
    { code: "global-mapping", label: "Global mapping" },
    { code: "sources", label: "Sources" },
  ];

  return (
    <AppShell persona="Super Admin" activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="indicator-management-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="indicator-management-title" className="text-2xl font-bold">Indicator Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage national indicators, versions, metadata, global mappings, and multiple source assignments.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled title="Masters mutation API not available yet"><Download aria-hidden="true" className="size-4" /> Format</Button>
            <Button variant="outline" disabled title="Masters mutation API not available yet"><FileUp aria-hidden="true" className="size-4" /> Bulk upload</Button>
            <Button onClick={() => openDialog("create", "Create indicator", undefined, "indicator")}><Plus aria-hidden="true" className="size-4" /> New indicator</Button>
          </div>
        </div>

        {isLiveDataLoading ? (
          <Loader variant="section" label="Loading Masters indicator data" />
        ) : null}

        {liveDataError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {safeApiMessage(liveDataError)} Data is not available.
          </div>
        ) : null}

        {mutationMessage ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900" role="status">
            {mutationMessage}
          </div>
        ) : null}

        <div className="rounded-md border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Active unit:</span>{" "}
          <span className="font-mono">{selectedUnitCode || "ALL"}</span>
          <span className="mx-2">/</span>
          Unit filter is applied to indicator owning unit and source organization from available GET APIs.
        </div>

        <div className="grid grid-cols-7 gap-3 max-xl:grid-cols-4 max-lg:grid-cols-2">
          {[
            ["National indicators", nationalIndicatorRows.length, "GET /masters/indicators"],
            ["Global mappings", indicatorGlobalMappings.length, "metadata.national_global_indicator_mappings"],
            ["Versions", indicatorVersions.length, "GET /masters/indicator-versions"],
            ["Measures", indicatorMeasures.length, "version measures"],
            ["Sources", sourceAssignmentRows.length, "GET /masters/source-assignments"],
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
                  const sourceCount = sourceAssignmentRows.filter((item) => item.national_indicator_code === indicator.national_indicator_code).length;
                  const global = indicatorGlobalMappings.find((item) => item.national_indicator_code === indicator.national_indicator_code);
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
                          <Button size="icon-xs" variant="outline" aria-label="Edit" onClick={() => openDialog("edit", "Edit indicator", indicator)}><Edit3 aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Map" onClick={() => openDialog("map", "Map indicator", indicator, "global-mapping")}><Link2 aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="destructive" aria-label="Deactivate" onClick={() => openDialog("delete", "Deactivate indicator", indicator)}><Trash2 aria-hidden="true" className="size-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!filteredIndicators.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                      Not available.
                    </TableCell>
                  </TableRow>
                ) : null}
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
                onCreate={() => openDialog("create", "Create indicator version", undefined, "version")}
              />
            ) : null}

            {activeTab === "measures" ? (
              <div className="grid gap-3">
                <div className="flex justify-end">
                  <Button
                    disabled={!currentVersion?.version_code}
                    title={currentVersion?.version_code ? "Add indicator measure" : "Create an indicator version before adding measures"}
                    onClick={() => openDialog("create", "Add indicator measure", currentVersion, "measure")}
                  >
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
                rows={indicatorMetadataRows}
                columns={[
                  { key: "version_code", label: "Version" },
                  { key: "measure_code", label: "Measure" },
                  { key: "value_type", label: "Value type" },
                  { key: "unit_code", label: "Unit" },
                  { key: "is_active", label: "Active" },
                ]}
                onAction={(mode, row) => openDialog(mode, "Metadata detail", row, "metadata")}
                onCreate={() => openDialog("create", "Create measure metadata", undefined, "metadata")}
                createDisabled={!currentVersion?.version_code}
                createTitle={currentVersion?.version_code ? "Create measure metadata" : "Create an indicator version before adding measure metadata"}
              />
            ) : null}

            {activeTab === "global-mapping" ? (
              <div className="grid gap-3">
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
                  National/global mapping create is available, but no GET API is exposed yet for listing saved mappings.
                </div>
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
                  onCreate={() => openDialog("create", "Create global mapping", undefined, "global-mapping")}
                />
              </div>
            ) : null}

            {activeTab === "sources" ? (
              <div className="grid gap-3">
                <div className="flex justify-end">
                  <Button onClick={() => openDialog("create", "Add source assignment", undefined, "source")}>
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

      <IndicatorDialog
        dialog={dialog}
        selectedIndicator={selectedIndicator}
        selectedVersion={currentVersion}
        selectedUnitCode={selectedUnitCode}
        frameworkEditionOptions={frameworkEditionOptions}
        frameworkEditionsLoading={frameworkEditionsQuery.isFetching}
        frameworkEditionsError={frameworkEditionsQuery.error ? safeApiMessage(frameworkEditionsQuery.error) : null}
        onRetryFrameworkEditions={() => frameworkEditionsQuery.refetch()}
        organizationRowsData={organizationRowsData}
        officerRowsData={officerRowsData}
        periodicityRowsData={periodicityRowsData}
        isSubmitting={indicatorMutation.isPending}
        errorMessage={mutationError}
        onSubmit={handleDialogSubmit}
        onClose={() => setDialog(null)}
      />
    </AppShell>
  );
}
