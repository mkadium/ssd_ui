import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  FileUp,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";

import { ApiError } from "@/api/client";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useLanguage } from "@/providers/language-context";
import { dimensionsService } from "@/services/dimensionsService";
import type {
  DimensionDefinitionItem,
  DimensionMemberItem,
  DimensionMemberSetItem,
  GeographyItem,
  TimePeriodItem,
} from "@/types/dimensions";

type DimensionTab = "members" | "rollups" | "member-sets" | "geography" | "time";
type DimensionModal =
  | "view-member"
  | "create-root"
  | "add-child"
  | "edit-member"
  | "delete-member"
  | "create-dimension"
  | "edit-dimension"
  | "delete-dimension"
  | "create-member-set"
  | "edit-member-set"
  | "delete-member-set"
  | "create-geography"
  | "edit-geography"
  | "delete-geography"
  | "create-time-period"
  | "edit-time-period"
  | "delete-time-period"
  | "bulk-upload"
  | null;

const statusVariant = (status?: string) => {
  if (["ACTIVE", "LOW"].includes(status ?? "")) return "secondary";
  if (["DRAFT", "CLOSED", "MEDIUM"].includes(status ?? "")) return "outline";
  if (["RETIRED", "HIGH"].includes(status ?? "")) return "destructive";
  return "ghost";
};

function safeApiMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sign in again to load dimensions.";
    if (error.status === 403) return "You do not have permission to view dimensions.";
    if (error.status === 0) return "Unable to reach the API.";
  }

  return "Dimensions are temporarily unavailable.";
}

function toNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeStatus(value: unknown, fallback = "ACTIVE") {
  return typeof value === "string" && value.trim() ? value : fallback;
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

function dimensionToSearchText(dimension: DimensionDefinitionItem) {
  return [
    dimension.dimension_code,
    dimension.dimension_type,
    dimension.value_type,
    dimension.name,
    dimension.description,
    normalizeStatus(dimension.status),
    dimension.member_count,
    dimension.set_count,
    dimension.template_usage_count,
  ].join(" ");
}

function memberToSearchText(member: DimensionMemberItem) {
  return [
    member.dimension_code,
    member.member_code,
    member.parent_member_code,
    member.external_code,
    member.name,
    member.short_name,
    member.sort_order,
    member.status,
    member.valid_from,
    member.valid_to,
  ].join(" ");
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const uniqueItems = new Map<string, T>();

  for (const item of items) {
    const key = getKey(item);
    if (key && !uniqueItems.has(key)) {
      uniqueItems.set(key, item);
    }
  }

  return Array.from(uniqueItems.values());
}

function Field({ label, value, readOnly = false, required = false }: { label: string; value?: string | number; readOnly?: boolean; required?: boolean }) {
  return (
    <label className="grid gap-1 text-xs font-semibold">
      {label}
      <Input name={label} defaultValue={value ?? ""} readOnly={readOnly} required={required} className={readOnly ? "bg-muted/60" : undefined} />
    </label>
  );
}

function selectedRecordCode(row: unknown) {
  if (!row || typeof row !== "object") return "selected record";
  const record = row as Record<string, unknown>;
  return String(record.member_code ?? record.dimension_code ?? record.set_code ?? record.geography_code ?? record.time_period_code ?? "selected record");
}

function DimensionModalView({
  modal,
  selectedDimension,
  selectedDimensionCode,
  selectedDimensionName,
  selectedMember,
  selectedMemberSet,
  selectedGeography,
  selectedTimePeriod,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: {
  modal: DimensionModal;
  selectedDimension?: DimensionDefinitionItem;
  selectedDimensionCode: string;
  selectedDimensionName: string;
  selectedMember?: DimensionMemberItem;
  selectedMemberSet?: DimensionMemberSetItem;
  selectedGeography?: GeographyItem;
  selectedTimePeriod?: TimePeriodItem;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  if (!modal) return null;

  const isDelete = modal === "delete-member";
  const isView = modal === "view-member";
  const titleMap: Record<Exclude<DimensionModal, null>, string> = {
    "view-member": "View member detail",
    "create-root": "Create root member",
    "add-child": "Add child member",
    "edit-member": "Edit member",
    "delete-member": "Delete member",
    "create-dimension": "Create dimension",
    "edit-dimension": "Edit dimension",
    "delete-dimension": "Deactivate dimension",
    "create-member-set": "Create member set",
    "edit-member-set": "Edit member set",
    "delete-member-set": "Deactivate member set",
    "create-geography": "Create geography",
    "edit-geography": "Edit geography",
    "delete-geography": "Deactivate geography",
    "create-time-period": "Create time period",
    "edit-time-period": "Edit time period",
    "delete-time-period": "Deactivate time period",
    "bulk-upload": "Bulk upload members",
  };
  const selectedRow = selectedMemberSet ?? selectedGeography ?? selectedTimePeriod ?? selectedMember ?? selectedDimension;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="dimension-modal-title">
      <form onSubmit={onSubmit} className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-md bg-card shadow-xl">
        <div className="flex items-start justify-between border-b border-border/70 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase text-muted-foreground">Dimension Management</p>
            <h2 id="dimension-modal-title" className="text-xl font-bold">{titleMap[modal]}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-5">
          {modal === "bulk-upload" ? (
            <div className="grid gap-4">
              <div className="rounded-md bg-muted/60 p-4 text-sm">
                Upload columns: dimension_code, member_code, parent_member_code, external_code, name_en, short_name, sort_order, status.
              </div>
              <label className="grid gap-1 text-sm font-semibold">
                Upload file
                <Input type="file" />
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs max-md:grid-cols-1">
                <div className="rounded-md bg-muted/40 p-3">
                  Example 1: root member with blank parent_member_code.
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                  Example 2: child member with parent_member_code set to an existing member.
                </div>
              </div>
            </div>
          ) : null}

          {["create-dimension", "edit-dimension"].includes(modal) ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                <Field label="dimension_code" value={modal === "edit-dimension" ? selectedDimension?.dimension_code : ""} required />
                <label className="grid gap-1 text-xs font-semibold">
                  dimension_type
                  <select name="dimension_type" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={selectedDimension?.dimension_type ?? "GENERAL"}>
                    <option>GENERAL</option>
                    <option>GEOGRAPHY</option>
                    <option>TIME</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  value_type
                  <select name="value_type" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={selectedDimension?.value_type ?? "TEXT"}>
                    <option>TEXT</option>
                    <option>NUMERIC</option>
                    <option>INTEGER</option>
                    <option>BOOLEAN</option>
                    <option>DATE</option>
                  </select>
                </label>
                <Field label="name" value={selectedDimension?.name} required />
                <Field label="sort_order" value="0" />
                <label className="grid gap-1 text-xs font-semibold">
                  is_hierarchical
                  <select name="is_hierarchical" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={selectedDimension?.is_hierarchical ? "YES" : "NO"}>
                    <option>YES</option>
                    <option>NO</option>
                  </select>
                </label>
              </div>
              <Field label="description" value={selectedDimension?.description ?? undefined} />
              <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                This creates the dimension definition first. Add root members after the dimension is available.
              </div>
            </div>
          ) : null}

          {isView && selectedMember ? (
            <dl className="grid grid-cols-4 gap-3 max-lg:grid-cols-2">
              {Object.entries(selectedMember).map(([key, value]) => (
                <div key={key} className="rounded-md bg-muted/50 p-3">
                  <dt className="text-[11px] font-semibold text-muted-foreground">{key}</dt>
                  <dd className="mt-1 break-words font-mono text-[11px] font-bold">{valueToString(value) ?? "-"}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {isDelete && selectedRow ? (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-900">
              Confirm deactivate for <strong>{selectedRecordCode(selectedRow)}</strong>. Dependency checks must include member sets, template axes/cells, request scope members, ingestion staged records, validation, review, and dashboard usage.
            </div>
          ) : null}

          {["create-root", "add-child", "edit-member"].includes(modal) ? (
            <div className="grid gap-4">
              {modal === "add-child" && selectedMember ? (
                <div className="grid grid-cols-3 gap-3 rounded-md bg-muted/60 p-3 text-xs max-md:grid-cols-1">
                  <div>
                    <p className="font-semibold text-muted-foreground">Parent member</p>
                    <p className="mt-1 font-mono font-bold">{selectedMember.member_code}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Parent name</p>
                    <p className="mt-1 font-bold">{selectedMember.name}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Dimension</p>
                    <p className="mt-1 font-mono font-bold">{selectedDimensionCode}</p>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                {modal === "create-root" ? (
                  <Field label="dimension_code" value={selectedDimensionCode} />
                ) : (
                  <Field label="dimension_code" value={selectedDimensionCode} readOnly />
                )}
                <Field label="member_code" value={modal === "add-child" ? "" : selectedMember?.member_code} required />
                <Field
                  label="parent_member_code"
                  value={modal === "create-root" ? "ROOT" : modal === "add-child" ? selectedMember?.member_code : selectedMember?.parent_member_code ?? "ROOT"}
                  readOnly={modal !== "edit-member"}
                />
                <Field label="external_code" value={modal === "add-child" ? "" : selectedMember?.external_code ?? undefined} />
                <Field label="sort_order" value={modal === "add-child" ? "" : selectedMember?.sort_order ?? undefined} />
                <label className="grid gap-1 text-xs font-semibold">
                  status
                  <select name="is_active" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={normalizeStatus(selectedMember?.status) === "RETIRED" ? "NO" : "YES"}>
                    <option>YES</option>
                    <option>NO</option>
                  </select>
                </label>
              </div>
              <Field label="name" value={modal === "add-child" ? "" : selectedMember?.name} required />
              <Field label="short_name" value={modal === "add-child" ? "" : selectedMember?.short_name ?? undefined} />
              {modal === "create-root" ? (
                <div className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  Current dimension is {selectedDimensionName}. You can change `dimension_code` when creating the first root for a new dimension draft.
                </div>
              ) : null}
            </div>
          ) : null}

          {["create-member-set", "edit-member-set"].includes(modal) ? (
            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
              <Field label="dimension_code" value={selectedDimensionCode} readOnly />
              <Field label="set_code" value={selectedMemberSet?.set_code} required />
              <label className="grid gap-1 text-xs font-semibold">
                set_type
                <select name="set_type" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={selectedMemberSet?.set_type ?? "CONTROLLED_SCOPE"}>
                  <option>CONTROLLED_SCOPE</option>
                  <option>TEMPLATE_SCOPE</option>
                  <option>REQUEST_SCOPE</option>
                  <option>REPORT_SCOPE</option>
                </select>
              </label>
              <Field label="name" value={selectedMemberSet?.name} required />
              <label className="grid gap-1 text-xs font-semibold">
                is_active
                <select name="is_active" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={normalizeStatus(selectedMemberSet?.status) === "RETIRED" ? "NO" : "YES"}>
                  <option>YES</option>
                  <option>NO</option>
                </select>
              </label>
            </div>
          ) : null}

          {["create-geography", "edit-geography"].includes(modal) ? (
            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
              <Field label="geography_code" value={selectedGeography?.geography_code} required />
              <Field label="member_code" value={selectedGeography?.member_code} />
              <Field label="level_code" value={selectedGeography?.level_code ?? "STATE"} required />
              <Field label="parent_geography_code" value={selectedGeography?.parent_geography_code ?? undefined} />
              <Field label="iso_alpha2_code" value={selectedGeography?.iso_alpha2_code ?? undefined} />
              <Field label="iso_alpha3_code" value={selectedGeography?.iso_alpha3_code ?? undefined} />
              <Field label="name" value={selectedGeography?.name} required />
              <label className="grid gap-1 text-xs font-semibold">
                is_active
                <select name="is_active" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={normalizeStatus(selectedGeography?.status) === "RETIRED" ? "NO" : "YES"}>
                  <option>YES</option>
                  <option>NO</option>
                </select>
              </label>
            </div>
          ) : null}

          {["create-time-period", "edit-time-period"].includes(modal) ? (
            <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
              <Field label="time_period_code" value={selectedTimePeriod?.time_period_code} required />
              <Field label="member_code" value={selectedTimePeriod?.member_code ?? undefined} />
              <Field label="frequency_code" value={selectedTimePeriod?.frequency_code ?? "ANNUAL"} required />
              <Field label="period_year" value={selectedTimePeriod?.period_year ?? new Date().getFullYear()} required />
              <Field label="period_quarter" value={selectedTimePeriod?.period_quarter ?? undefined} />
              <Field label="period_month" value={selectedTimePeriod?.period_month ?? undefined} />
              <Field label="start_date" value={selectedTimePeriod?.start_date ?? ""} required />
              <Field label="end_date" value={selectedTimePeriod?.end_date ?? ""} required />
              <label className="grid gap-1 text-xs font-semibold">
                status
                <select name="status" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={normalizeStatus(selectedTimePeriod?.status)}>
                    <option>ACTIVE</option>
                    <option>DRAFT</option>
                    <option>CLOSED</option>
                    <option>RETIRED</option>
                  </select>
                </label>
              <Field label="name" value={selectedTimePeriod?.name} required />
              <label className="grid gap-1 text-xs font-semibold">
                is_active
                <select name="is_active" className="h-9 rounded-md border border-input bg-input/20 px-2 text-xs" defaultValue={normalizeStatus(selectedTimePeriod?.status) === "RETIRED" ? "NO" : "YES"}>
                  <option>YES</option>
                  <option>NO</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border/70 bg-muted/40 px-5 py-4">
          <span className={["text-xs", errorMessage ? "font-semibold text-red-700" : "text-muted-foreground"].join(" ")}>
            {errorMessage ?? "Changes are saved through governed Dimensions APIs."}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            {!isView ? (
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

export function DimensionsManagementPage() {
  const { language: locale } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedDimensionCode, setSelectedDimensionCode] = useState("GEOGRAPHY");
  const [selectedMemberCode, setSelectedMemberCode] = useState("IND");
  const [selectedMemberSetCode, setSelectedMemberSetCode] = useState("");
  const [selectedGeographyCode, setSelectedGeographyCode] = useState("");
  const [selectedTimePeriodCode, setSelectedTimePeriodCode] = useState("");
  const [dimensionSearch, setDimensionSearch] = useState("");
  const [treeSearch, setTreeSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [activeTab, setActiveTab] = useState<DimensionTab>("members");
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<DimensionModal>(null);
  const [mutationMessage, setMutationMessage] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const dimensionsQuery = useQuery({
    queryKey: ["dimensions", "definitions", locale],
    queryFn: () => dimensionsService.listDimensions({ locale }),
  });

  const healthQuery = useQuery({
    queryKey: ["dimensions", "health"],
    queryFn: () => dimensionsService.getHealth(),
  });

  const dimensionDefinitions: DimensionDefinitionItem[] = dimensionsQuery.data?.data?.length
    ? dimensionsQuery.data.data
    : [];
  const selectedDimension =
    dimensionDefinitions.find((dimension) => dimension.dimension_code === selectedDimensionCode) ??
    dimensionDefinitions[0] ??
    {
      dimension_code: selectedDimensionCode,
      dimension_type: "GENERAL",
      value_type: "TEXT",
      is_hierarchical: false,
      name: selectedDimensionCode,
      description: "Dimension data will appear after the API returns records.",
      status: "ACTIVE",
    };
  const effectiveDimensionCode = selectedDimension?.dimension_code ?? selectedDimensionCode;

  const dimensionDetailQuery = useQuery({
    queryKey: ["dimensions", "definition-detail", effectiveDimensionCode, locale],
    queryFn: () => dimensionsService.getDimension({ dimensionCode: effectiveDimensionCode, locale }),
    enabled: Boolean(effectiveDimensionCode),
  });

  const membersQuery = useQuery({
    queryKey: ["dimensions", "members", effectiveDimensionCode, locale],
    queryFn: () => dimensionsService.listMembers({ dimensionCode: effectiveDimensionCode, locale }),
    enabled: Boolean(effectiveDimensionCode),
  });

  const memberSetsQuery = useQuery({
    queryKey: ["dimensions", "member-sets", effectiveDimensionCode, locale],
    queryFn: () => dimensionsService.listMemberSets({ dimensionCode: effectiveDimensionCode, locale }),
    enabled: Boolean(effectiveDimensionCode),
  });

  const geographiesQuery = useQuery({
    queryKey: ["dimensions", "geographies", locale],
    queryFn: () => dimensionsService.listGeographies({ locale }),
  });

  const geographyLevelsQuery = useQuery({
    queryKey: ["dimensions", "geography-levels", locale],
    queryFn: () => dimensionsService.listGeographyLevels({ locale }),
  });

  const timePeriodsQuery = useQuery({
    queryKey: ["dimensions", "time-periods", locale],
    queryFn: () => dimensionsService.listTimePeriods({ locale }),
  });

  const timeFrequenciesQuery = useQuery({
    queryKey: ["dimensions", "time-frequencies", locale],
    queryFn: () => dimensionsService.listTimeFrequencies({ locale }),
  });

  const rollupRulesQuery = useQuery({
    queryKey: ["dimensions", "rollup-rules", effectiveDimensionCode, locale],
    queryFn: () => dimensionsService.listRollupRules({ dimensionCode: effectiveDimensionCode, locale }),
    enabled: Boolean(effectiveDimensionCode) && activeTab === "rollups",
  });

  const selectedDimensionDetail = dimensionDetailQuery.data?.data ?? selectedDimension;
  const membersForDimension: DimensionMemberItem[] = membersQuery.data?.data?.length
    ? membersQuery.data.data
    : [];
  const selectedMember = membersForDimension.find((member) => member.member_code === selectedMemberCode) ?? membersForDimension[0];
  const memberSetsForDimension = memberSetsQuery.data?.data?.length
    ? memberSetsQuery.data.data
    : [];
  const selectedMemberSet = memberSetsForDimension.find((set) => set.set_code === selectedMemberSetCode) ?? memberSetsForDimension[0];
  const usageRows: Array<{ id: string; usage_area: string; dependency: string; record_count: number; risk: "LOW" | "MEDIUM" | "HIGH" }> = [];
  const rollupRulesForDimension = rollupRulesQuery.data?.data?.length
    ? rollupRulesQuery.data.data.map((rule) => ({
      id: rule.id ?? `${rule.parent_member_code}-${rule.rule_code}`,
      dimension_code: rule.dimension_code ?? effectiveDimensionCode,
      parent_member_code: rule.parent_member_code,
      parent_label: rule.parent_label ?? rule.parent_member_code,
      rule_code: rule.rule_code,
      entry_mode: rule.entry_mode ?? "MANUAL_WITH_VALIDATION",
      aggregation_method: rule.aggregation_method ?? "SUM",
      measure_code: rule.measure_code ?? "-",
      validation_rule_code: rule.validation_rule_code ?? "-",
      status: normalizeStatus(rule.status ?? rule.is_active),
      children: rule.children ?? [],
    }))
    : [];

  const memberSetMembersQuery = useQuery({
    queryKey: ["dimensions", "member-set-members", selectedMemberSet?.set_code, locale],
    queryFn: () => dimensionsService.listMemberSetMembers({ setCode: selectedMemberSet?.set_code ?? "", locale }),
    enabled: Boolean(selectedMemberSet?.set_code),
  });

  const geographies: GeographyItem[] = useMemo(
    () => (geographiesQuery.data?.data?.length ? geographiesQuery.data.data : []),
    [geographiesQuery.data],
  );
  const timePeriods: TimePeriodItem[] = useMemo(
    () => (timePeriodsQuery.data?.data?.length ? timePeriodsQuery.data.data : []),
    [timePeriodsQuery.data],
  );
  const effectiveGeographyCode = selectedGeographyCode || geographies[0]?.geography_code;
  const effectiveTimePeriodCode = selectedTimePeriodCode || timePeriods[0]?.time_period_code;
  const selectedGeography = geographies.find((geo) => geo.geography_code === effectiveGeographyCode) ?? geographies[0];
  const selectedTimePeriod = timePeriods.find((period) => period.time_period_code === effectiveTimePeriodCode) ?? timePeriods[0];
  const selectedTimePeriodIsInList = Boolean(
    effectiveTimePeriodCode &&
    timePeriods.some((period) => period.time_period_code === effectiveTimePeriodCode),
  );

  const selectedGeographyQuery = useQuery({
    queryKey: ["dimensions", "geography-detail", effectiveGeographyCode, locale],
    queryFn: () => dimensionsService.getGeography({ geographyCode: effectiveGeographyCode ?? "", locale }),
    enabled: Boolean(effectiveGeographyCode),
  });

  const selectedTimePeriodQuery = useQuery({
    queryKey: ["dimensions", "time-period-detail", effectiveTimePeriodCode, locale],
    queryFn: () => dimensionsService.getTimePeriod({ timePeriodCode: effectiveTimePeriodCode ?? "", locale }),
    enabled: selectedTimePeriodIsInList,
  });

  const filteredDimensions = dimensionDefinitions.filter((dimension) =>
    dimensionToSearchText(dimension).toLowerCase().includes(dimensionSearch.toLowerCase()),
  );

  const geographyLevels = useMemo(
    () => {
      if (geographyLevelsQuery.data?.data?.length) return geographyLevelsQuery.data.data;
      if (!geographiesQuery.data?.data?.length) return [];

      return uniqueBy(geographies, (geo) => geo.level_code).map((geo, index) => ({
        level_code: geo.level_code,
        level_number: index + 1,
        name: geo.level_code,
      }));
    },
    [geographies, geographiesQuery.data, geographyLevelsQuery.data],
  );

  const timeFrequencies = useMemo(
    () => {
      if (timeFrequenciesQuery.data?.data?.length) return timeFrequenciesQuery.data.data;
      if (!timePeriodsQuery.data?.data?.length) return [];

      return uniqueBy(timePeriods, (period) => period.frequency_code).map((period) => ({
        frequency_code: period.frequency_code,
        name: period.frequency_code,
        months_interval: period.frequency_code === "ANNUAL" ? 12 : period.frequency_code === "QUARTERLY" ? 3 : period.frequency_code === "MONTHLY" ? 1 : "-",
        status: "ACTIVE",
      }));
    },
    [timePeriods, timePeriodsQuery.data, timeFrequenciesQuery.data],
  );

  const primaryDataError = dimensionsQuery.error;
  const supplementalDataError =
    membersQuery.error ??
    memberSetsQuery.error ??
    geographyLevelsQuery.error ??
    geographiesQuery.error ??
    timeFrequenciesQuery.error ??
    timePeriodsQuery.error ??
    rollupRulesQuery.error ??
    healthQuery.error ??
    dimensionDetailQuery.error ??
    memberSetMembersQuery.error ??
    selectedGeographyQuery.error ??
    selectedTimePeriodQuery.error;
  const isInitialLoading =
    dimensionsQuery.isPending ||
    (Boolean(effectiveDimensionCode) && membersQuery.isPending) ||
    memberSetsQuery.isPending ||
    geographyLevelsQuery.isPending ||
    geographiesQuery.isPending ||
    timeFrequenciesQuery.isPending ||
    timePeriodsQuery.isPending;
  const memberChildren = (memberCode: string, members = membersForDimension) => members.filter((member) => member.parent_member_code === memberCode);
  const treeQuery = treeSearch.trim().toLowerCase();
  const memberMatchesSearch = (member: DimensionMemberItem) =>
    memberToSearchText(member).toLowerCase().includes(treeQuery);
  const hasMatchingDescendant = (member: DimensionMemberItem): boolean =>
    memberChildren(member.member_code).some((child) => memberMatchesSearch(child) || hasMatchingDescendant(child));
  const hasMatchingAncestor = (member: DimensionMemberItem): boolean => {
    const parent = membersForDimension.find((candidate) => candidate.member_code === member.parent_member_code);
    return parent ? memberMatchesSearch(parent) || hasMatchingAncestor(parent) : false;
  };
  const searchableMembers = treeQuery
    ? membersForDimension.filter((member) => memberMatchesSearch(member) || hasMatchingDescendant(member) || hasMatchingAncestor(member))
    : membersForDimension;
  const rootMembers = searchableMembers.filter((member) => !member.parent_member_code);
  const getMemberDepth = (member: DimensionMemberItem): number => {
    const parent = membersForDimension.find((candidate) => candidate.member_code === member.parent_member_code);
    return parent ? getMemberDepth(parent) + 1 : 1;
  };

  const filteredMembers = membersForDimension.filter((member) =>
    memberToSearchText(member).toLowerCase().includes(tableSearch.toLowerCase()),
  );

  const tabs: { code: DimensionTab; label: string }[] = [
    { code: "members", label: "Members" },
    { code: "rollups", label: "Rollups" },
    { code: "member-sets", label: "Member sets" },
    { code: "geography", label: "Geography" },
    { code: "time", label: "Time periods" },
  ];

  const rootMemberCount = membersForDimension.filter((member) => !member.parent_member_code).length;
  const childMemberCount = membersForDimension.length - rootMemberCount;
  const activeMemberCount = membersForDimension.filter((member) => normalizeStatus(member.status) === "ACTIVE").length;
  const inactiveMemberCount = membersForDimension.length - activeMemberCount;
  const maxMemberDepth = membersForDimension.reduce((maxDepth, member) => Math.max(maxDepth, getMemberDepth(member)), 0);
  const templateSetCount = memberSetsForDimension.filter((set) => set.set_type === "TEMPLATE_SCOPE").length;
  const requestSetCount = memberSetsForDimension.filter((set) => set.set_type === "REQUEST_SCOPE").length;
  const reportSetCount = memberSetsForDimension.filter((set) => set.set_type === "REPORT_SCOPE").length;
  const dependencyRecordCount = usageRows.reduce((sum, usage) => sum + usage.record_count, 0);
  const highRiskCount = usageRows.filter((usage) => usage.risk === "HIGH").length;
  const selectedDimensionStatus = normalizeStatus(selectedDimensionDetail?.status);
  const selectedDimensionDescription =
    selectedDimensionDetail?.description ??
    selectedDimension.description ??
    "Live API response does not include a description for this dimension.";
  const selectedDimensionMemberCount = toNumber(selectedDimension.member_count, membersForDimension.length);
  const selectedDimensionSetCount = toNumber(selectedDimension.set_count, memberSetsForDimension.length);
  const selectedDimensionTemplateUsageCount = toNumber(selectedDimension.template_usage_count);

  const statCards: {
    label: string;
    value: number | string;
    badge: string;
    helper: string;
    detail: string;
    footnote: string;
    targetTab: DimensionTab;
  }[] = [
    {
      label: "Members",
      value: membersQuery.data?.count ?? selectedDimensionMemberCount,
      badge: `${activeMemberCount} active`,
      helper: `${rootMemberCount} root / ${childMemberCount} child`,
      detail: inactiveMemberCount ? `${inactiveMemberCount} inactive or draft` : "All listed members active",
      footnote: selectedDimension.is_hierarchical ? `Max depth ${maxMemberDepth}` : "Flat list, no parent chain",
      targetTab: "members",
    },
    {
      label: "Definition",
      value: selectedDimensionStatus,
      badge: selectedDimension.dimension_code,
      helper: `${selectedDimension.dimension_type} / ${selectedDimension.value_type}`,
      detail: selectedDimension.is_hierarchical ? "Hierarchy enabled" : "Flat dimension",
      footnote: "Code and localized labels drive templates",
      targetTab: "members",
    },
    {
      label: "Member sets",
      value: memberSetsForDimension.length,
      badge: "Scopes",
      helper: `${templateSetCount} template / ${requestSetCount} request`,
      detail: reportSetCount ? `${reportSetCount} report scope` : `${selectedDimensionSetCount} sets in definition metadata`,
      footnote: "Used to constrain template and request axes",
      targetTab: "member-sets",
    },
    {
      label: "Usage",
      value: dependencyRecordCount,
      badge: highRiskCount ? `${highRiskCount} high` : "Checked",
      helper: `${usageRows.length} dependency areas`,
      detail: selectedDimensionTemplateUsageCount ? `${selectedDimensionTemplateUsageCount} template bindings` : "No live usage endpoint available",
      footnote: highRiskCount ? "Review before structural edits" : "Dependency evidence awaits usage APIs",
      targetTab: "members",
    },
    {
      label: "Rollups",
      value: rollupRulesForDimension.length,
      badge: rollupRulesForDimension.some((rule) => rule.status === "ACTIVE") ? "Active" : "None",
      helper: rollupRulesForDimension.length ? rollupRulesForDimension[0].entry_mode : "No rollup rule",
      detail: rollupRulesForDimension.length ? `${rollupRulesForDimension[0].parent_label} -> ${rollupRulesForDimension[0].children.map((child) => child.label).join(" + ")}` : "Flat/manual members only",
      footnote: rollupRulesForDimension.length ? `${rollupRulesForDimension[0].aggregation_method} / ${rollupRulesForDimension[0].validation_rule_code}` : "Optional enterprise template behavior",
      targetTab: "rollups",
    },
  ];

  const renderTreeMember = (member: DimensionMemberItem, depth = 0) => {
    const children = searchableMembers.filter((candidate) => candidate.parent_member_code === member.member_code);
    const searchShouldOpen = Boolean(treeQuery && (memberMatchesSearch(member) || hasMatchingDescendant(member)));
    const isExpanded = expandedMembers[member.member_code] ?? (treeQuery ? searchShouldOpen : true);
    const isSelected = selectedMember?.member_code === member.member_code;

    return (
      <div key={member.member_code}>
        <div
          className={[
            "grid grid-cols-[24px_1fr_auto] items-center gap-2 px-2 py-1.5 text-xs hover:bg-accent",
            isSelected ? "bg-accent text-accent-foreground" : "",
          ].join(" ")}
          style={{ paddingLeft: `${8 + depth * 18}px` }}
        >
          <button
            type="button"
            className="grid size-5 place-items-center rounded-sm hover:bg-background"
            onClick={() => setExpandedMembers((current) => ({ ...current, [member.member_code]: !isExpanded }))}
            aria-label={isExpanded ? "Collapse member" : "Expand member"}
          >
            {children.length > 0 ? (
              isExpanded ? <ChevronDown aria-hidden="true" className="size-4" /> : <ChevronRight aria-hidden="true" className="size-4" />
            ) : null}
          </button>
          <button type="button" className="min-w-0 text-left" onClick={() => setSelectedMemberCode(member.member_code)}>
            <span className="block truncate font-semibold">{member.name}</span>
            <span className="block truncate font-mono text-[11px] text-muted-foreground">Depth {getMemberDepth(member)} / {member.member_code}</span>
          </button>
          <Badge variant={statusVariant(normalizeStatus(member.status))}>{normalizeStatus(member.status)}</Badge>
        </div>
        {isExpanded ? children.map((child) => renderTreeMember(child, depth + 1)) : null}
      </div>
    );
  };

  const openMemberModal = (nextModal: DimensionModal, member = selectedMember) => {
    setMutationError(null);
    setMutationMessage(null);
    setSelectedMemberCode(member?.member_code ?? selectedMemberCode);
    setModal(nextModal);
  };

  const invalidateDimensionQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["dimensions", "definitions"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "definition-detail"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "members"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "member-sets"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "member-set-members"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "geographies"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "geography-detail"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "geography-levels"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "time-periods"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "time-period-detail"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "time-frequencies"] }),
      queryClient.invalidateQueries({ queryKey: ["dimensions", "rollup-rules"] }),
    ]);
  };

  const dimensionMutation = useMutation({
    mutationFn: async ({ currentModal, formData }: { currentModal: Exclude<DimensionModal, null>; formData: FormData }) => {
      const isDelete = currentModal.startsWith("delete");

      if (["create-dimension", "edit-dimension", "delete-dimension"].includes(currentModal)) {
        const dimensionCode = readString(formData, "dimension_code") || selectedDimension.dimension_code;

        if (isDelete) {
          await dimensionsService.setDimensionActive({ dimensionCode, locale, active: false });
          return;
        }

        const body = {
          dimension_code: dimensionCode || null,
          dimension_type: readString(formData, "dimension_type") || "GENERAL",
          value_type: readString(formData, "value_type") || "TEXT",
          is_hierarchical: readBoolean(formData, "is_hierarchical", false),
          sort_order: readInteger(formData, "sort_order", 0),
          name: readString(formData, "name") || selectedDimension.name,
          description: readOptionalString(formData, "description"),
          is_active: true,
        };

        if (currentModal === "create-dimension") {
          await dimensionsService.createDimension({ locale, body });
        } else {
          await dimensionsService.updateDimension({ dimensionCode, locale, body });
        }
        setSelectedDimensionCode(dimensionCode);
        return;
      }

      if (["create-root", "add-child", "edit-member", "delete-member"].includes(currentModal)) {
        const dimensionCode = readString(formData, "dimension_code") || selectedDimension.dimension_code;
        const memberCode = readString(formData, "member_code") || selectedMember?.member_code || "";

        if (isDelete) {
          await dimensionsService.setMemberActive({ dimensionCode, memberCode, locale, active: false });
          return;
        }

        const parentMemberCode = readString(formData, "parent_member_code");
        const body = {
          member_code: memberCode || null,
          external_code: readOptionalString(formData, "external_code"),
          sort_order: readInteger(formData, "sort_order", 0),
          valid_from: readOptionalString(formData, "valid_from"),
          valid_to: readOptionalString(formData, "valid_to"),
          is_active: readBoolean(formData, "is_active", true),
          name: readString(formData, "name") || selectedMember?.name || "",
          short_name: readOptionalString(formData, "short_name"),
          description: readOptionalString(formData, "description"),
        };

        if (currentModal === "edit-member") {
          await dimensionsService.updateMember({ dimensionCode, memberCode, locale, body });
        } else {
          await dimensionsService.createMember({ dimensionCode, locale, body });
          if (currentModal === "add-child" && parentMemberCode && memberCode) {
            await dimensionsService.createMemberRelationship({
              dimensionCode,
              locale,
              body: {
                parent_member_code: parentMemberCode,
                child_member_code: memberCode,
                relationship_type: "PARENT_CHILD",
                sort_order: readInteger(formData, "sort_order", 0),
                is_active: true,
              },
            });
          }
        }
        setSelectedMemberCode(memberCode);
        return;
      }

      if (["create-member-set", "edit-member-set", "delete-member-set"].includes(currentModal)) {
        const dimensionCode = selectedDimension.dimension_code;
        const setCode = readString(formData, "set_code") || selectedMemberSet?.set_code || "";

        if (isDelete) {
          await dimensionsService.setMemberSetActive({ dimensionCode, setCode, locale, active: false });
          return;
        }

        const body = {
          set_code: setCode || null,
          set_type: readString(formData, "set_type") || "CONTROLLED_SCOPE",
          is_active: readBoolean(formData, "is_active", true),
          name: readString(formData, "name") || selectedMemberSet?.name || "",
          description: readOptionalString(formData, "description"),
        };

        if (currentModal === "create-member-set") {
          await dimensionsService.createMemberSet({ dimensionCode, locale, body });
        } else {
          await dimensionsService.updateMemberSet({ dimensionCode, setCode, locale, body });
        }
        setSelectedMemberSetCode(setCode);
        return;
      }

      if (["create-geography", "edit-geography", "delete-geography"].includes(currentModal)) {
        const geographyCode = readString(formData, "geography_code") || selectedGeography?.geography_code || "";

        if (isDelete) {
          await dimensionsService.setGeographyActive({ geographyCode, locale, active: false });
          return;
        }

        const body = {
          geography_code: geographyCode || null,
          member_code: readOptionalString(formData, "member_code"),
          level_code: readString(formData, "level_code") || selectedGeography?.level_code || "",
          parent_geography_code: readOptionalString(formData, "parent_geography_code"),
          iso_alpha2_code: readOptionalString(formData, "iso_alpha2_code"),
          iso_alpha3_code: readOptionalString(formData, "iso_alpha3_code"),
          is_active: readBoolean(formData, "is_active", true),
          name: readString(formData, "name") || selectedGeography?.name || "",
        };

        if (currentModal === "create-geography") {
          await dimensionsService.createGeography({ locale, body });
        } else {
          await dimensionsService.updateGeography({ geographyCode, locale, body });
        }
        setSelectedGeographyCode(geographyCode);
        return;
      }

      if (["create-time-period", "edit-time-period", "delete-time-period"].includes(currentModal)) {
        const timePeriodCode = readString(formData, "time_period_code") || selectedTimePeriod?.time_period_code || "";

        if (isDelete) {
          await dimensionsService.setTimePeriodActive({ timePeriodCode, locale, active: false });
          return;
        }

        const body = {
          time_period_code: timePeriodCode || null,
          member_code: readOptionalString(formData, "member_code"),
          frequency_code: readString(formData, "frequency_code") || selectedTimePeriod?.frequency_code || "ANNUAL",
          period_year: readInteger(formData, "period_year", new Date().getFullYear()) ?? new Date().getFullYear(),
          period_quarter: readInteger(formData, "period_quarter"),
          period_month: readInteger(formData, "period_month"),
          start_date: readString(formData, "start_date"),
          end_date: readString(formData, "end_date"),
          status: readString(formData, "status") || "ACTIVE",
          is_active: readBoolean(formData, "is_active", true),
          name: readString(formData, "name") || selectedTimePeriod?.name || "",
        };

        if (currentModal === "create-time-period") {
          await dimensionsService.createTimePeriod({ locale, body });
        } else {
          await dimensionsService.updateTimePeriod({ timePeriodCode, locale, body });
        }
        setSelectedTimePeriodCode(body.is_active && body.status !== "RETIRED" ? timePeriodCode : "");
      }
    },
    onSuccess: async () => {
      await invalidateDimensionQueries();
      setMutationError(null);
      setMutationMessage("Dimension reference saved. Latest API data is being refreshed.");
      setModal(null);
      window.setTimeout(() => setMutationMessage(null), 5000);
    },
    onError: (error) => {
      setMutationMessage(null);
      setMutationError(safeApiMessage(error));
    },
  });

  const handleModalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!modal) return;
    setMutationError(null);
    dimensionMutation.mutate({ currentModal: modal, formData: new FormData(event.currentTarget) });
  };

  return (
    <AppShell persona="Unit Admin" activeDashboard="/dashboard/unit-admin">
      <section className="mx-auto flex max-w-[1180px] flex-col gap-4" aria-labelledby="dimensions-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="dimensions-title" className="text-2xl font-bold">Dimension Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage dimension definitions, hierarchy members, member sets, geography, and time references for the selected unit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled title="Dimensions mutation APIs are not available yet."><FileUp aria-hidden="true" className="size-4" /> Bulk upload</Button>
            <Button variant="outline" disabled title="Download endpoint is not available yet."><Download aria-hidden="true" className="size-4" /> Download format</Button>
            <Button variant="outline" onClick={() => setModal("create-dimension")}><Plus aria-hidden="true" className="size-4" /> New dimension</Button>
            <Button variant="outline" onClick={() => openMemberModal("create-root")}><Plus aria-hidden="true" className="size-4" /> New root</Button>
            <Button disabled={!selectedMember} onClick={() => openMemberModal("add-child")}><Plus aria-hidden="true" className="size-4" /> Add child</Button>
          </div>
        </div>

        {isInitialLoading ? (
          <Loader variant="section" label="Loading Dimensions data" />
        ) : null}

        {primaryDataError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {safeApiMessage(primaryDataError)} Data is not available.
          </div>
        ) : supplementalDataError ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            Some dimension reference details are not available. The loaded dimension records are shown below.
          </div>
        ) : null}

        {mutationMessage ? (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900" role="status">
            {mutationMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-5 gap-3 max-xl:grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {statCards.map((card) => (
            <button
              key={card.label}
              type="button"
              className="min-h-[132px] rounded-md bg-card p-3 text-left shadow-sm ring-1 ring-border/60 hover:bg-muted/30"
              onClick={() => setActiveTab(card.targetTab)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
                <Badge variant="outline">{card.badge}</Badge>
              </div>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs font-semibold">{card.helper}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{card.detail}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{card.footnote}</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 max-xl:grid-cols-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Dimensions</CardTitle>
                <Badge variant="outline">{filteredDimensions.length}/{dimensionDefinitions.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid max-h-[460px] gap-2 overflow-y-auto pr-3">
              <label className="mb-1 flex items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search dimensions</span>
                <Input
                  className="border-0 bg-transparent"
                  placeholder="Search dimensions"
                  value={dimensionSearch}
                  onChange={(event) => setDimensionSearch(event.target.value)}
                />
              </label>
              {filteredDimensions.map((dimension) => (
                <button
                  key={dimension.dimension_code}
                  type="button"
                  onClick={() => {
                    setSelectedDimensionCode(dimension.dimension_code);
                    setSelectedMemberCode("");
                    setTreeSearch("");
                    setTableSearch("");
                  }}
                  className={[
                    "rounded-md px-3 py-2 text-left text-xs hover:bg-muted",
                    selectedDimensionCode === dimension.dimension_code ? "bg-accent text-accent-foreground" : "bg-muted/40",
                  ].join(" ")}
                >
                  <span className="block font-bold">{dimension.name}</span>
                  <span className="block font-mono text-[11px] text-muted-foreground">{dimension.dimension_code} / {dimension.dimension_type}</span>
                  <span className="mt-1 flex gap-1">
                    <Badge variant={statusVariant(normalizeStatus(dimension.status))}>{normalizeStatus(dimension.status)}</Badge>
                    <Badge variant="outline">{toNumber(dimension.member_count)} members</Badge>
                  </span>
                </button>
              ))}
              {!filteredDimensions.length ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">No dimensions found.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
              <CardTitle>Member hierarchy</CardTitle>
                <Button size="sm" variant="outline" onClick={() => openMemberModal("create-root")}>
                  <Plus aria-hidden="true" className="size-4" />
                  Root
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <label className="mb-3 flex items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search member hierarchy</span>
                <Input className="border-0 bg-transparent" placeholder="Search all hierarchy levels" value={treeSearch} onChange={(event) => setTreeSearch(event.target.value)} />
              </label>
              <div className="max-h-[380px] overflow-y-auto rounded-md bg-muted/30 py-2">
                {membersQuery.isFetching ? (
                  <Loader variant="inline" label="Loading members" className="justify-center px-3 py-6" />
                ) : rootMembers.length ? rootMembers.map((member) => renderTreeMember(member)) : (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">No members found for this filter.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Selected member</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={!selectedMember} onClick={() => openMemberModal("view-member")}><Eye aria-hidden="true" className="size-4" /> View</Button>
                <Button size="sm" variant="outline" disabled={!selectedMember} onClick={() => openMemberModal("edit-member")}><Edit3 aria-hidden="true" className="size-4" /> Edit</Button>
                <Button size="sm" variant="outline" disabled={!selectedMember} onClick={() => openMemberModal("add-child")}><Plus aria-hidden="true" className="size-4" /> Add child</Button>
                <Button size="sm" variant="destructive" disabled={!selectedMember} onClick={() => openMemberModal("delete-member")}><Trash2 aria-hidden="true" className="size-4" /> Deactivate</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-8 gap-3 text-xs max-xl:grid-cols-4 max-md:grid-cols-2">
              {[
                ["Dimension", selectedDimension.dimension_code],
                ["Type", selectedDimension.dimension_type],
                ["Member", selectedMember?.member_code],
                ["Parent", selectedMember?.parent_member_code ?? "ROOT"],
                ["Depth", selectedMember ? `Level ${getMemberDepth(selectedMember)}` : "-"],
                ["Children", selectedMember ? memberChildren(selectedMember.member_code).length : 0],
                ["Value type", selectedDimension.value_type],
                ["Status", normalizeStatus(selectedMember?.status)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-muted/50 p-3">
                  <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
                  <p className="mt-1 break-words font-mono text-[11px] font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_420px] gap-4 max-lg:grid-cols-1">
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-sm font-bold">{selectedDimension.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedDimensionDescription}</p>
                <p className="mt-3 text-sm font-bold">{selectedMember?.name ?? "No member selected"}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{selectedMember?.external_code ?? "-"}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-3">
                <p className="text-sm font-bold">Dependency / usage</p>
                <div className="mt-2 grid gap-2">
                  {(usageRows.length ? usageRows : [{ id: "none", usage_area: "Usage API unavailable", dependency: "No governed Dimensions usage endpoint is available in the current contract.", record_count: 0, risk: "LOW" as const }]).map((usage) => (
                    <div key={usage.id} className="grid grid-cols-[1fr_auto] gap-2 text-xs">
                      <span>
                        <span className="block font-semibold">{usage.usage_area}</span>
                        <span className="text-muted-foreground">{usage.dependency}</span>
                      </span>
                      <Badge variant={statusVariant(usage.risk)}>{usage.risk}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Dimension detail tabs">
                {tabs.map((tab) => (
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
              <label className="flex min-w-80 items-center gap-2 rounded-md bg-muted/60 px-2">
                <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Search table</span>
                <Input className="border-0 bg-transparent" placeholder="Search records" value={tableSearch} onChange={(event) => setTableSearch(event.target.value)} />
              </label>
            </div>

            {activeTab === "members" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>External</TableHead>
                    <TableHead>Sort</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersQuery.isFetching ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6">
                        <Loader variant="inline" label="Loading members" className="justify-center" />
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.map((member) => (
                    <TableRow key={member.member_code}>
                      <TableCell>
                        <span className="block font-mono text-[11px]">{member.member_code}</span>
                        <span className="text-xs font-semibold">{member.name}</span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{member.parent_member_code ?? "ROOT"}</TableCell>
                      <TableCell className="font-mono text-[11px]">{member.external_code}</TableCell>
                      <TableCell>{member.sort_order ?? "-"}</TableCell>
                      <TableCell><Badge variant={statusVariant(normalizeStatus(member.status))}>{normalizeStatus(member.status)}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon-xs" variant="outline" aria-label="View" onClick={() => openMemberModal("view-member", member)}><Eye aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Edit" onClick={() => openMemberModal("edit-member", member)}><Edit3 aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="outline" aria-label="Add child" onClick={() => openMemberModal("add-child", member)}><Plus aria-hidden="true" className="size-3" /></Button>
                          <Button size="icon-xs" variant="destructive" aria-label="Deactivate" onClick={() => openMemberModal("delete-member", member)}><Trash2 aria-hidden="true" className="size-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!membersQuery.isFetching && !filteredMembers.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                        No members found for this filter.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            ) : null}

            {activeTab === "rollups" ? (
              <div className="grid gap-3">
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  Rollup rules define parent-member behavior for template/data-entry validation. They are not a full formula engine.
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Children</TableHead>
                      <TableHead>Entry mode</TableHead>
                      <TableHead>Aggregation</TableHead>
                      <TableHead>Measure</TableHead>
                      <TableHead>Validation</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rollupRulesForDimension.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono text-[11px]">{rule.rule_code}</TableCell>
                        <TableCell>
                          <span className="block font-semibold">{rule.parent_label}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{rule.parent_member_code}</span>
                        </TableCell>
                        <TableCell className="max-w-64 whitespace-normal">
                          {rule.children.map((child) => (
                            <Badge key={child.member_code} variant="outline" className="mr-1">{child.child_order}. {child.label}</Badge>
                          ))}
                        </TableCell>
                        <TableCell><Badge variant="outline">{rule.entry_mode}</Badge></TableCell>
                        <TableCell>{rule.aggregation_method}</TableCell>
                        <TableCell className="font-mono text-[11px]">{rule.measure_code}</TableCell>
                        <TableCell className="font-mono text-[11px]">{rule.validation_rule_code}</TableCell>
                        <TableCell><Badge variant={statusVariant(rule.status)}>{rule.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {!rollupRulesForDimension.length ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                          No rollup rules configured for this dimension.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {activeTab === "member-sets" ? (
              <div className="grid gap-3">
                <div className="flex justify-end">
                  <Button onClick={() => setModal("create-member-set")}><Plus aria-hidden="true" className="size-4" /> Add member set</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Set</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberSetsForDimension.map((set) => (
                      <TableRow key={set.set_code}>
                        <TableCell className="font-mono text-[11px]">{set.set_code}</TableCell>
                        <TableCell>{set.set_type ?? "-"}</TableCell>
                        <TableCell>{set.name}</TableCell>
                        <TableCell>{set.set_code === selectedMemberSet?.set_code ? memberSetMembersQuery.data?.count ?? toNumber(set.member_count) : toNumber(set.member_count)}</TableCell>
                        <TableCell><Badge variant={statusVariant(normalizeStatus(set.status))}>{normalizeStatus(set.status)}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon-xs" variant="outline" aria-label="Edit" onClick={() => { setSelectedMemberSetCode(set.set_code); setModal("edit-member-set"); }}><Edit3 aria-hidden="true" className="size-3" /></Button>
                            <Button size="icon-xs" variant="destructive" aria-label="Deactivate" onClick={() => { setSelectedMemberSetCode(set.set_code); setModal("delete-member-set"); }}><Trash2 aria-hidden="true" className="size-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!memberSetsForDimension.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                          No member sets returned for this dimension.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {activeTab === "geography" ? (
              <div className="grid gap-3">
                <div className="flex justify-end">
                  <Button onClick={() => setModal("create-geography")}><Plus aria-hidden="true" className="size-4" /> Add geography</Button>
                </div>
                {selectedGeographyQuery.data?.data ? (
                  <div className="rounded-md bg-muted/40 p-3 text-xs">
                    <span className="font-semibold">Selected geography detail:</span>{" "}
                    <span className="font-mono">{selectedGeographyQuery.data.data.geography_code}</span>
                    <span className="text-muted-foreground"> / {selectedGeographyQuery.data.data.name}</span>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 text-xs">
                  {geographyLevels.map((level) => (
                    <Badge key={level.level_code} variant="outline">{level.level_number}. {level.name}</Badge>
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Geography</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>ISO</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geographies.filter((geo) => Object.values(geo).join(" ").toLowerCase().includes(tableSearch.toLowerCase())).map((geo) => (
                      <TableRow key={geo.geography_code}>
                        <TableCell>
                          <span className="block font-mono text-[11px]">{geo.geography_code}</span>
                          <span className="text-xs font-semibold">{geo.name}</span>
                        </TableCell>
                        <TableCell>{geo.level_code}</TableCell>
                        <TableCell className="font-mono text-[11px]">{geo.parent_geography_code ?? "ROOT"}</TableCell>
                        <TableCell className="font-mono text-[11px]">{geo.iso_alpha3_code ?? "-"}</TableCell>
                        <TableCell><Badge variant={statusVariant(normalizeStatus(geo.status))}>{normalizeStatus(geo.status)}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon-xs" variant="outline" aria-label="Edit" onClick={() => { setSelectedGeographyCode(geo.geography_code); setModal("edit-geography"); }}><Edit3 aria-hidden="true" className="size-3" /></Button>
                            <Button size="icon-xs" variant="destructive" aria-label="Deactivate" onClick={() => { setSelectedGeographyCode(geo.geography_code); setModal("delete-geography"); }}><Trash2 aria-hidden="true" className="size-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!geographies.length ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                          No geographies returned by the API.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {activeTab === "time" ? (
              <div className="grid gap-3">
                <div className="flex justify-end">
                  <Button onClick={() => setModal("create-time-period")}><Plus aria-hidden="true" className="size-4" /> Add time period</Button>
                </div>
                {selectedTimePeriodQuery.data?.data ? (
                  <div className="rounded-md bg-muted/40 p-3 text-xs">
                    <span className="font-semibold">Selected time-period detail:</span>{" "}
                    <span className="font-mono">{selectedTimePeriodQuery.data.data.time_period_code}</span>
                    <span className="text-muted-foreground"> / {selectedTimePeriodQuery.data.data.name}</span>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2 text-xs">
                  {timeFrequencies.map((frequency) => (
                    <Badge key={frequency.frequency_code} variant="outline">{frequency.name}: {frequency.months_interval} months</Badge>
                  ))}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timePeriods.filter((period) => Object.values(period).join(" ").toLowerCase().includes(tableSearch.toLowerCase())).map((period) => (
                      <TableRow key={period.time_period_code}>
                        <TableCell>
                          <span className="block font-mono text-[11px]">{period.time_period_code}</span>
                          <span className="text-xs font-semibold">{period.name}</span>
                        </TableCell>
                        <TableCell>{period.frequency_code}</TableCell>
                        <TableCell>{period.period_year}</TableCell>
                        <TableCell>{period.start_date}</TableCell>
                        <TableCell>{period.end_date}</TableCell>
                        <TableCell><Badge variant={statusVariant(normalizeStatus(period.status))}>{normalizeStatus(period.status)}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon-xs" variant="outline" aria-label="Edit" onClick={() => { setSelectedTimePeriodCode(period.time_period_code); setModal("edit-time-period"); }}><Edit3 aria-hidden="true" className="size-3" /></Button>
                            <Button size="icon-xs" variant="destructive" aria-label="Deactivate" onClick={() => { setSelectedTimePeriodCode(period.time_period_code); setModal("delete-time-period"); }}><Trash2 aria-hidden="true" className="size-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!timePeriods.length ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-6 text-center text-xs text-muted-foreground">
                          No time periods returned by the API.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Rows load from live Dimensions APIs. Mutations use governed create/update/deactivate endpoints.</span>
              <div className="flex gap-2">
                <Button size="xs" variant="outline" disabled>Previous</Button>
                <Button size="xs" variant="outline" disabled>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <DimensionModalView
        modal={modal}
        selectedDimension={selectedDimension}
        selectedDimensionCode={selectedDimension.dimension_code}
        selectedDimensionName={selectedDimension.name}
        selectedMember={selectedMember}
        selectedMemberSet={selectedMemberSet}
        selectedGeography={selectedGeography}
        selectedTimePeriod={selectedTimePeriod}
        isSubmitting={dimensionMutation.isPending}
        errorMessage={mutationError}
        onSubmit={handleModalSubmit}
        onClose={() => setModal(null)}
      />
    </AppShell>
  );
}
