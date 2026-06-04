import { Download, Edit3, Eye, FileUp, Plus, Search, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
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
  getMasterTab,
  type MasterRow,
  type MasterTab,
  type MasterTabCode,
} from "@/data/mastersManagement.sample";
import { useLanguage } from "@/providers/language-context";
import { mastersService } from "@/services/mastersService";
import type {
  IndicatorVersionDetail,
  LocaleListItem,
  OfficerListItem,
  OrganizationListItem,
  PeriodicityListItem,
} from "@/types/masters";

type ReferenceTab = Extract<MasterTabCode, "locales" | "organizations" | "officers" | "periodicities" | "units" | "measures">;
type DialogState = { mode: "view" | "create" | "edit" | "delete"; tab: MasterTab; row?: MasterRow } | null;

const referenceTabCodes: ReferenceTab[] = ["locales", "organizations", "officers", "periodicities", "units", "measures"];
const referenceTabs = referenceTabCodes.map((code) => getMasterTab(code)).filter(Boolean) as MasterTab[];
const organizationTypeOptions = [
  "MINISTRY",
  "DEPARTMENT",
  "DIVISION",
  "DIRECTORATE",
  "BUREAU",
  "BOARD",
  "COMMISSION",
  "OFFICE",
  "REGULATOR",
  "AGENCY",
  "INSTITUTION",
  "OTHER",
];
const measureValueTypeOptions = ["NUMERIC", "INTEGER", "TEXT", "BOOLEAN", "DATE"];
const unsupportedMeasureFormFields = new Set(["decimal_places", "validation_rule_code"]);
const modalFieldLabelClass = "grid gap-1.5 text-xs font-semibold text-slate-700";
const modalInputClass =
  "h-10 border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const modalReadOnlyInputClass =
  "h-10 border-slate-300 bg-slate-100 px-3 text-sm text-slate-600 shadow-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";
const modalSelectClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

const statusVariant = (value?: string) => {
  if (["ACTIVE", "YES", "NUMERIC"].includes(value ?? "")) return "secondary";
  if (["NO", "TEXT", "DATE"].includes(value ?? "")) return "outline";
  if (["RETIRED", "MISSING"].includes(value ?? "")) return "destructive";
  return "ghost";
};

function safeApiMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sign in again to load reference masters.";
    if (error.status === 403) return "You do not have permission to view reference masters.";
    if (error.status === 0) return "Unable to reach the API.";
    if (typeof error.detail === "object" && error.detail && "detail" in error.detail) {
      return String(error.detail.detail);
    }
  }

  if (error instanceof Error) return error.message;

  return "Reference masters are temporarily unavailable.";
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

function localesToRows(items: LocaleListItem[]): MasterRow[] {
  return items.map((item) => ({
    id: item.locale_code,
    locale_code: item.locale_code,
    name: item.display_name ?? item.name ?? item.locale_code,
    native_name: item.native_name ?? undefined,
    is_default: valueToString(item.is_default),
    is_active: valueToString(item.is_active ?? true),
    sort_order: valueToString(item.sort_order),
  }));
}

function organizationsToRows(items: OrganizationListItem[]): MasterRow[] {
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

function officersToRows(items: OfficerListItem[]): MasterRow[] {
  return items.map((item) => ({
    id: item.officer_code,
    officer_code: item.officer_code,
    organization_code: item.organization_code,
    display_name: item.display_name,
    designation: item.designation ?? undefined,
    email: item.email ?? undefined,
    mobile_number: item.mobile_number ?? undefined,
    is_active: "YES",
  }));
}

function periodicitiesToRows(items: PeriodicityListItem[]): MasterRow[] {
  return items.map((item) => ({
    id: item.periodicity_code,
    periodicity_code: item.periodicity_code,
    name: item.name,
    months_interval: valueToString(item.months_interval),
    is_active: "YES",
  }));
}

function measuresFromVersion(version?: IndicatorVersionDetail): MasterRow[] {
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

function unitsFromMeasures(measures: MasterRow[]): MasterRow[] {
  const uniqueUnits = new Map<string, MasterRow>();

  for (const measure of measures) {
    if (!measure.unit_code || uniqueUnits.has(measure.unit_code)) {
      continue;
    }

    uniqueUnits.set(measure.unit_code, {
      id: measure.unit_code,
      unit_code: measure.unit_code,
      name: measure.unit_code,
      unit_type: measure.value_type === "NUMERIC" ? "NUMBER" : measure.value_type,
      symbol: measure.unit_code,
      is_active: "YES",
    });
  }

  return Array.from(uniqueUnits.values());
}

function TextField({ label, value, required = false }: { label: string; value?: string; required?: boolean }) {
  return (
    <label className={modalFieldLabelClass}>
      {label}
      <Input name={label} defaultValue={value ?? ""} required={required} className={modalInputClass} />
    </label>
  );
}

function ReadOnlyField({ label, value, required = false }: { label: string; value?: string; required?: boolean }) {
  return (
    <label className={modalFieldLabelClass}>
      {label}
      <Input name={label} value={value ?? ""} readOnly required={required} className={modalReadOnlyInputClass} />
    </label>
  );
}

function ParentOrganizationField({
  value,
  options,
  currentOrganizationCode,
}: {
  value?: string;
  options: MasterRow[];
  currentOrganizationCode?: string;
}) {
  const parentOptions = options.filter((item) => item.organization_code !== currentOrganizationCode);

  return (
    <label className={modalFieldLabelClass}>
      parent_organization_code
      <select name="parent_organization_code" className={modalSelectClass} defaultValue={value}>
        <option value="">No parent</option>
        {parentOptions.map((item) => (
          <option key={item.id} value={item.organization_code}>{item.organization_code} / {item.name}</option>
        ))}
      </select>
    </label>
  );
}

function OrganizationField({ label, value, options }: { label: string; value?: string; options: MasterRow[] }) {
  return (
    <label className={modalFieldLabelClass}>
      {label}
      <select name={label} className={modalSelectClass} defaultValue={value} required>
        <option value="">Select organization</option>
        {options.map((item) => (
          <option key={item.id} value={item.organization_code}>
            {item.organization_type} / {item.organization_code} / {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function OrganizationTypeField({ value }: { value?: string }) {
  return (
    <label className={modalFieldLabelClass}>
      organization_type
      <select name="organization_type" className={modalSelectClass} defaultValue={value ?? "DIVISION"} required>
        {organizationTypeOptions.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
    </label>
  );
}

function UnitField({ value, options }: { value?: string; options: MasterRow[] }) {
  return (
    <label className={modalFieldLabelClass}>
      unit_code
      <select name="unit_code" className={modalSelectClass} defaultValue={value}>
        <option value="">Select unit</option>
        {options.map((item) => (
          <option key={item.id} value={item.unit_code}>
            {item.unit_code} / {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function MeasureValueTypeField({ value }: { value?: string }) {
  return (
    <label className={modalFieldLabelClass}>
      value_type
      <select name="value_type" className={modalSelectClass} defaultValue={value ?? "NUMERIC"} required>
        {measureValueTypeOptions.map((type) => (
          <option key={type} value={type}>{type}</option>
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
      ["Default", tab.rows.filter((row) => row.is_default === "YES").length, "default locale"],
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

const writableReferenceTabs = new Set<ReferenceTab>(["organizations", "officers", "periodicities", "measures"]);

function ReferenceDialog({
  dialog,
  organizationRows,
  unitRows,
  activeMeasureVersionCode,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: {
  dialog: DialogState;
  organizationRows: MasterRow[];
  unitRows: MasterRow[];
  activeMeasureVersionCode?: string;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  if (!dialog) return null;

  const { tab, row, mode } = dialog;
  const isDelete = mode === "delete";
  const isView = mode === "view";
  const canWrite = writableReferenceTabs.has(tab.code as ReferenceTab);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="reference-dialog-title">
      <form onSubmit={onSubmit} className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-md border border-border bg-card shadow-xl">
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
              Confirm deactivate for <strong>{row.organization_code ?? row.officer_code ?? row.periodicity_code ?? row.measure_code ?? row.locale_code ?? row.id}</strong>. Dependency checks are required.
              {Object.entries(row).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value ?? ""} />
              ))}
            </div>
          ) : null}

          {!isView && !isDelete ? (
            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
              {tab.columns.map((column) =>
                tab.code === "measures" && unsupportedMeasureFormFields.has(column.key) ? null : column.key === "version_code" && tab.code === "measures" ? (
                  <ReadOnlyField key={column.key} label={column.key} value={row?.version_code ?? activeMeasureVersionCode} required />
                ) : column.key === "value_type" && tab.code === "measures" ? (
                  <MeasureValueTypeField key={column.key} value={row?.[column.key]} />
                ) : column.key === "parent_organization_code" ? (
                  <ParentOrganizationField
                    key={column.key}
                    value={row?.[column.key] === row?.organization_code ? "" : row?.[column.key]}
                    options={organizationRows}
                    currentOrganizationCode={row?.organization_code}
                  />
                ) : column.key === "organization_type" && tab.code === "organizations" ? (
                  <OrganizationTypeField key={column.key} value={row?.[column.key]} />
                ) : column.key === "organization_code" && tab.code === "officers" ? (
                  <OrganizationField key={column.key} label={column.key} value={row?.[column.key]} options={organizationRows} />
                ) : column.key === "unit_code" && tab.code === "measures" ? (
                  <UnitField key={column.key} value={row?.[column.key]} options={unitRows} />
                ) : (
                  <TextField key={column.key} label={column.key} value={row?.[column.key]} required={["organization_code", "organization_type", "officer_code", "display_name", "periodicity_code", "name", "version_code", "measure_code"].includes(column.key)} />
                ),
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/40 px-5 py-4">
          <span className={["text-xs", errorMessage ? "font-semibold text-red-700" : "text-muted-foreground"].join(" ")}>
            {errorMessage ?? (canWrite ? tab.dependency : "This reference set has no standalone mutation API in the current contract.")}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            {!isView && canWrite ? (
              <Button type="submit" variant={isDelete ? "destructive" : "default"} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isDelete ? "Deactivate" : "Save/Submit"}
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}

export function ReferenceMastersPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const selectedUnitCode = searchParams.get("unit_code") ?? "";
  const [activeCode, setActiveCode] = useState<ReferenceTab>("organizations");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const localesQuery = useQuery({
    queryKey: ["masters", "locales", language],
    queryFn: () => mastersService.listLocales({ locale: language }),
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
  const sourceAssignmentsQuery = useQuery({
    queryKey: ["masters", "reference-source-assignments", language, selectedUnitCode],
    queryFn: () => mastersService.listSourceAssignments({ locale: language, unitCode: selectedUnitCode || undefined }),
  });
  const indicatorsQuery = useQuery({
    queryKey: ["masters", "indicators", language],
    queryFn: () => mastersService.listIndicators({ locale: language }),
  });
  const firstCurrentVersionCode = indicatorsQuery.data?.data.find((indicator) =>
    !selectedUnitCode || indicator.owning_unit_code === selectedUnitCode,
  )?.current_version_code;
  const versionQuery = useQuery({
    queryKey: ["masters", "reference-indicator-version", firstCurrentVersionCode, language],
    queryFn: () =>
      mastersService.getIndicatorVersion({
        versionCode: firstCurrentVersionCode ?? "",
        locale: language,
      }),
    enabled: Boolean(firstCurrentVersionCode),
  });

  const unitScopedOrganizationCodes = new Set(
    (sourceAssignmentsQuery.data?.data ?? []).map((assignment) => assignment.source_organization_code),
  );
  const liveOrganizationRows = organizationsQuery.data?.data !== undefined
    ? organizationsToRows(organizationsQuery.data.data).filter((row) =>
      !selectedUnitCode ||
      Boolean(row.organization_code && unitScopedOrganizationCodes.has(row.organization_code)) ||
      Boolean(row.parent_organization_code && unitScopedOrganizationCodes.has(row.parent_organization_code)),
    )
    : [];
  const liveOfficerRows = officersQuery.data?.data !== undefined
    ? officersToRows(officersQuery.data.data).filter((row) =>
      !selectedUnitCode || Boolean(row.organization_code && unitScopedOrganizationCodes.has(row.organization_code)),
    )
    : [];
  const livePeriodicityRows = periodicitiesQuery.data?.data !== undefined
    ? periodicitiesToRows(periodicitiesQuery.data.data)
    : [];
  const liveLocaleRows = localesQuery.data?.data !== undefined
    ? localesToRows(localesQuery.data.data)
    : [];
  const liveMeasureRows = versionQuery.data?.data !== undefined
    ? measuresFromVersion(versionQuery.data.data)
    : [];
  const liveUnitRows = liveMeasureRows.length > 0 ? unitsFromMeasures(liveMeasureRows) : [];

  const referenceTabsData = referenceTabs.map((tab) => {
    if (tab.code === "locales") return { ...tab, rows: liveLocaleRows };
    if (tab.code === "organizations") return { ...tab, rows: liveOrganizationRows };
    if (tab.code === "officers") return { ...tab, rows: liveOfficerRows };
    if (tab.code === "periodicities") return { ...tab, rows: livePeriodicityRows };
    if (tab.code === "units") return { ...tab, rows: liveUnitRows };
    if (tab.code === "measures") return { ...tab, rows: liveMeasureRows };
    return tab;
  });
  const activeTab = referenceTabsData.find((tab) => tab.code === activeCode) ?? referenceTabsData[0];
  const isLiveDataLoading =
    localesQuery.isFetching ||
    organizationsQuery.isFetching ||
    officersQuery.isFetching ||
    periodicitiesQuery.isFetching ||
    sourceAssignmentsQuery.isFetching ||
    indicatorsQuery.isFetching ||
    versionQuery.isFetching;
  const liveDataError =
    localesQuery.error ||
    organizationsQuery.error ||
    officersQuery.error ||
    periodicitiesQuery.error ||
    sourceAssignmentsQuery.error ||
    indicatorsQuery.error ||
    versionQuery.error;
  const filteredRows = activeTab.rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase()));
  const activeTabCanWrite = writableReferenceTabs.has(activeTab.code as ReferenceTab);
  const activeMeasureVersionCode = versionQuery.data?.data.version_code ?? firstCurrentVersionCode ?? undefined;
  const activeTabCanCreate = activeTabCanWrite && (activeTab.code !== "measures" || Boolean(activeMeasureVersionCode));

  const invalidateReferenceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["masters", "organizations"] }),
      queryClient.invalidateQueries({ queryKey: ["masters", "officers"] }),
      queryClient.invalidateQueries({ queryKey: ["masters", "periodicities"] }),
      queryClient.invalidateQueries({ queryKey: ["masters", "reference-indicator-version"] }),
    ]);
  };

  const referenceMutation = useMutation({
    mutationFn: async ({
      currentDialog,
      formData,
    }: {
      currentDialog: NonNullable<DialogState>;
      formData: FormData;
    }) => {
      const tabCode = currentDialog.tab.code as ReferenceTab;
      const row = currentDialog.row;
      const isDeactivate = currentDialog.mode === "delete";

      if (tabCode === "organizations") {
        const organizationCode = readString(formData, "organization_code") || row?.organization_code || "";
        const organizationType = readString(formData, "organization_type") || row?.organization_type || "DEPARTMENT";
        const submittedParentOrganizationCode = readOptionalString(formData, "parent_organization_code");
        const parentOrganizationCode =
          organizationType === "MINISTRY" || submittedParentOrganizationCode === organizationCode
            ? null
            : submittedParentOrganizationCode;
        const shortCode = readOptionalString(formData, "short_code") ?? row?.short_code;
        const body = {
          organization_code: organizationCode || null,
          organization_type: organizationType,
          name: readString(formData, "name") || row?.name || "",
          is_active: !isDeactivate && readBoolean(formData, "is_active", true),
        };

        if (parentOrganizationCode) {
          Object.assign(body, { parent_organization_code: parentOrganizationCode });
        }

        if (shortCode) {
          Object.assign(body, { short_code: shortCode });
        }

        if (currentDialog.mode === "create") {
          await mastersService.createOrganization({ locale: language, body });
        } else {
          await mastersService.updateOrganization({
            organizationCode,
            locale: language,
            body,
          });
        }
        return;
      }

      if (tabCode === "officers") {
        const organizationCode = readString(formData, "organization_code") || row?.organization_code || "";
        const officerCode = readString(formData, "officer_code") || row?.officer_code || "";
        const body = {
          officer_code: officerCode || null,
          organization_code: organizationCode,
          display_name: readString(formData, "display_name") || row?.display_name || "",
          designation: readOptionalString(formData, "designation"),
          email: readOptionalString(formData, "email"),
          mobile_number: readOptionalString(formData, "mobile_number"),
          is_active: !isDeactivate && readBoolean(formData, "is_active", true),
        };

        if (currentDialog.mode === "create") {
          await mastersService.createOfficer({ locale: language, body });
        } else {
          await mastersService.updateOfficer({
            organizationCode,
            officerCode,
            locale: language,
            body,
          });
        }
        return;
      }

      if (tabCode === "periodicities") {
        const periodicityCode = readString(formData, "periodicity_code") || row?.periodicity_code || "";
        const body = {
          periodicity_code: periodicityCode || null,
          name: readString(formData, "name") || row?.name || "",
          months_interval: readInteger(formData, "months_interval"),
          sort_order: readInteger(formData, "sort_order"),
          is_active: !isDeactivate && readBoolean(formData, "is_active", true),
        };

        if (currentDialog.mode === "create") {
          await mastersService.createPeriodicity({ locale: language, body });
        } else {
          await mastersService.updatePeriodicity({
            periodicityCode,
            locale: language,
            body,
          });
        }
        return;
      }

      if (tabCode === "measures") {
        const versionCode = row?.version_code || activeMeasureVersionCode || "";
        if (!versionCode) {
          throw new Error("Create an indicator version before adding a measure.");
        }

        const measureCode = readString(formData, "measure_code") || row?.measure_code || "";
        const body = {
          measure_code: measureCode || null,
          name: readString(formData, "name") || row?.name || measureCode || "Indicator value",
          value_type: readString(formData, "value_type") || row?.value_type || "NUMERIC",
          unit_code: readOptionalString(formData, "unit_code") ?? row?.unit_code ?? null,
          aggregation_type: readOptionalString(formData, "aggregation_type"),
          is_required: readBoolean(formData, "is_required", true),
          is_active: !isDeactivate && readBoolean(formData, "is_active", true),
        };

        if (currentDialog.mode === "create") {
          await mastersService.createIndicatorMeasure({ versionCode, locale: language, body });
        } else {
          await mastersService.updateIndicatorMeasure({
            versionCode,
            measureCode,
            locale: language,
            body,
          });
        }
      }
    },
    onSuccess: async () => {
      await invalidateReferenceQueries();
      setMutationError(null);
      setMutationMessage("Reference master saved. Latest API data is being refreshed.");
      setDialog(null);
      window.setTimeout(() => setMutationMessage(null), 5000);
    },
    onError: (error) => {
      setMutationMessage(null);
      setMutationError(safeApiMessage(error));
    },
  });

  const openDialog = (mode: NonNullable<DialogState>["mode"], tab: MasterTab, row?: MasterRow) => {
    setMutationError(null);
    setMutationMessage(null);
    setDialog({ mode, tab, row });
  };

  const handleDialogSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dialog) return;
    setMutationError(null);
    referenceMutation.mutate({
      currentDialog: dialog,
      formData: new FormData(event.currentTarget),
    });
  };

  return (
    <AppShell persona="Super Admin" activeDashboard="/dashboard/super-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="reference-masters-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="reference-masters-title" className="text-2xl font-bold">Masters</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage reusable reference masters used by indicators, requests, and source assignment.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled title="Bulk reference upload API is not available yet"><Download aria-hidden="true" className="size-4" /> Format</Button>
            <Button variant="outline" disabled title="Bulk reference upload API is not available yet"><FileUp aria-hidden="true" className="size-4" /> Bulk upload</Button>
            <Button
              disabled={!activeTabCanCreate}
              title={
                activeTab.code === "measures" && !activeMeasureVersionCode
                  ? "Create an indicator version before adding measures"
                  : activeTabCanWrite
                    ? "Create reference record"
                    : "No standalone mutation API is available for this reference set"
              }
              onClick={() => openDialog("create", activeTab)}
            >
              <Plus aria-hidden="true" className="size-4" /> New record
            </Button>
          </div>
        </div>

        {isLiveDataLoading ? (
          <Loader variant="section" label="Loading reference masters" />
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
          
        </div>

        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Reference master tabs">
          {referenceTabsData.map((tab) => (
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
                        <Button size="icon-xs" variant="outline" aria-label="View" onClick={() => openDialog("view", activeTab, row)}><Eye aria-hidden="true" className="size-3" /></Button>
                        <Button
                          size="icon-xs"
                          variant="outline"
                          aria-label="Edit"
                          disabled={!activeTabCanWrite}
                          title={activeTabCanWrite ? "Edit reference record" : "No standalone mutation API is available for this reference set"}
                          onClick={() => openDialog("edit", activeTab, row)}
                        >
                          <Edit3 aria-hidden="true" className="size-3" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="destructive"
                          aria-label="Deactivate"
                          disabled={!activeTabCanWrite}
                          title={activeTabCanWrite ? "Deactivate reference record" : "No standalone mutation API is available for this reference set"}
                          onClick={() => openDialog("delete", activeTab, row)}
                        >
                          <Trash2 aria-hidden="true" className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredRows.length ? (
                  <TableRow>
                    <TableCell colSpan={activeTab.columns.length + 1} className="py-6 text-center text-xs text-muted-foreground">
                      Not available.
                    </TableCell>
                  </TableRow>
                ) : null}
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

      <ReferenceDialog
        dialog={dialog}
        organizationRows={liveOrganizationRows}
        unitRows={liveUnitRows}
        activeMeasureVersionCode={activeMeasureVersionCode}
        isSubmitting={referenceMutation.isPending}
        errorMessage={mutationError}
        onSubmit={handleDialogSubmit}
        onClose={() => setDialog(null)}
      />
    </AppShell>
  );
}
