import { apiDelete, apiGet, apiPatch, apiPost } from "./http-client";
import { getSelectedLocale, getSelectedUnitCode } from "./session.api";

type ListResponse<T> = {
  data: T[];
  locale?: string;
  count?: number;
};

type DetailResponse<T> = {
  data: T;
  locale?: string;
};

type EnvelopeResponse<T> = {
  isSuccess?: boolean;
  message?: string;
  data: T;
  locale?: string;
  count?: number;
  error?: string;
};

export type DimensionStatCard = {
  card_code?: string;
  label?: string;
  value?: number | string;
  display_value?: string;
  metadata?: Record<string, unknown>;
};

export type DimensionManagementRow = {
  dimension_code?: string;
  dimension_name?: string;
  name?: string;
  description?: string;
  dimension_type?: string;
  dimension_structure_type?: string;
  dimension_structure_type_name?: string;
  type?: string;
  value_type?: string;
  is_hierarchical?: boolean;
  sort_order?: number;
  structure?: string[] | string;
  value_count?: number;
  used_in_count?: number;
  status?: string;
  is_active?: boolean;
  created_by?: string | null;
  created_at?: string | null;
  last_updated?: string | null;
  updated_at?: string | null;
  dimension_structure_config?: Record<string, unknown> | null;
};

export type DimensionStructureType = {
  structure_type_code?: string;
  name?: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type DimensionDetail = DimensionManagementRow & {
  description?: string;
  value_type?: string;
  is_hierarchical?: boolean;
  sort_order?: number;
};

export type DimensionMember = {
  dimension_code?: string;
  member_code?: string;
  external_code?: string | null;
  name?: string;
  short_name?: string | null;
  description?: string | null;
  sort_order?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
};

export type DimensionMemberSet = {
  dimension_code?: string;
  set_code?: string;
  set_type?: string;
  name?: string;
  description?: string | null;
  member_count?: number;
  usage_count?: number;
  template_axis_count?: number;
  request_scope_count?: number;
  is_immutable?: boolean;
  lock_reason?: string | null;
  is_active?: boolean;
};

export type DimensionMemberSetItem = {
  set_code?: string;
  dimension_code?: string;
  member_code?: string;
  member_name?: string;
  name?: string;
  display_name?: string;
  localized_name?: string;
  alias_value?: string;
  short_name?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type DimensionRelationship = {
  parent_member_code?: string;
  parent_member_name?: string;
  child_member_code?: string;
  child_member_name?: string;
  relationship_type?: string;
  sort_order?: number;
  is_active?: boolean;
};

export type DimensionAlias = {
  member_code?: string;
  member_name?: string;
  alias_type?: string;
  alias_value?: string;
  source_system_code?: string | null;
  alias_locale_code?: string | null;
  is_active?: boolean;
};

export type DimensionRollupRule = {
  parent_member_code?: string;
  parent_member_name?: string;
  rule_code?: string;
  entry_mode?: string;
  aggregation_method?: string;
  measure_code?: string | null;
  weight_measure_code?: string | null;
  validation_rule_code?: string | null;
  children?: Record<string, unknown>[];
  is_active?: boolean;
};

export type TimeFrequency = {
  frequency_code?: string;
  name?: string;
  description?: string | null;
  months_interval?: number | null;
  sort_order?: number;
  is_active?: boolean;
};

export type TimePeriod = {
  time_period_code?: string;
  member_code?: string;
  frequency_code?: string;
  frequency_name?: string;
  period_year?: number;
  period_quarter?: number | null;
  period_month?: number | null;
  start_date?: string;
  end_date?: string;
  status?: string;
  is_active?: boolean;
  name?: string;
  short_name?: string | null;
  description?: string | null;
};

export type GeographyLevel = {
  level_code?: string;
  level_number?: number;
  name?: string;
  description?: string | null;
  is_active?: boolean;
};

export type Geography = {
  geography_code?: string;
  member_code?: string;
  level_code?: string;
  level_name?: string;
  parent_geography_code?: string | null;
  parent_geography_name?: string | null;
  iso_alpha2_code?: string | null;
  iso_alpha3_code?: string | null;
  census_code?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  is_active?: boolean;
  name?: string;
  short_name?: string | null;
  description?: string | null;
};

export type DimensionPayload = {
  dimension_code?: string;
  dimension_type: string;
  dimension_structure_type?: string;
  value_type: string;
  is_hierarchical: boolean;
  sort_order: number;
  is_active: boolean;
  name: string;
  description?: string;
};

export type DimensionMemberPayload = {
  member_code?: string;
  external_code?: string;
  sort_order: number;
  valid_from?: string;
  valid_to?: string;
  is_active: boolean;
  name: string;
  short_name?: string;
  description?: string;
};

export type DimensionRelationshipPayload = {
  parent_member_code: string;
  child_member_code: string;
  relationship_type: string;
  sort_order: number;
  is_active: boolean;
};

export type DimensionSetPayload = {
  set_code?: string;
  set_type: string;
  is_active: boolean;
  name: string;
  description?: string;
};

export type DimensionSetItemPayload = {
  dimension_code: string;
  member_code: string;
  sort_order: number;
  is_active: boolean;
};

export type DimensionAliasPayload = {
  member_code: string;
  alias_type: string;
  alias_value: string;
  source_system_code?: string;
  alias_locale_code?: string;
  is_active: boolean;
};

export type DimensionRollupPayload = {
  parent_member_code: string;
  rule_code?: string;
  entry_mode: string;
  aggregation_method: string;
  measure_code?: string;
  weight_measure_code?: string;
  validation_rule_code?: string;
  is_active: boolean;
  children: { member_code: string; child_order: number; child_weight?: number; is_active: boolean }[];
};

export type TimePeriodPayload = {
  time_period_code?: string;
  frequency_code: string;
  period_year: number;
  period_quarter?: number;
  period_month?: number;
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
  name: string;
  short_name?: string;
  description?: string;
};

export type TimeFrequencyPayload = {
  frequency_code?: string;
  months_interval?: number;
  sort_order: number;
  is_active: boolean;
  name: string;
  description?: string;
};

export type TimePeriodSetPayload = {
  set_code?: string;
  set_type: string;
  is_active: boolean;
  name: string;
  description?: string;
  items: { time_period_code: string; sort_order: number; is_active: boolean }[];
};

export type GeographyPayload = {
  geography_code?: string;
  level_code: string;
  parent_geography_code?: string;
  iso_alpha2_code?: string;
  iso_alpha3_code?: string;
  census_code?: string;
  effective_from?: string;
  effective_to?: string;
  is_active: boolean;
  name: string;
  short_name?: string;
  description?: string;
};

function query(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

function localeParams(extra: Record<string, string | number | undefined | null> = {}) {
  return query({ locale: extra.locale ?? getSelectedLocale(), ...extra });
}

export async function listDimensionStatCards() {
  const result = await apiGet<EnvelopeResponse<DimensionStatCard[]>>(
    `/dimensions/stat-cards${localeParams({ unit_code: getSelectedUnitCode(), high_cardinality_threshold: 50 })}`,
  );
  return result.data;
}

export async function listDimensionManagementRows(filters: {
  searchText?: string;
  structureType?: string;
  usageFilter?: string;
  limit?: number;
  offset?: number;
}) {
  const result = await apiGet<EnvelopeResponse<{ rows?: DimensionManagementRow[]; total_count?: number }>>(
    `/dimensions/management-rows${localeParams({
      unit_code: getSelectedUnitCode(),
      search_text: filters.searchText,
      dimension_structure_type: filters.structureType === "ALL" ? undefined : filters.structureType,
      usage_filter: filters.usageFilter === "ALL" ? undefined : filters.usageFilter,
      limit: filters.limit ?? 100,
      offset: filters.offset ?? 0,
    })}`,
  );
  return result.data;
}

export async function listDimensionStructureTypes() {
  const result = await apiGet<ListResponse<DimensionStructureType>>(`/dimensions/structure-types${localeParams()}`);
  return result.data;
}

export async function listTimeFrequencies() {
  const result = await apiGet<ListResponse<TimeFrequency>>(`/dimensions/time-frequencies${localeParams()}`);
  return result.data;
}

export async function createTimeFrequency(payload: TimeFrequencyPayload) {
  const result = await apiPost<DetailResponse<TimeFrequency>, TimeFrequencyPayload>(`/dimensions/time-frequencies${localeParams()}`, payload);
  return result.data;
}

export async function updateTimeFrequency(frequencyCode: string, payload: TimeFrequencyPayload) {
  const result = await apiPatch<DetailResponse<TimeFrequency>, TimeFrequencyPayload>(`/dimensions/time-frequencies/${encodeURIComponent(frequencyCode)}${localeParams()}`, payload);
  return result.data;
}

export async function deactivateTimeFrequency(frequencyCode: string) {
  const result = await apiDelete<DetailResponse<TimeFrequency>>(`/dimensions/time-frequencies/${encodeURIComponent(frequencyCode)}${localeParams()}`);
  return result.data;
}

export async function listTimePeriods(filters: { frequencyCode?: string; limit?: number; offset?: number; locale?: string } = {}) {
  const result = await apiGet<ListResponse<TimePeriod>>(
    `/dimensions/time-periods${localeParams({
      frequency_code: filters.frequencyCode === "ALL" ? undefined : filters.frequencyCode,
      limit: filters.limit ?? 500,
      offset: filters.offset ?? 0,
      locale: filters.locale,
    })}`,
  );
  return result.data;
}

export async function listAllTimePeriods(filters: { frequencyCode?: string; locale?: string } = {}) {
  const pageSize = 500;
  const allRows: TimePeriod[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await listTimePeriods({ ...filters, limit: pageSize, offset });
    const rows = page.data ?? [];
    allRows.push(...rows);
    if (rows.length < pageSize) break;
  }
  return { data: allRows };
}

export async function createTimePeriod(payload: TimePeriodPayload) {
  const result = await apiPost<DetailResponse<TimePeriod>, TimePeriodPayload>(`/dimensions/time-periods${localeParams()}`, payload);
  return result.data;
}

export async function updateTimePeriod(timePeriodCode: string, payload: TimePeriodPayload) {
  const result = await apiPatch<DetailResponse<TimePeriod>, TimePeriodPayload>(`/dimensions/time-periods/${encodeURIComponent(timePeriodCode)}${localeParams()}`, payload);
  return result.data;
}

export async function deactivateTimePeriod(timePeriodCode: string) {
  const result = await apiDelete<DetailResponse<TimePeriod>>(`/dimensions/time-periods/${encodeURIComponent(timePeriodCode)}${localeParams()}`);
  return result.data;
}

export async function listTimePeriodSets() {
  const result = await apiGet<ListResponse<DimensionMemberSet>>(`/dimensions/time-period-sets${localeParams()}`);
  return result.data;
}

export async function listGeographyLevels() {
  const result = await apiGet<ListResponse<GeographyLevel>>(`/dimensions/geography-levels${localeParams()}`);
  return result.data;
}

export async function listGeographies(filters: {
  parentGeographyCode?: string;
  levelCode?: string;
  limit?: number;
  offset?: number;
  locale?: string;
} = {}) {
  const result = await apiGet<ListResponse<Geography>>(
    `/dimensions/geographies${localeParams({
      parent_geography_code: filters.parentGeographyCode,
      level_code: filters.levelCode === "ALL" ? undefined : filters.levelCode,
      limit: filters.limit ?? 500,
      offset: filters.offset ?? 0,
      locale: filters.locale,
    })}`,
  );
  return result.data;
}

export async function createGeography(payload: GeographyPayload) {
  const result = await apiPost<DetailResponse<Geography>, GeographyPayload>(`/dimensions/geographies${localeParams()}`, payload);
  return result.data;
}

export async function updateGeography(geographyCode: string, payload: GeographyPayload) {
  const result = await apiPatch<DetailResponse<Geography>, GeographyPayload>(`/dimensions/geographies/${encodeURIComponent(geographyCode)}${localeParams()}`, payload);
  return result.data;
}

export async function deactivateGeography(geographyCode: string) {
  const result = await apiDelete<DetailResponse<Geography>>(`/dimensions/geographies/${encodeURIComponent(geographyCode)}${localeParams()}`);
  return result.data;
}

export async function listTimePeriodSetPeriods(setCode: string, options: { locale?: string } = {}) {
  const result = await apiGet<ListResponse<DimensionMemberSetItem>>(
    `/dimensions/time-period-sets/${encodeURIComponent(setCode)}/periods${localeParams({ limit: 1000, offset: 0, locale: options.locale })}`,
  );
  return result.data;
}

export async function createTimePeriodSet(payload: TimePeriodSetPayload) {
  const result = await apiPost<DetailResponse<DimensionMemberSet>, TimePeriodSetPayload>(`/dimensions/time-period-sets${localeParams()}`, payload);
  return result.data;
}

export async function updateTimePeriodSet(setCode: string, payload: TimePeriodSetPayload) {
  const result = await apiPatch<DetailResponse<DimensionMemberSet>, TimePeriodSetPayload>(`/dimensions/time-period-sets/${encodeURIComponent(setCode)}${localeParams()}`, payload);
  return result.data;
}

export async function listDimensions() {
  const result = await apiGet<ListResponse<DimensionManagementRow>>(`/dimensions${localeParams()}`);
  return result.data;
}

export async function getDimension(dimensionCode: string) {
  const result = await apiGet<DetailResponse<DimensionDetail>>(`/dimensions/${encodeURIComponent(dimensionCode)}${localeParams()}`);
  return result.data;
}

export async function createDimension(payload: DimensionPayload) {
  const result = await apiPost<DetailResponse<DimensionDetail>, DimensionPayload>(`/dimensions${localeParams()}`, payload);
  return result.data;
}

export async function updateDimension(dimensionCode: string, payload: DimensionPayload) {
  const result = await apiPatch<DetailResponse<DimensionDetail>, DimensionPayload>(
    `/dimensions/${encodeURIComponent(dimensionCode)}${localeParams()}`,
    payload,
  );
  return result.data;
}

export async function deactivateDimension(dimensionCode: string) {
  const result = await apiDelete<DetailResponse<DimensionDetail>>(`/dimensions/${encodeURIComponent(dimensionCode)}${localeParams()}`);
  return result.data;
}

export async function restoreDimension(dimensionCode: string) {
  const result = await apiPost<DetailResponse<DimensionDetail>, Record<string, never>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/restore${localeParams()}`,
    {},
  );
  return result.data;
}

export async function listDimensionMembers(dimensionCode: string, limit = 300, options: { locale?: string } = {}) {
  const result = await apiGet<ListResponse<DimensionMember>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/members${localeParams({ limit, offset: 0, locale: options.locale })}`,
  );
  return result.data;
}

export async function createDimensionMember(dimensionCode: string, payload: DimensionMemberPayload) {
  const result = await apiPost<DetailResponse<DimensionMember>, DimensionMemberPayload>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/members${localeParams()}`,
    payload,
  );
  return result.data;
}

export async function updateDimensionMember(dimensionCode: string, memberCode: string, payload: DimensionMemberPayload) {
  const result = await apiPatch<DetailResponse<DimensionMember>, DimensionMemberPayload>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/members/${encodeURIComponent(memberCode)}${localeParams()}`,
    payload,
  );
  return result.data;
}

export async function deactivateDimensionMember(dimensionCode: string, memberCode: string) {
  const result = await apiDelete<DetailResponse<DimensionMember>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/members/${encodeURIComponent(memberCode)}${localeParams()}`,
  );
  return result.data;
}

export async function listDimensionRelationships(dimensionCode: string, limit = 300) {
  const result = await apiGet<ListResponse<DimensionRelationship>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/member-relationships${localeParams({ limit, offset: 0 })}`,
  );
  return result.data;
}

export async function createDimensionRelationship(dimensionCode: string, payload: DimensionRelationshipPayload) {
  const result = await apiPost<DetailResponse<DimensionRelationship>, DimensionRelationshipPayload>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/member-relationships${localeParams()}`,
    payload,
  );
  return result.data;
}

export async function deactivateDimensionRelationship(dimensionCode: string, relationship: DimensionRelationship) {
  const result = await apiDelete<DetailResponse<DimensionRelationship>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/member-relationships/${encodeURIComponent(
      relationship.parent_member_code ?? "",
    )}/${encodeURIComponent(relationship.child_member_code ?? "")}${localeParams({
      relationship_type: relationship.relationship_type ?? "PARENT_CHILD",
    })}`,
  );
  return result.data;
}

export async function listDimensionMemberSets(dimensionCode: string) {
  const result = await apiGet<ListResponse<DimensionMemberSet>>(`/dimensions/member-sets${localeParams({ dimension_code: dimensionCode })}`);
  return result.data;
}

export async function listDimensionMemberSetMembers(setCode: string, limit = 300, options: { locale?: string } = {}) {
  const result = await apiGet<ListResponse<DimensionMemberSetItem>>(
    `/dimensions/member-sets/${encodeURIComponent(setCode)}/members${localeParams({ limit, offset: 0, locale: options.locale })}`,
  );
  return result.data;
}

export async function createDimensionMemberSet(dimensionCode: string, payload: DimensionSetPayload) {
  const result = await apiPost<DetailResponse<DimensionMemberSet>, DimensionSetPayload>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/member-sets${localeParams()}`,
    payload,
  );
  return result.data;
}

export async function updateDimensionMemberSet(dimensionCode: string, setCode: string, payload: DimensionSetPayload) {
  const result = await apiPatch<DetailResponse<DimensionMemberSet>, DimensionSetPayload>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/member-sets/${encodeURIComponent(setCode)}${localeParams()}`,
    payload,
  );
  return result.data;
}

export async function deactivateDimensionMemberSet(dimensionCode: string, setCode: string) {
  const result = await apiDelete<DetailResponse<DimensionMemberSet>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/member-sets/${encodeURIComponent(setCode)}${localeParams()}`,
  );
  return result.data;
}

export async function createDimensionMemberSetItem(setCode: string, payload: DimensionSetItemPayload) {
  const result = await apiPost<DetailResponse<DimensionMemberSetItem>, DimensionSetItemPayload>(
    `/dimensions/member-sets/${encodeURIComponent(setCode)}/members${localeParams()}`,
    payload,
  );
  return result.data;
}

export async function deactivateDimensionMemberSetItem(setCode: string, memberCode: string) {
  const result = await apiDelete<DetailResponse<DimensionMemberSetItem>>(
    `/dimensions/member-sets/${encodeURIComponent(setCode)}/members/${encodeURIComponent(memberCode)}${localeParams()}`,
  );
  return result.data;
}

export async function listDimensionAliases(dimensionCode: string, limit = 300) {
  const result = await apiGet<ListResponse<DimensionAlias>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/member-aliases${localeParams({ limit, offset: 0 })}`,
  );
  return result.data;
}

export async function createDimensionAlias(dimensionCode: string, payload: DimensionAliasPayload) {
  const result = await apiPost<DetailResponse<DimensionAlias>, DimensionAliasPayload>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/member-aliases${localeParams()}`,
    payload,
  );
  return result.data;
}

export async function deactivateDimensionAlias(dimensionCode: string, alias: DimensionAlias) {
  const result = await apiDelete<DetailResponse<DimensionAlias>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/member-aliases/${encodeURIComponent(alias.member_code ?? "")}/${encodeURIComponent(
      alias.alias_type ?? "",
    )}/${encodeURIComponent(alias.alias_value ?? "")}${localeParams({ source_system_code: alias.source_system_code })}`,
  );
  return result.data;
}

export async function listDimensionRollupRules(dimensionCode: string, limit = 300) {
  const result = await apiGet<ListResponse<DimensionRollupRule>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/rollup-rules${localeParams({ limit, offset: 0 })}`,
  );
  return result.data;
}

export async function createDimensionRollupRule(dimensionCode: string, payload: DimensionRollupPayload) {
  const result = await apiPost<DetailResponse<DimensionRollupRule>, DimensionRollupPayload>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/rollup-rules${localeParams()}`,
    payload,
  );
  return result.data;
}

export async function deactivateDimensionRollupRule(dimensionCode: string, rollup: DimensionRollupRule) {
  const result = await apiDelete<DetailResponse<DimensionRollupRule>>(
    `/dimensions/${encodeURIComponent(dimensionCode)}/rollup-rules/${encodeURIComponent(
      rollup.parent_member_code ?? "",
    )}/${encodeURIComponent(rollup.rule_code ?? "")}${localeParams()}`,
  );
  return result.data;
}
