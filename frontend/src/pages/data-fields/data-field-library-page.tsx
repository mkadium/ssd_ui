import { Database, Edit3, GitBranch, Link2, Plus, RefreshCw, Search, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getDataFieldDetail,
  listDataFields,
  mapDataFieldPeriodicity,
  mapDataFieldSource,
  restoreDataFieldMapping,
  unmapDataFieldMapping,
  type DataFieldDetail,
  type DataFieldListItem,
  type DataFieldMapping,
  type DataFieldPeriodicityMappingPayload,
  type DataFieldSourceMappingPayload,
} from "../../api/data-fields.api";
import {
  listAllTimePeriods,
  listDimensionMembers,
  listDimensionMemberSetMembers,
  listDimensionMemberSets,
  listDimensions,
  listGeographies,
  listTimePeriodSetPeriods,
  type DimensionManagementRow,
  type DimensionMember,
  type DimensionMemberSet,
  type DimensionMemberSetItem,
  type Geography,
  type TimePeriod,
} from "../../api/dimensions.api";
import { listMasterRecords, type MasterRecord } from "../../api/masters-reference.api";
import { getSelectedUnitCode, LOCALE_CHANGED_EVENT, UNIT_CHANGED_EVENT } from "../../api/session.api";
import {
  createIndicatorMeasure,
  getIndicator,
  listIndicators,
  updateIndicatorMeasure,
  type IndicatorListItem,
  type IndicatorMeasurePayload,
  type IndicatorVersion,
} from "../../api/indicators.api";
import { getTemplateStudioDraft, listTemplateIndicatorMappings, listTemplates, listTemplateVersions } from "../../api/templates.api";

type DetailTab = "overview" | "indicator" | "source" | "periodicity" | "templateGrain";
type MappingPanel = "" | "measure" | "source" | "periodicity";
type MappingType = "SOURCE" | "PERIODICITY" | "GRAIN";
type TemplateLibraryItem = {
  id?: string;
  code?: string;
  type?: string;
  label?: string;
  name?: string;
  badge?: string;
  subLabel?: string;
  dimensionCode?: string;
  memberCount?: number;
};
type TemplateStudioState = {
  builder?: {
    fields?: TemplateLibraryItem[];
    tabsBy?: TemplateLibraryItem[];
    rowRepresents?: TemplateLibraryItem[];
    rowLevels?: TemplateLibraryItem[][];
    columns?: TemplateLibraryItem[];
    columnLevels?: TemplateLibraryItem[][];
  };
  cellMap?: Record<string, TemplateLibraryItem>;
  indicatorMapping?: unknown;
  indicatorMappings?: unknown;
  mappedIndicators?: unknown;
};
type TemplateGrainUsage = {
  templateCode: string;
  templateName: string;
  versionCode: string;
  versionName: string;
  indicator: string;
  sources: string[];
  columns: string;
  rows: string;
  tabs: string;
  grainText: string;
};

const SOURCE_ROLES = ["PRIMARY_SOURCE", "SECONDARY_SOURCE", "REVIEW_SOURCE", "DATA_PROVIDER", "VIEWER"];
const PERIODICITY_ROLES = ["COLLECTION", "REPORTING", "VALIDATION", "DISPLAY"];
const EMPTY_SOURCE_FORM = {
  mapping_code: "",
  source_organization_code: "",
  assignment_role: "PRIMARY_SOURCE",
  valid_from: "",
  valid_to: "",
  sort_order: "0",
};

const EMPTY_PERIODICITY_FORM = {
  mapping_code: "",
  periodicity_code: "",
  mapping_role: "COLLECTION",
  is_default: true,
  valid_from: "",
  valid_to: "",
  sort_order: "0",
};

const EMPTY_MEASURE_FORM = {
  mode: "create",
  indicator_code: "",
  version_code: "",
  measure_code: "",
  name: "",
  value_type: "NUMBER",
  unit_code: "",
  aggregation_type: "SUM",
  sort_order: "0",
  is_required: true,
  is_active: true,
  description: "",
};

function textValue(value: unknown): string {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function titleFromCode(value: unknown) {
  const text = textValue(value);
  if (text === "-") return "-";
  return text
    .split("_")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function titleFromMemberCode(value: unknown, dimensionCode?: unknown) {
  const text = textValue(value);
  if (text === "-") return "-";
  const dimension = textValue(dimensionCode).toUpperCase();
  const normalized = text.toUpperCase();
  const trimmed =
    dimension !== "-" && normalized.startsWith(`${dimension}_`)
      ? text.slice(dimension.length + 1)
      : text;
  return titleFromCode(trimmed);
}

function compactDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function codeOf(field: DataFieldListItem | DataFieldDetail | null | undefined) {
  const row = overviewOf((field ?? null) as DataFieldDetail | null);
  return textValue(row.measure_code);
}

function nameOf(field: DataFieldListItem | DataFieldDetail | null | undefined) {
  const row = overviewOf((field ?? null) as DataFieldDetail | null);
  return textValue(row.data_field_name ?? row.measure_name ?? row.name ?? row.measure_code);
}

function overviewOf(detail: DataFieldDetail | null): DataFieldListItem {
  return detail?.overview ?? detail ?? {};
}

function mappingCode(item: DataFieldMapping) {
  return textValue(item.mapping_code ?? item.source_mapping_code ?? item.periodicity_mapping_code ?? item.grain_mapping_code);
}

function optionLabel(record: MasterRecord, codeKey: string, nameKeys: string[]) {
  const code = textValue(record[codeKey]);
  const label = nameKeys.map((key) => record[key]).find(Boolean);
  return `${textValue(label)} (${code})`;
}

function dimensionLabel(record: DimensionManagementRow) {
  return `${textValue(record.dimension_name ?? record.name)} (${textValue(record.dimension_code)})`;
}

function memberLabel(record: DimensionMember) {
  return `${textValue(record.name)} (${textValue(record.member_code)})`;
}

function setLabel(record: DimensionMemberSet) {
  return `${textValue(record.name)} (${textValue(record.set_code)})`;
}

function geographyLabel(record: Geography) {
  return `${textValue(record.name)} (${textValue(record.geography_code ?? record.member_code)})`;
}

function timePeriodLabel(record: TimePeriod) {
  return `${textValue(record.name ?? record.time_period_code)} (${textValue(record.time_period_code ?? record.member_code)})`;
}

function activeMappings(rows?: DataFieldMapping[] | null) {
  return (rows ?? []).filter((item) => item.is_active !== false);
}

function isPublishedStatus(value: unknown) {
  return ["PUBLISHED", "ACTIVE"].includes(String(value ?? "").trim().toUpperCase());
}

function mappingSummary(type: MappingType, rows?: DataFieldMapping[] | null, fallback?: unknown) {
  const values = activeMappings(rows)
    .map((item) => primaryMappingText(type, item))
    .filter((value) => value && value !== "-");
  if (values.length) return values.join(" + ");
  if (Array.isArray(fallback) && fallback.length) {
    return fallback
      .map((item) => (typeof item === "object" ? primaryMappingText(type, item as DataFieldMapping) : textValue(item)))
      .filter((value) => value !== "-")
      .join(" + ") || "-";
  }
  return textValue(fallback);
}

function recordSourceSummary(record: DataFieldListItem) {
  return mappingSummary("SOURCE", record.source_organizations, record.source_organization_name ?? record.ministry_name ?? record.source_organization_code);
}

function recordPeriodicitySummary(record: DataFieldListItem) {
  return mappingSummary("PERIODICITY", record.periodicities, record.periodicity_name ?? record.periodicity_code);
}

function recordGrainSummary(record: DataFieldListItem) {
  return mappingSummary("GRAIN", record.grains, record.grain_labels ?? record.default_grain ?? record.grain_label ?? record.grain_summary);
}

function itemLabel(item?: TemplateLibraryItem | null) {
  return textValue(item?.label ?? item?.name ?? item?.code ?? item?.id);
}

function axisText(items?: TemplateLibraryItem[] | null) {
  const values = (items ?? []).map(itemLabel).filter((value) => value !== "-");
  return values.length ? values.join(" / ") : "-";
}

function memberSetItemText(item: DimensionMemberSetItem) {
  return textValue(item.localized_name ?? item.display_name ?? item.member_name ?? item.name ?? item.alias_value ?? item.member_code);
}

function summarizeAxisMembers(parentLabel: string, memberLabels: string[]) {
  const values = memberLabels.filter((value) => value && value !== "-");
  if (!values.length) return parentLabel;
  const preview = values.slice(0, 8).join(" / ");
  const suffix = values.length > 8 ? ` / +${values.length - 8}` : "";
  return `${parentLabel} (${preview}${suffix})`;
}

function templateIndicatorMappingText(rows?: Array<Record<string, unknown>> | null) {
  const labels = (rows ?? [])
    .filter((row) => row.is_active !== false && textValue(row.mapping_role).toUpperCase() === "PRIMARY")
    .map((row) => {
      const code = textValue(row.indicator_number ?? row.national_indicator_code ?? row.indicator_code ?? row.code);
      const name = textValue(row.indicator_name ?? row.name ?? row.label);
      if (code !== "-" && name !== "-") return `${code} - ${name}`;
      return code !== "-" ? code : name;
    })
    .filter((value) => value && value !== "-");
  return labels.length ? labels.join(" / ") : "";
}

function flattenAxisLevels(levels?: TemplateLibraryItem[][] | null, fallback?: TemplateLibraryItem[] | null) {
  const nested = levels?.flatMap((level) => level ?? []) ?? [];
  return nested.length ? nested : fallback ?? [];
}

function measureMatches(item: TemplateLibraryItem | undefined, measureCode: string) {
  const code = measureCode.toUpperCase();
  return [
    item?.code,
    item?.id,
    (item as Record<string, unknown> | undefined)?.sourceMeasureCode,
    (item as Record<string, unknown> | undefined)?.measure_code,
  ]
    .map(textValue)
    .some((value) => value.toUpperCase() === code || value.toUpperCase().endsWith(`:${code}`));
}

function sourcesForDetail(detail: DataFieldDetail | null) {
  const sourceRows = activeMappings(detail?.source_mappings);
  const fallback = overviewOf(detail);
  const values = sourceRows.length
    ? sourceRows.map((item) => primaryMappingText("SOURCE", item))
    : [fallback.source_organization_name ?? fallback.ministry_name ?? fallback.source_organization_code];
  return values.map(textValue).filter((value) => value !== "-");
}

export function DataFieldLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState<DataFieldListItem[]>([]);
  const [selected, setSelected] = useState<DataFieldListItem | null>(null);
  const [detail, setDetail] = useState<DataFieldDetail | null>(null);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [panel, setPanel] = useState<MappingPanel>("");
  const [searchText, setSearchText] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [periodicityFilter, setPeriodicityFilter] = useState("ALL");
  const [uomFilter, setUomFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [templateGrainUsage, setTemplateGrainUsage] = useState<Record<string, TemplateGrainUsage[]>>({});
  const [grainUsageRecord, setGrainUsageRecord] = useState<DataFieldListItem | null>(null);
  const [isGrainUsageLoading, setIsGrainUsageLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [organizations, setOrganizations] = useState<MasterRecord[]>([]);
  const [periodicities, setPeriodicities] = useState<MasterRecord[]>([]);
  const [uoms, setUoms] = useState<MasterRecord[]>([]);
  const [dimensions, setDimensions] = useState<DimensionManagementRow[]>([]);
  const [dimensionMembers, setDimensionMembers] = useState<DimensionMember[]>([]);
  const [dimensionSets, setDimensionSets] = useState<DimensionMemberSet[]>([]);
  const [grainSetItems, setGrainSetItems] = useState<Record<string, DimensionMemberSetItem[]>>({});
  const [geographies, setGeographies] = useState<Geography[]>([]);
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>([]);
  const [indicators, setIndicators] = useState<IndicatorListItem[]>([]);
  const [indicatorVersions, setIndicatorVersions] = useState<IndicatorVersion[]>([]);
  const [sourceForm, setSourceForm] = useState(EMPTY_SOURCE_FORM);
  const [periodicityForm, setPeriodicityForm] = useState(EMPTY_PERIODICITY_FORM);
  const [measureForm, setMeasureForm] = useState(EMPTY_MEASURE_FORM);
  const routeMeasureCode = searchParams.get("measure");
  const isDetailRoute = Boolean(routeMeasureCode);

  useEffect(() => {
    void loadAll();
    const refresh = () => void loadAll();
    window.addEventListener(UNIT_CHANGED_EVENT, refresh);
    window.addEventListener(LOCALE_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(UNIT_CHANGED_EVENT, refresh);
      window.removeEventListener(LOCALE_CHANGED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!routeMeasureCode || isLoading) return;
    const record = records.find((item) => item.measure_code === routeMeasureCode) ?? ({ measure_code: routeMeasureCode } as DataFieldListItem);
    if (selected?.measure_code === routeMeasureCode && detail) return;
    void openDetail(record, false);
  }, [detail, isLoading, records, routeMeasureCode, selected?.measure_code]);

  useEffect(() => {
    if (!measureForm.indicator_code) {
      setIndicatorVersions([]);
      return;
    }
    void loadIndicatorVersions(measureForm.indicator_code);
  }, [measureForm.indicator_code]);

  async function loadAll() {
    setIsLoading(true);
    setError("");
    try {
      const [dataFieldResponse, orgResponse, periodicityResponse, uomResponse, dimensionResponse, geographyResponse, timeResponse, indicatorResponse] =
        await Promise.all([
          listDataFields({ limit: 500, offset: 0 }),
          listMasterRecords({ endpoint: "/masters/organizations" }),
          listMasterRecords({ endpoint: "/masters/periodicities" }),
          listMasterRecords({ endpoint: "/masters/uom" }),
          listDimensions(),
          listGeographies({ limit: 500, offset: 0 }),
          listAllTimePeriods(),
          listIndicators(500, 0),
        ]);
      setRecords(dataFieldResponse.data ?? []);
      setOrganizations(orgResponse.data ?? []);
      setPeriodicities(periodicityResponse.data ?? []);
      setUoms(uomResponse.data ?? []);
      setDimensions(dimensionResponse.data ?? []);
      setGeographies(geographyResponse.data ?? []);
      setTimePeriods(timeResponse.data ?? []);
      setIndicators(indicatorResponse.data ?? []);
      void loadGrainMemberSetItems(dataFieldResponse.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data Field Library could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadIndicatorVersions(indicatorCode: string) {
    try {
      const response = await getIndicator(indicatorCode);
      const versions: IndicatorVersion[] = response.data?.versions ?? [];
      setIndicatorVersions(versions);
      if (!measureForm.version_code && versions.length) {
        const current = versions.find((version) => version.is_current || String(version.status ?? "").toUpperCase() === "ACTIVE") ?? versions[0];
        setMeasureForm((existing) => ({ ...existing, version_code: current.version_code ?? "" }));
      }
    } catch {
      setIndicatorVersions([]);
    }
  }

  async function loadDimensionRefs(dimensionCode: string) {
    try {
      const [memberResponse, setResponse] = await Promise.all([
        listDimensionMembers(dimensionCode, 500),
        listDimensionMemberSets(dimensionCode),
      ]);
      setDimensionMembers(memberResponse.data ?? []);
      setDimensionSets(setResponse.data ?? []);
    } catch {
      setDimensionMembers([]);
      setDimensionSets([]);
    }
  }

  async function loadGrainMemberSetItems(items: Array<DataFieldListItem | DataFieldMapping>) {
    const setCodes = Array.from(
      new Set(
        items
          .flatMap((item) => [...((item as DataFieldListItem).grains ?? []), item as DataFieldMapping])
          .map((item) => textValue(item.member_set_code))
          .filter((code) => code !== "-" && !grainSetItems[code]),
      ),
    );
    if (!setCodes.length) return;
    const entries = await Promise.all(
      setCodes.map(async (setCode) => {
        const response = await listDimensionMemberSetMembers(setCode, 500).catch(() => ({ data: [] as DimensionMemberSetItem[] }));
        return [setCode, response.data ?? []] as const;
      }),
    );
    setGrainSetItems((current) => ({ ...current, ...Object.fromEntries(entries) }));
  }

  async function openDetail(record: DataFieldListItem, navigateToDetail = true) {
    const measureCode = record.measure_code;
    if (!measureCode) return;
    setSelected(record);
    if (navigateToDetail) {
      setSearchParams({ measure: measureCode });
    }
    setIsDetailLoading(true);
    setError("");
    try {
      const nextDetail = await getDataFieldDetail(measureCode, {
        indicatorCode: record.national_indicator_code ?? record.indicator_code ?? record.indicator_number,
        versionCode: record.version_code,
      });
      setDetail(nextDetail);
      await loadGrainMemberSetItems([...(nextDetail.grain_mappings ?? []), overviewOf(nextDetail)]);
      await loadTemplateGrainUsage(nextDetail, true);
      const nextOverview = overviewOf(nextDetail);
      setRecords((current) =>
        current.map((item) =>
          item.measure_code === measureCode
            ? {
                ...item,
                ...nextOverview,
                source_organizations: nextDetail.source_mappings ?? item.source_organizations,
                periodicities: nextDetail.periodicity_mappings ?? item.periodicities,
                grains: nextDetail.grain_mappings ?? item.grains,
                grain_summary: grainSummaryForDetail(nextDetail),
              }
            : item,
        ),
      );
      setTab("overview");
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : "Data field details could not be loaded.");
    } finally {
      setIsDetailLoading(false);
    }
  }

  function mergeDetailIntoList(nextDetail: DataFieldDetail) {
    const nextOverview = overviewOf(nextDetail);
    const measureCode = nextOverview.measure_code ?? nextDetail.measure_code;
    if (!measureCode) return;
    const nextRecord: DataFieldListItem = {
      ...nextOverview,
      source_organizations: nextDetail.source_mappings ?? nextOverview.source_organizations,
      periodicities: nextDetail.periodicity_mappings ?? nextOverview.periodicities,
      grains: nextDetail.grain_mappings ?? nextOverview.grains,
      grain_summary: grainSummaryForDetail(nextDetail),
    };
    setSelected((current) => ({ ...(current ?? {}), ...nextRecord }));
    setRecords((current) => {
      let found = false;
      const updated = current.map((item) => {
        if (item.measure_code !== measureCode) return item;
        found = true;
        return { ...item, ...nextRecord };
      });
      return found ? updated : [nextRecord, ...updated];
    });
  }

  async function refreshDetailSilently(record: DataFieldListItem | null = selected) {
    const measureCode = record?.measure_code ?? selectedMeasureCode;
    if (!measureCode) return;
    const nextDetail = await getDataFieldDetail(measureCode, {
      indicatorCode: record?.national_indicator_code ?? record?.indicator_code ?? record?.indicator_number ?? selectedIndicatorCode,
      versionCode: record?.version_code ?? selectedVersionCode,
    });
    setDetail(nextDetail);
    await loadGrainMemberSetItems([...(nextDetail.grain_mappings ?? []), overviewOf(nextDetail)]);
    await loadTemplateGrainUsage(nextDetail, true);
    mergeDetailIntoList(nextDetail);
  }

  async function refreshListSilently(selectMeasureCode?: string) {
    const response = await listDataFields({ limit: 500, offset: 0 });
    const nextRecords = response.data ?? [];
    setRecords(nextRecords);
    await loadGrainMemberSetItems(nextRecords);
    if (selectMeasureCode) {
      const nextRecord = nextRecords.find((item) => item.measure_code === selectMeasureCode);
      if (nextRecord) {
        setSelected(nextRecord);
        await refreshDetailSilently(nextRecord);
      }
    }
  }

  async function axisItemTextWithMembers(item: TemplateLibraryItem) {
    const label = itemLabel(item);
    const code = textValue(item.code);
    if (!code || code === "-") return label;
    try {
      if (item.type === "TIME_SET") {
        const response = await listTimePeriodSetPeriods(code);
        return summarizeAxisMembers(label, (response.data ?? []).map(memberSetItemText));
      }
      if (item.type === "DIMENSION_SET" || item.type === "GEOGRAPHY_SET") {
        const response = await listDimensionMemberSetMembers(code, 300);
        return summarizeAxisMembers(label, (response.data ?? []).map(memberSetItemText));
      }
    } catch {
      return label;
    }
    return label;
  }

  async function axisTextWithMembers(items?: TemplateLibraryItem[] | null) {
    const values = await Promise.all((items ?? []).map(axisItemTextWithMembers));
    const filtered = values.filter((value) => value && value !== "-");
    return filtered.length ? filtered.join(" / ") : "-";
  }

  async function loadTemplateGrainUsage(record: DataFieldListItem | DataFieldDetail | null = selected, force = false) {
    const measureCode = codeOf(record);
    if (!measureCode || measureCode === "-") return [];
    if (!force && templateGrainUsage[measureCode]) return templateGrainUsage[measureCode];

    setIsGrainUsageLoading(true);
    try {
      const recordDetail = record && "source_mappings" in record ? record : null;
      const detailForSource =
        recordDetail && codeOf(recordDetail) === measureCode
          ? recordDetail
          : detail && codeOf(detail) === measureCode
          ? detail
          : await getDataFieldDetail(measureCode, {
              indicatorCode: record?.national_indicator_code ?? record?.indicator_code ?? record?.indicator_number,
              versionCode: record?.version_code,
            }).catch(() => null);
      const templates = (await listTemplates({ limit: 200 })).data ?? [];
      const usage: TemplateGrainUsage[] = [];
      const sourceNames = sourcesForDetail(detailForSource);

      for (const template of templates) {
        const templateCode = textValue(template.template_code);
        if (templateCode === "-") continue;
        const versions = (await listTemplateVersions(templateCode).catch(() => ({ data: [] }))).data ?? [];
        for (const version of versions) {
          const versionCode = textValue(version.version_code);
          if (versionCode === "-") continue;
          if (!isPublishedStatus(version.status)) continue;
          const draft = await getTemplateStudioDraft(versionCode).catch(() => null);
          const studioState = draft?.data?.studio_state as TemplateStudioState | undefined;
          const builder = studioState?.builder;
          if (!builder) continue;

          const fieldMatches = (builder.fields ?? []).some((item) => measureMatches(item, measureCode));
          const cellMatches = Object.values(studioState?.cellMap ?? {}).some((item) => measureMatches(item, measureCode));
          if (!fieldMatches && !cellMatches) continue;

          const columns = flattenAxisLevels(builder.columnLevels, builder.columns);
          const rows = flattenAxisLevels(builder.rowLevels, builder.rowRepresents);
          const tabs = builder.tabsBy ?? [];
          const columnsText = await axisTextWithMembers(columns);
          const rowsText = await axisTextWithMembers(rows);
          const tabsText = await axisTextWithMembers(tabs);
          const grainParts = [columnsText, tabsText, rowsText].filter((value) => value && value !== "-");
          const mappingResponse = await listTemplateIndicatorMappings(versionCode).catch(() => ({ data: [] }));
          const mappedIndicator = templateIndicatorMappingText(mappingResponse.data as Array<Record<string, unknown>>);

          usage.push({
            templateCode,
            templateName: textValue(template.name ?? template.template_name ?? template.template_code),
            versionCode,
            versionName: textValue(version.title ?? version.version_code),
            indicator: mappedIndicator,
            sources: sourceNames.length ? sourceNames : ["Source pending"],
            columns: columnsText,
            rows: rowsText,
            tabs: tabsText,
            grainText: grainParts.length ? grainParts.join(" - ") : "Template structure saved without explicit grain axes",
          });
        }
      }

      setTemplateGrainUsage((current) => ({ ...current, [measureCode]: usage }));
      return usage;
    } finally {
      setIsGrainUsageLoading(false);
    }
  }

  async function openGrainUsage(record: DataFieldListItem) {
    setGrainUsageRecord(record);
    await loadTemplateGrainUsage(record, true);
  }

  function backToLibrary() {
    setSearchParams({});
    setSelected(null);
    setDetail(null);
    setTab("overview");
    setPanel("");
    setError("");
  }

  const filteredRecords = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    return records.filter((record) => {
      const values = [
        record.measure_code,
        record.measure_name,
        record.name,
        record.indicator_number,
        record.national_indicator_code,
        record.indicator_name,
        record.source_organization_code,
        record.source_organization_name,
        record.department_organization_name,
        record.uom_code,
        record.uom_name,
        record.periodicity_code,
        record.periodicity_name,
      ]
        .map(textValue)
        .join(" ")
        .toLowerCase();
      const status = (record.status ?? (record.is_active === false ? "INACTIVE" : "ACTIVE")).toUpperCase();
      return (
        (!text || values.includes(text)) &&
        (sourceFilter === "ALL" || record.source_organization_code === sourceFilter) &&
        (periodicityFilter === "ALL" || record.periodicity_code === periodicityFilter) &&
        (uomFilter === "ALL" || (record.uom_code ?? record.unit_code) === uomFilter) &&
        (statusFilter === "ALL" || status === statusFilter)
      );
    });
  }, [records, periodicityFilter, searchText, sourceFilter, statusFilter, uomFilter]);

  const sourceOptions = useMemo(
    () =>
      organizations.filter((record) =>
        ["MINISTRY", "DEPARTMENT", "DIVISION", "UNIT", "SOURCE", "OTHER"].includes(String(record.organization_type ?? "").toUpperCase()),
      ),
    [organizations],
  );

  const overview = overviewOf(detail);
  const selectedMeasureCode = selected?.measure_code ?? overview.measure_code ?? "";
  const selectedIndicatorCode = selected?.national_indicator_code ?? selected?.indicator_code ?? overview.national_indicator_code ?? overview.indicator_code;
  const selectedVersionCode = selected?.version_code ?? overview.version_code;
  const sourceValid = sourceOptions.some((record) => record.organization_code === sourceForm.source_organization_code);
  const periodicityValid = periodicities.some((record) => record.periodicity_code === periodicityForm.periodicity_code);
  const indicatorValid = indicators.some((record) => record.national_indicator_code === measureForm.indicator_code);
  const versionValid = indicatorVersions.some((record) => record.version_code === measureForm.version_code);
  const uomValid = !measureForm.unit_code || uoms.some((record) => record.uom_code === measureForm.unit_code);

  function grainLabel(item: DataFieldMapping) {
    const setCode = textValue(item.member_set_code);
    const dimensionCode = textValue(item.dimension_code).toUpperCase();
    const grainType = textValue(item.grain_type).toUpperCase();
    if (setCode !== "-") {
      if (dimensionCode === "GEOGRAPHY" || grainType === "GEOGRAPHY") {
        return textValue(item.member_set_name ?? item.label) !== "-"
          ? textValue(item.member_set_name ?? item.label)
          : titleFromCode(setCode);
      }
      const labels = (grainSetItems[setCode] ?? [])
        .filter((entry) => entry.is_active !== false)
        .map((entry) => textValue(entry.member_name) !== "-" ? textValue(entry.member_name) : titleFromMemberCode(entry.member_code, item.dimension_code))
          .filter((value) => value !== "-");
        if (labels.length) return labels.join(" / ");
      }
    return primaryMappingText("GRAIN", item);
  }

  function grainSummaryForRecord(record: DataFieldListItem) {
    const values = activeMappings(record.grains)
      .map(grainLabel)
      .filter((value) => value && value !== "-");
    if (values.length) return values.join(" + ");
    return recordGrainSummary(record);
  }

  function grainSummaryForDetail(nextDetail: DataFieldDetail) {
    const overview = overviewOf(nextDetail);
    const values = activeMappings(nextDetail.grain_mappings)
      .map(grainLabel)
      .filter((value) => value && value !== "-");
    if (values.length) return values.join(" + ");
    return mappingSummary("GRAIN", nextDetail.grain_mappings, overview.grains ?? overview.grain_labels ?? overview.grain_summary);
  }

  const canSaveMeasure = Boolean(
    !isSaving &&
      measureForm.indicator_code &&
      indicatorValid &&
      measureForm.version_code &&
      versionValid &&
      measureForm.name.trim() &&
      (!measureForm.unit_code || uomValid),
  );
  const canSaveSource = Boolean(selectedMeasureCode && sourceForm.source_organization_code && sourceValid && !isSaving);
  const canSavePeriodicity = Boolean(selectedMeasureCode && periodicityForm.periodicity_code && periodicityValid && !isSaving);

  function openPanel(nextPanel: MappingPanel, item?: DataFieldMapping | null) {
    setPanel(nextPanel);
    setError("");
    if (nextPanel === "measure") {
      const current = overviewOf(detail);
      setMeasureForm({
        ...EMPTY_MEASURE_FORM,
        mode: current?.measure_code ? "edit" : "create",
        indicator_code: textValue(current?.national_indicator_code ?? current?.indicator_code) === "-" ? "" : textValue(current?.national_indicator_code ?? current?.indicator_code),
        version_code: textValue(current?.version_code) === "-" ? "" : textValue(current?.version_code),
        measure_code: textValue(current?.measure_code) === "-" ? "" : textValue(current?.measure_code),
        name: textValue(current?.measure_name ?? current?.name) === "-" ? "" : textValue(current?.measure_name ?? current?.name),
        unit_code: textValue(current?.uom_code ?? current?.unit_code) === "-" ? "" : textValue(current?.uom_code ?? current?.unit_code),
        is_active: current?.is_active !== false,
        description: textValue(current?.description) === "-" ? "" : textValue(current?.description),
      });
    }
    if (nextPanel === "source") {
      setSourceForm({
        ...EMPTY_SOURCE_FORM,
        mapping_code: item ? mappingCode(item) : "",
        source_organization_code: textValue(item?.source_organization_code ?? item?.organization_code) === "-" ? "" : textValue(item?.source_organization_code ?? item?.organization_code),
        assignment_role: textValue(item?.assignment_role) === "-" ? "PRIMARY_SOURCE" : textValue(item?.assignment_role),
        sort_order: textValue(item?.sort_order) === "-" ? "0" : textValue(item?.sort_order),
      });
    }
    if (nextPanel === "periodicity") {
      setPeriodicityForm({
        ...EMPTY_PERIODICITY_FORM,
        mapping_code: item ? mappingCode(item) : "",
        periodicity_code: textValue(item?.periodicity_code) === "-" ? "" : textValue(item?.periodicity_code),
        mapping_role: textValue(item?.mapping_role) === "-" ? "COLLECTION" : textValue(item?.mapping_role),
        is_default: item?.is_default !== false,
        sort_order: textValue(item?.sort_order) === "-" ? "0" : textValue(item?.sort_order),
      });
    }
  }

  async function afterMutation(message: string) {
    await refreshDetailSilently();
    setNotice(message);
    setPanel("");
  }

  async function saveMeasure(event: FormEvent) {
    event.preventDefault();
    if (!canSaveMeasure) return;
    setIsSaving(true);
    setError("");
    try {
      const payload: IndicatorMeasurePayload = {
        measure_code: measureForm.measure_code.trim() || undefined,
        name: measureForm.name.trim(),
        value_type: measureForm.value_type,
        unit_code: measureForm.unit_code || undefined,
        aggregation_type: measureForm.aggregation_type,
        sort_order: Number(measureForm.sort_order || 0),
        is_required: measureForm.is_required,
        is_active: measureForm.is_active,
        description: measureForm.description || undefined,
      };
      if (measureForm.mode === "edit" && selectedMeasureCode) {
        await updateIndicatorMeasure(measureForm.version_code, selectedMeasureCode, payload);
        await afterMutation("Data field updated.");
      } else {
        const created = await createIndicatorMeasure(measureForm.version_code, payload);
        const createdMeasureCode = textValue(created.data?.measure_code ?? payload.measure_code);
        await refreshListSilently(createdMeasureCode === "-" ? undefined : createdMeasureCode);
        if (createdMeasureCode !== "-") {
          setSearchParams({ measure: createdMeasureCode });
        }
        setNotice("Data field created.");
        setPanel("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data field could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveSource(event: FormEvent) {
    event.preventDefault();
    if (!canSaveSource) return;
    setIsSaving(true);
    setError("");
    try {
      const payload: DataFieldSourceMappingPayload = {
        source_organization_code: sourceForm.source_organization_code,
        assignment_role: sourceForm.assignment_role,
        indicator_code: selectedIndicatorCode,
        version_code: selectedVersionCode,
        unit_code: getSelectedUnitCode(),
        mapping_code: sourceForm.mapping_code || undefined,
        valid_from: sourceForm.valid_from || undefined,
        valid_to: sourceForm.valid_to || undefined,
        sort_order: Number(sourceForm.sort_order || 0),
        is_active: true,
      };
      await mapDataFieldSource(selectedMeasureCode, payload);
      await afterMutation("Source mapping saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Source mapping could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function savePeriodicity(event: FormEvent) {
    event.preventDefault();
    if (!canSavePeriodicity) return;
    setIsSaving(true);
    setError("");
    try {
      const payload: DataFieldPeriodicityMappingPayload = {
        periodicity_code: periodicityForm.periodicity_code,
        mapping_role: periodicityForm.mapping_role,
        indicator_code: selectedIndicatorCode,
        version_code: selectedVersionCode,
        unit_code: getSelectedUnitCode(),
        mapping_code: periodicityForm.mapping_code || undefined,
        is_default: periodicityForm.is_default,
        valid_from: periodicityForm.valid_from || undefined,
        valid_to: periodicityForm.valid_to || undefined,
        sort_order: Number(periodicityForm.sort_order || 0),
        is_active: true,
      };
      await mapDataFieldPeriodicity(selectedMeasureCode, payload);
      await afterMutation("Periodicity mapping saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Periodicity mapping could not be saved.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleMapping(type: MappingType, item: DataFieldMapping, active: boolean) {
    const code = mappingCode(item);
    if (!code || code === "-") return;
    setIsSaving(true);
    setError("");
    try {
      if (active) {
        await restoreDataFieldMapping(type, code);
        await afterMutation("Mapping restored.");
      } else {
        await unmapDataFieldMapping(type, code);
        await afterMutation("Mapping unmapped.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mapping status could not be changed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="metadata-page data-field-page">
      {!isDetailRoute && (
        <div className="page-heading-row data-field-heading-row">
          <div>
            <span className="eyebrow">Indicator Measurement</span>
            <h1>Data Field Library</h1>
            <p>Manage schedulable indicator measures with source, cadence, and required collection key mappings.</p>
          </div>
          <div className="page-actions">
            <button className="secondary-button" type="button" onClick={() => void loadAll()}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="primary-button" type="button" onClick={() => openPanel("measure")}>
              <Plus size={14} /> New Data Field
            </button>
          </div>
        </div>
      )}

      {notice && <div className="toast-notice success">{notice}</div>}
      {error && <div className="toast-notice error">{error}</div>}

      {isDetailRoute ? (
        <DataFieldDetailPage
          detail={detail}
          selected={selected}
          isLoading={isDetailLoading}
          tab={tab}
          setTab={(nextTab) => {
            setTab(nextTab);
            if (nextTab === "templateGrain" || nextTab === "indicator") void loadTemplateGrainUsage(detail ?? selected, true);
          }}
          openPanel={openPanel}
          toggleMapping={toggleMapping}
          isSaving={isSaving}
          onBack={backToLibrary}
          renderGrain={grainLabel}
          templateGrainUsage={templateGrainUsage[codeOf(detail ?? selected)] ?? []}
          isTemplateGrainLoading={isGrainUsageLoading}
        />
      ) : (
        <>
      <div className="data-field-kpi-grid">
        <SummaryCard value={records.length} label="Data fields" badge={getSelectedUnitCode()} />
        <SummaryCard value={records.filter((record) => record.source_organization_code).length} label="Source mapped" badge="Sources" />
        <SummaryCard value={records.filter((record) => record.periodicity_code).length} label="Periodicity mapped" badge="Cadence" />
        <SummaryCard value={records.filter((record) => Number(record.used_in_count ?? record.usage_count ?? 0) > 0).length} label="Used in templates" badge="Template Grain" />
      </div>

      <div className="data-field-toolbar-panel">
        <label className="search-box">
          <Search size={15} />
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search data field, code, indicator, source, or collection key" />
        </label>
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} aria-label="Source filter">
          <option value="ALL">All sources</option>
          {sourceOptions.map((record) => (
            <option key={String(record.organization_code)} value={String(record.organization_code)}>
              {textValue(record.name ?? record.display_name ?? record.organization_code)}
            </option>
          ))}
        </select>
        <select value={periodicityFilter} onChange={(event) => setPeriodicityFilter(event.target.value)} aria-label="Periodicity filter">
          <option value="ALL">All periodicities</option>
          {periodicities.map((record) => (
            <option key={String(record.periodicity_code)} value={String(record.periodicity_code)}>
              {textValue(record.name ?? record.periodicity_code)}
            </option>
          ))}
        </select>
        <select value={uomFilter} onChange={(event) => setUomFilter(event.target.value)} aria-label="UOM filter">
          <option value="ALL">All UOM</option>
          {uoms.map((record) => (
            <option key={String(record.uom_code)} value={String(record.uom_code)}>
              {textValue(record.name ?? record.uom_code)}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status filter">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="data-field-layout list-only">
        <div className="table-card data-field-table-card">
          {isLoading ? (
            <div className="inline-loader"><span className="loader-ring" /> Loading data fields...</div>
          ) : (
            <div className="data-table-wrap data-field-table-wrap">
              <table className="data-table data-field-table">
                <thead>
                  <tr>
                    <th>Data Field / Measure</th>
                    <th>Measure Code</th>
                    <th>Source</th>
                    <th>UOM</th>
                    <th>Periodicity</th>
                    <th>Template Grain</th>
                    <th>Used / Status</th>
                    <th>Last Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const sourceSummary = recordSourceSummary(record);
                    const periodicitySummary = recordPeriodicitySummary(record);
                    const templateUseCount = Number(record.used_in_templates ?? record.used_in_count ?? record.usage_count ?? 0);
                    const indicatorUseCount = Number(record.mapped_indicator_count ?? record.published_indicator_count ?? record.indicator_usage_count ?? 0);
                    return (
                      <tr
                        key={`${record.measure_code}-${record.version_code ?? record.national_indicator_code ?? ""}`}
                        className={record.measure_code === selected?.measure_code ? "selected clickable-row" : "clickable-row"}
                        onClick={() => void openDetail(record)}
                      >
                  <td className="indicator-sentence-cell measure-name-cell"><strong title={nameOf(record)}>{nameOf(record)}</strong><span title={codeOf(record)}>{codeOf(record)}</span></td>
                  <td><strong title={codeOf(record)}>{codeOf(record)}</strong><span className="muted-code" title={textValue(record.indicator_name)}>{textValue(record.indicator_number ?? record.national_indicator_code)}</span></td>
                        <td title={sourceSummary}>{sourceSummary}<span className="muted-code">{textValue(record.department_organization_name)}</span></td>
                        <td title={textValue(record.uom_name ?? record.unit_name)}>{textValue(record.uom_name ?? record.unit_name ?? record.uom_code ?? record.unit_code)}</td>
                        <td title={periodicitySummary}>{periodicitySummary}</td>
                        <td>
                          <button className="secondary-button compact" type="button" onClick={(event) => { event.stopPropagation(); void openGrainUsage(record); }}>
                            View Grain
                          </button>
                        </td>
                        <td className="used-status-cell">
                          <span className="status-pill active">{templateUseCount} templates</span>
                          <span className="status-pill info">{indicatorUseCount} indicators</span>
                          <span className="muted-code">{textValue(record.status ?? (record.is_active === false ? "Inactive" : "Active"))}</span>
                        </td>
                        <td>{textValue(record.last_approved_period ?? record.reference_period ?? compactDate(record.last_approved ?? record.updated_at ?? record.last_updated))}</td>
                      </tr>
                    );
                  })}
                  {!filteredRecords.length && (
                    <tr><td colSpan={8}>No data fields match the selected filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {grainUsageRecord && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setGrainUsageRecord(null)}>
          <aside className="side-drawer compact-form-drawer data-field-drawer" role="dialog" aria-modal="true">
            <div className="drawer-header">
              <div>
                <span className="eyebrow">Template Grain Usage</span>
                <h3>{nameOf(grainUsageRecord)}</h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setGrainUsageRecord(null)} aria-label="Close grain usage"><X size={16} /></button>
            </div>
            <TemplateGrainUsageList
              isLoading={isGrainUsageLoading}
              usage={templateGrainUsage[codeOf(grainUsageRecord)] ?? []}
              emptyText="No template-specific grain usage yet. It will appear after this data field is used in Template Studio and saved."
            />
          </aside>
        </div>
      )}

      {panel && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPanel("")}>
          <aside className="side-drawer compact-form-drawer data-field-drawer" role="dialog" aria-modal="true">
            <div className="drawer-header">
              <div>
                <span className="eyebrow">Data field mapping</span>
                <h3>
                  {panel === "measure"
                    ? measureForm.mode === "edit" ? "Edit Data Field" : "Create Data Field"
                    : panel === "source" ? "Source Mapping"
                      : panel === "periodicity" ? "Periodicity Mapping"
                        : "Legacy Grain Mapping"}
                </h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setPanel("")} aria-label="Close drawer"><X size={16} /></button>
            </div>
            {panel === "measure" && (
              <form className="drawer-form data-field-measure-form" onSubmit={saveMeasure}>
                <div className="data-field-form-intro"><strong>Field configuration</strong><span>Connect this data field to an indicator version and define how its values are collected.</span></div>
                <label>Indicator *
                  <input
                    list="data-field-indicator-options"
                    value={measureForm.indicator_code}
                    onChange={(event) => setMeasureForm((current) => ({ ...current, indicator_code: event.target.value, version_code: "" }))}
                    placeholder="Search and select indicator"
                    disabled={measureForm.mode === "edit"}
                  />
                  {measureForm.indicator_code && !indicatorValid && <em>Select an exact indicator from the list.</em>}
                </label>
                <datalist id="data-field-indicator-options">
                  {indicators.map((record) => (
                    <option
                      key={record.national_indicator_code}
                      value={record.national_indicator_code}
                      label={`${textValue(record.indicator_number)} - ${textValue(record.name)} (${record.national_indicator_code})`}
                    />
                  ))}
                </datalist>
                <label>Version *
                  <select
                    value={measureForm.version_code}
                    onChange={(event) => setMeasureForm((current) => ({ ...current, version_code: event.target.value }))}
                    disabled={measureForm.mode === "edit"}
                  >
                    <option value="">Select version</option>
                    {indicatorVersions.map((version) => (
                      <option key={String(version.version_code)} value={String(version.version_code)}>
                        {textValue(version.version_label ?? version.version_code)} {version.is_current ? "(Current)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label>Measure code
                  <input
                    value={measureForm.measure_code}
                    onChange={(event) => setMeasureForm((current) => ({ ...current, measure_code: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") }))}
                    placeholder="Auto if blank, editable public code"
                    disabled={measureForm.mode === "edit"}
                  />
                </label>
                <label>Measure name *
                  <input value={measureForm.name} onChange={(event) => setMeasureForm((current) => ({ ...current, name: event.target.value }))} placeholder="Example: Total Population" />
                </label>
                <div className="form-grid two">
                  <label>Value type
                    <select value={measureForm.value_type} onChange={(event) => setMeasureForm((current) => ({ ...current, value_type: event.target.value }))}>
                      <option value="NUMBER">Number</option>
                      <option value="INTEGER">Integer</option>
                      <option value="PERCENT">Percent</option>
                      <option value="TEXT">Text</option>
                      <option value="BOOLEAN">Boolean</option>
                    </select>
                  </label>
                  <label>UOM
                    <input
                      list="data-field-uom-options"
                      value={measureForm.unit_code}
                      onChange={(event) => setMeasureForm((current) => ({ ...current, unit_code: event.target.value }))}
                      placeholder="Search UOM"
                    />
                    {measureForm.unit_code && !uomValid && <em>Select an exact UOM from the list.</em>}
                  </label>
                </div>
                <datalist id="data-field-uom-options">
                  {uoms.map((record) => <option key={String(record.uom_code)} value={String(record.uom_code)} label={optionLabel(record, "uom_code", ["name", "uom_name"])} />)}
                </datalist>
                <div className="form-grid two">
                  <label>Aggregation
                    <select value={measureForm.aggregation_type} onChange={(event) => setMeasureForm((current) => ({ ...current, aggregation_type: event.target.value }))}>
                      <option value="SUM">Sum</option>
                      <option value="AVG">Average</option>
                      <option value="MIN">Minimum</option>
                      <option value="MAX">Maximum</option>
                      <option value="LATEST">Latest</option>
                      <option value="NONE">None</option>
                    </select>
                  </label>
                  <label>Sort order<input type="number" value={measureForm.sort_order} onChange={(event) => setMeasureForm((current) => ({ ...current, sort_order: event.target.value }))} /></label>
                </div>
                <label>Description
                  <textarea value={measureForm.description} onChange={(event) => setMeasureForm((current) => ({ ...current, description: event.target.value }))} placeholder="Definition or usage note for this data field" />
                </label>
                <label className="checkbox-card"><input type="checkbox" checked={measureForm.is_required} onChange={(event) => setMeasureForm((current) => ({ ...current, is_required: event.target.checked }))} /> Required during collection</label>
                <label className="checkbox-card"><input type="checkbox" checked={measureForm.is_active} onChange={(event) => setMeasureForm((current) => ({ ...current, is_active: event.target.checked }))} /> Active</label>
                <div className="drawer-footer">
                  <button className="secondary-button" type="button" onClick={() => setPanel("")}>Cancel</button>
                  <button className="primary-button" type="submit" disabled={!canSaveMeasure}>{isSaving ? "Saving..." : measureForm.mode === "edit" ? "Save Data Field" : "Create Data Field"}</button>
                </div>
              </form>
            )}
            {panel === "source" && (
              <form className="drawer-form" onSubmit={saveSource}>
                <label>Source organization *
                  <input list="data-field-source-options" value={sourceForm.source_organization_code} onChange={(event) => setSourceForm((current) => ({ ...current, source_organization_code: event.target.value }))} placeholder="Search and select source" />
                  {sourceForm.source_organization_code && !sourceValid && <em>Select an exact source from the list.</em>}
                </label>
                <datalist id="data-field-source-options">
                  {sourceOptions.map((record) => <option key={String(record.organization_code)} value={String(record.organization_code)} label={optionLabel(record, "organization_code", ["name", "display_name"])} />)}
                </datalist>
                <label>Assignment role
                  <select value={sourceForm.assignment_role} onChange={(event) => setSourceForm((current) => ({ ...current, assignment_role: event.target.value }))}>
                    {SOURCE_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
                <div className="form-grid two">
                  <label>Valid from<input type="date" value={sourceForm.valid_from} onChange={(event) => setSourceForm((current) => ({ ...current, valid_from: event.target.value }))} /></label>
                  <label>Valid to<input type="date" value={sourceForm.valid_to} onChange={(event) => setSourceForm((current) => ({ ...current, valid_to: event.target.value }))} /></label>
                </div>
                <label>Sort order<input type="number" value={sourceForm.sort_order} onChange={(event) => setSourceForm((current) => ({ ...current, sort_order: event.target.value }))} /></label>
                <div className="drawer-footer"><button className="secondary-button" type="button" onClick={() => setPanel("")}>Cancel</button><button className="primary-button" type="submit" disabled={!canSaveSource}>{isSaving ? "Saving..." : "Save Source"}</button></div>
              </form>
            )}
            {panel === "periodicity" && (
              <form className="drawer-form" onSubmit={savePeriodicity}>
                <label>Periodicity *
                  <input list="data-field-periodicity-options" value={periodicityForm.periodicity_code} onChange={(event) => setPeriodicityForm((current) => ({ ...current, periodicity_code: event.target.value }))} placeholder="Search and select periodicity" />
                  {periodicityForm.periodicity_code && !periodicityValid && <em>Select an exact periodicity from the list.</em>}
                </label>
                <datalist id="data-field-periodicity-options">
                  {periodicities.map((record) => <option key={String(record.periodicity_code)} value={String(record.periodicity_code)} label={optionLabel(record, "periodicity_code", ["name"])} />)}
                </datalist>
                <label>Mapping role
                  <select value={periodicityForm.mapping_role} onChange={(event) => setPeriodicityForm((current) => ({ ...current, mapping_role: event.target.value }))}>
                    {PERIODICITY_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
                <label className="checkbox-card"><input type="checkbox" checked={periodicityForm.is_default} onChange={(event) => setPeriodicityForm((current) => ({ ...current, is_default: event.target.checked }))} /> Default mapping for collection scheduling</label>
                <div className="form-grid two">
                  <label>Valid from<input type="date" value={periodicityForm.valid_from} onChange={(event) => setPeriodicityForm((current) => ({ ...current, valid_from: event.target.value }))} /></label>
                  <label>Valid to<input type="date" value={periodicityForm.valid_to} onChange={(event) => setPeriodicityForm((current) => ({ ...current, valid_to: event.target.value }))} /></label>
                </div>
                <label>Sort order<input type="number" value={periodicityForm.sort_order} onChange={(event) => setPeriodicityForm((current) => ({ ...current, sort_order: event.target.value }))} /></label>
                <div className="drawer-footer"><button className="secondary-button" type="button" onClick={() => setPanel("")}>Cancel</button><button className="primary-button" type="submit" disabled={!canSavePeriodicity}>{isSaving ? "Saving..." : "Save Periodicity"}</button></div>
              </form>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ value, label, badge }: { value: number | string; label: string; badge: string }) {
  return (
    <article className="data-field-kpi-card">
      <div><strong>{value}</strong><span>{label}</span></div>
      <small>{badge}</small>
    </article>
  );
}

function DataFieldDetailPage({
  detail,
  selected,
  isLoading,
  tab,
  setTab,
  openPanel,
  toggleMapping,
  isSaving,
  onBack,
  renderGrain,
  templateGrainUsage,
  isTemplateGrainLoading,
}: {
  detail: DataFieldDetail | null;
  selected: DataFieldListItem | null;
  isLoading: boolean;
  tab: DetailTab;
  setTab: (tab: DetailTab) => void;
  openPanel: (panel: MappingPanel, item?: DataFieldMapping | null) => void;
  toggleMapping: (type: MappingType, item: DataFieldMapping, active: boolean) => Promise<void>;
  isSaving: boolean;
  onBack: () => void;
  renderGrain: (item: DataFieldMapping) => string;
  templateGrainUsage: TemplateGrainUsage[];
  isTemplateGrainLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="data-field-detail-workspace">
        <div className="indicator-detail-loading-card"><span className="loader-ring" /> Loading data field profile...</div>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="data-field-detail-workspace empty">
        <Database size={32} />
        <strong>{selected ? "Data field profile could not be loaded" : "Select a data field"}</strong>
        <span>Return to the library and open another data field.</span>
        <button className="secondary-button" type="button" onClick={onBack}>Back to Data Fields</button>
      </section>
    );
  }

  const overview = overviewOf(detail);
  const sourceSummary = mappingSummary("SOURCE", detail.source_mappings, overview.source_organizations ?? overview.source_organization_name ?? overview.ministry_name);
  const periodicitySummary = mappingSummary("PERIODICITY", detail.periodicity_mappings, overview.periodicities ?? overview.periodicity_name ?? overview.periodicity_code);
  return (
    <section className="data-field-detail-workspace">
      <div className="data-field-detail-hero">
        <div className="data-field-detail-title">
          <span className="data-field-code-tile">{textValue(overview.measure_code).slice(0, 12)}</span>
          <div>
            <span className="eyebrow">Data Field Profile</span>
            <h2>{nameOf(overview)}</h2>
            <p>{codeOf(overview)} | Indicator {textValue(overview.indicator_number ?? overview.national_indicator_code)} | Version {textValue(overview.version_code)}</p>
          </div>
        </div>
        <div className="page-actions">
          <span className={overview.is_active === false ? "status-pill inactive" : "status-pill active"}>{textValue(overview.status ?? (overview.is_active === false ? "Inactive" : "Active"))}</span>
          <button className="secondary-button" type="button" onClick={onBack}>Back to Data Fields</button>
          <button className="primary-button" type="button" onClick={() => openPanel("measure")}><Edit3 size={13} /> Edit Data Field</button>
        </div>
      </div>

      <div className="data-field-detail-metrics">
        <SummaryCard value={sourceSummary} label="Source" badge="Mapping" />
        <SummaryCard value={textValue(overview.uom_name ?? overview.unit_name ?? overview.uom_code ?? overview.unit_code)} label="Unit of Measure" badge="UOM" />
        <SummaryCard value={periodicitySummary} label="Periodicity" badge="Cadence" />
        <SummaryCard value={isTemplateGrainLoading ? "..." : templateGrainUsage.length} label="Template grain usage" badge="Template" />
      </div>

      <div className="indicator-detail-tabs data-field-detail-tabs">
        <button className={tab === "overview" ? "active" : ""} type="button" onClick={() => setTab("overview")}>Details</button>
        <button className={tab === "indicator" ? "active" : ""} type="button" onClick={() => setTab("indicator")}>Indicator <span>{templateGrainUsage.length}</span></button>
        <button className={tab === "source" ? "active" : ""} type="button" onClick={() => setTab("source")}>Sources <span>{detail.source_mappings?.length ?? 0}</span></button>
        <button className={tab === "periodicity" ? "active" : ""} type="button" onClick={() => setTab("periodicity")}>Periodicities <span>{detail.periodicity_mappings?.length ?? 0}</span></button>
        <button className={tab === "templateGrain" ? "active" : ""} type="button" onClick={() => setTab("templateGrain")}>Template Grain <span>{templateGrainUsage.length}</span></button>
      </div>

      <div className="data-field-detail-content">
        {tab === "overview" && <OverviewTab detail={detail} renderGrain={renderGrain} />}
        {tab === "indicator" && <IndicatorReferenceTab usage={templateGrainUsage} isLoading={isTemplateGrainLoading} />}
        {tab === "source" && <MappingTab title="Source Mapping" icon={<Link2 size={15} />} rows={detail.source_mappings ?? []} type="SOURCE" onAdd={() => openPanel("source")} onEdit={(item) => openPanel("source", item)} onToggle={toggleMapping} isSaving={isSaving} />}
        {tab === "periodicity" && <MappingTab title="Periodicity Mapping" icon={<RefreshCw size={15} />} rows={detail.periodicity_mappings ?? []} type="PERIODICITY" onAdd={() => openPanel("periodicity")} onEdit={(item) => openPanel("periodicity", item)} onToggle={toggleMapping} isSaving={isSaving} />}
        {tab === "templateGrain" && <TemplateGrainUsageList isLoading={isTemplateGrainLoading} usage={templateGrainUsage} emptyText="No template-specific grain usage yet. Use this data field in Template Studio and save the draft to see grain by template, indicator, and source." />}
      </div>
    </section>
  );
}

function OverviewTab({
  detail,
}: {
  detail: DataFieldDetail;
  renderGrain?: (item: DataFieldMapping) => string;
}) {
  const overview = overviewOf(detail);
  const sourceRows = activeMappings(detail.source_mappings);
  const periodicityRows = activeMappings(detail.periodicity_mappings);
  return (
    <div className="data-field-detail-grid">
      <DetailCard title="Field Overview" rows={[
        ["Measure / Data field", nameOf(overview)],
        ["Code", codeOf(overview)],
        ["Description", overview.description],
        ["Version", overview.version_code],
        ["Status", overview.status ?? (overview.is_active === false ? "Inactive" : "Active")],
      ]} />
      <section className="data-field-detail-card collection-context-card">
        <h3>Collection Context</h3>
        <div className="collection-context-body">
          <ContextTagGroup
            label="Sources"
            rows={sourceRows}
            fallback={overview.source_organizations ?? overview.source_organization_name ?? overview.ministry_name ?? overview.source_organization_code}
            render={(item) => primaryMappingText("SOURCE", item)}
          />
          <ContextTagGroup
            label="Periodicities"
            rows={periodicityRows}
            fallback={overview.periodicities ?? overview.periodicity_name ?? overview.periodicity_code}
            render={(item) => primaryMappingText("PERIODICITY", item)}
          />
          <div className="detail-field"><span>UOM</span><strong>{textValue(overview.uom_name ?? overview.unit_name ?? overview.uom_code ?? overview.unit_code)}</strong></div>
          <div className="detail-field"><span>Last approved</span><strong>{textValue(overview.last_approved_period ?? overview.reference_period ?? compactDate(overview.last_approved ?? overview.updated_at ?? overview.last_updated))}</strong></div>
        </div>
      </section>
    </div>
  );
}

function IndicatorReferenceTab({ usage, isLoading }: { usage: TemplateGrainUsage[]; isLoading: boolean }) {
  if (isLoading) {
    return <div className="inline-loader template-grain-loader"><span className="loader-ring" /> Loading published template indicator usage...</div>;
  }
  const indicatorUsage = usage.filter((item) => item.indicator && item.indicator !== "-");
  const grouped = indicatorUsage.reduce<Record<string, TemplateGrainUsage[]>>((acc, item) => {
    const key = item.indicator || "Indicator pending";
    acc[key] = [...(acc[key] ?? []), item];
    return acc;
  }, {});
  return (
    <div className="data-field-detail-grid single">
      <section className="data-field-detail-card">
        <h3>Published Template Indicator Usage</h3>
        {Object.keys(grouped).length ? (
          <div className="template-grain-usage-list compact">
            {Object.entries(grouped).map(([indicator, rows]) => (
              <article className="template-grain-card" key={indicator}>
                <div className="template-grain-card-header">
                  <div>
                    <span>Indicator</span>
                    <strong>{indicator}</strong>
                  </div>
                  <small>{rows.length} template use(s)</small>
                </div>
                <div className="template-grain-field-grid">
                  {rows.map((row) => (
                    <div key={`${row.templateCode}-${row.versionCode}`}>
                      <span>{row.templateName}</span>
                      <strong>{row.grainText}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="detail-empty">
            No published template-derived indicator usage is available yet. Publish and map the template to an indicator first.
          </div>
        )}
      </section>
    </div>
  );
}

function ContextTagGroup({
  label,
  rows,
  fallback,
  render,
}: {
  label: string;
  rows: DataFieldMapping[];
  fallback: unknown;
  render: (item: DataFieldMapping) => string;
}) {
  const fallbackTags = Array.isArray(fallback) ? fallback.map((item) => (typeof item === "object" ? render(item as DataFieldMapping) : textValue(item))) : [textValue(fallback)];
  const tags = rows.length ? rows.map(render).filter((value) => value && value !== "-") : fallbackTags.filter((value) => value !== "-");
  return (
    <div className="context-tag-group">
      <span>{label}</span>
      <div>
        {tags.length ? tags.map((tag, index) => <strong className="context-tag" key={`${label}-${tag}-${index}`} title={tag}>{tag}</strong>) : <em>Not mapped</em>}
      </div>
    </div>
  );
}

function TemplateGrainUsageList({
  usage,
  isLoading,
  emptyText,
}: {
  usage: TemplateGrainUsage[];
  isLoading: boolean;
  emptyText: string;
}) {
  if (isLoading) {
    return <div className="inline-loader template-grain-loader"><span className="loader-ring" /> Loading template grain usage...</div>;
  }

  if (!usage.length) {
    return (
      <section className="mapping-section template-grain-usage-section">
        <div className="detail-empty">{emptyText}</div>
      </section>
    );
  }

  return (
    <section className="mapping-section template-grain-usage-section">
      <div className="mapping-section-header">
        <div><GitBranch size={15} /><strong>Template Grain Usage</strong></div>
      </div>
      <div className="template-grain-usage-list">
        {usage.map((item) => (
          <article className="template-grain-card" key={`${item.templateCode}-${item.versionCode}-${item.grainText}`}>
            <div className="template-grain-card-header">
              <div>
                <span>{item.templateName}</span>
                <strong>{item.versionName}</strong>
              </div>
              <small>{item.templateCode}</small>
            </div>
            <div className="template-grain-field-grid">
              <div><span>Indicator</span><strong>{item.indicator || "Template indicator not mapped"}</strong></div>
              <div><span>Source</span><strong>{item.sources.join(" / ")}</strong></div>
              <div><span>Column grain</span><strong>{item.columns}</strong></div>
              <div><span>Row grain</span><strong>{item.rows}</strong></div>
              <div><span>Tab grain</span><strong>{item.tabs}</strong></div>
            </div>
            <div className="template-grain-summary">
              <span>Template collection key</span>
              <strong>{item.grainText}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DetailCard({ title, rows }: { title: string; rows: [string, unknown][] }) {
  return (
    <section className="data-field-detail-card">
      <h3>{title}</h3>
      <div className="detail-field-grid">
        {rows.map(([label, value]) => (
          <div className="detail-field" key={label}><span>{label}</span><strong title={textValue(value)}>{textValue(value)}</strong></div>
        ))}
      </div>
    </section>
  );
}

function MappingTab({
  title,
  icon,
  rows,
  type,
  onAdd,
  onEdit,
  onToggle,
  isSaving,
  renderPrimary,
}: {
  title: string;
  icon: ReactNode;
  rows: DataFieldMapping[];
  type: MappingType;
  onAdd: () => void;
  onEdit: (item: DataFieldMapping) => void;
  onToggle: (type: MappingType, item: DataFieldMapping, active: boolean) => Promise<void>;
  isSaving: boolean;
  renderPrimary?: (item: DataFieldMapping) => string;
}) {
  return (
    <section className={`mapping-section data-field-mapping-${type.toLowerCase()}`}>
      <div className="mapping-section-header">
        <div>{icon}<strong>{title}</strong></div>
        <button className="secondary-button compact" type="button" onClick={onAdd}><Plus size={13} /> Map</button>
      </div>
      {type === "GRAIN" && (
        <div className="collection-key-help">
          Required grain defines the submission coordinates. Example: State + Time Period + Locality + Sex {"->"} Measure Value.
        </div>
      )}
      {rows.length ? (
        <div className="mapping-record-list">
          {rows.map((item, index) => (
            <article className="mapping-record" key={`${mappingCode(item)}-${index}`}>
              <div>
                <strong title={renderPrimary ? renderPrimary(item) : primaryMappingText(type, item)}>{renderPrimary ? renderPrimary(item) : primaryMappingText(type, item)}</strong>
                <span>{secondaryMappingText(type, item)}</span>
              </div>
              <div className="mapping-record-actions">
                <span className={item.is_active === false ? "status-pill inactive" : "status-pill active"}>{item.is_active === false ? "Inactive" : "Active"}</span>
                <button className="secondary-button compact icon-only-text" type="button" disabled={isSaving || mappingCode(item) === "-"} onClick={() => onEdit(item)}>
                  <Edit3 size={12} /> Edit
                </button>
                {item.is_active === false ? (
                  <button className="secondary-button compact" type="button" disabled={isSaving} onClick={() => void onToggle(type, item, true)}>Restore</button>
                ) : (
                  <button className="danger-icon-button" type="button" disabled={isSaving || mappingCode(item) === "-"} onClick={() => void onToggle(type, item, false)}>Unmap</button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="detail-empty">No {title.toLowerCase()} records are mapped yet.</div>
      )}
    </section>
  );
}

function SimpleRows({ title, rows }: { title: string; rows: DataFieldMapping[] }) {
  return (
    <section className="mapping-section">
      <div className="mapping-section-header"><div><Database size={15} /><strong>{title}</strong></div></div>
      {rows.length ? rows.map((item, index) => (
        <article className="mapping-record" key={`${title}-${index}`}>
          <div><strong>{textValue(item.name ?? item.title ?? item.code ?? item.mapping_code ?? item.action)}</strong><span>{Object.entries(item).slice(0, 4).map(([key, value]) => `${key}: ${textValue(value)}`).join(" | ")}</span></div>
        </article>
      )) : <div className="detail-empty">No {title.toLowerCase()} returned by API.</div>}
    </section>
  );
}

function primaryMappingText(type: MappingType, item: DataFieldMapping) {
  if (type === "SOURCE") return textValue(item.source_organization_name ?? item.organization_name ?? item.label ?? item.source_organization_code ?? item.organization_code);
  if (type === "PERIODICITY") return textValue(item.periodicity_name ?? item.periodicity_code);
  return textValue(item.member_set_name ?? item.geography_name ?? item.time_period_name ?? item.member_name ?? item.label ?? item.member_set_code ?? item.geography_code ?? item.time_period_code ?? item.member_code);
}

function secondaryMappingText(type: MappingType, item: DataFieldMapping) {
  if (type === "SOURCE") return [item.assignment_role, item.periodicity_code, item.mapping_code].map(textValue).filter((value) => value !== "-").join(" | ") || "-";
  if (type === "PERIODICITY") return [item.mapping_role, item.periodicity_code, item.is_default ? "Default" : ""].map(textValue).filter((value) => value !== "-").join(" | ") || "-";
  return [item.grain_type, item.grain_role, item.dimension_name ?? item.dimension_code, item.is_required === false ? "Optional" : "Required"].map(textValue).filter((value) => value !== "-").join(" | ") || "-";
}
