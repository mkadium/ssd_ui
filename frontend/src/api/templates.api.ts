import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./http-client";
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

export type TemplateDefinition = {
  template_code?: string;
  name?: string;
  template_name?: string;
  description?: string | null;
  owning_unit_code?: string;
  template_type?: string;
  status?: string;
  default_locale_code?: string;
  is_active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  last_updated?: string | null;
  current_version_code?: string | null;
  version_code?: string | null;
  version_number?: number | null;
};

export type TemplateVersion = {
  template_code?: string;
  version_code?: string;
  title?: string;
  subtitle?: string | null;
  instructions?: string | null;
  version_number?: number | null;
  render_contract_version?: string;
  status?: string;
  is_current?: boolean;
  effective_from?: string | null;
  effective_to?: string | null;
  publish_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TemplateAxis = {
  axis_code?: string;
  axis_role?: string;
  dimension_code?: string;
  label?: string;
  parent_axis_code?: string | null;
  member_strategy?: string;
  member_set_code?: string | null;
  axis_depth?: number;
  display_when_single_member?: boolean;
  is_required?: boolean;
  allow_multiple?: boolean;
  sort_order?: number;
  render_metadata?: Record<string, unknown>;
  is_active?: boolean;
  help_text?: string | null;
};

export type TemplateMeasure = {
  measure_code?: string;
  label?: string;
  source_measure_code?: string;
  indicator_version_code?: string;
  measure_unit_code?: string | null;
  value_type?: string | null;
  aggregation_type?: string | null;
  sort_order?: number;
  is_required?: boolean;
  is_editable?: boolean;
  is_active?: boolean;
};

export type TemplateStudioDraft = {
  version_code?: string;
  studio_state?: Record<string, unknown>;
  updated_by?: string | null;
  updated_at?: string | null;
};

export type TemplateFormulaOutput = {
  formula_code?: string;
  formula_name?: string;
  formula_type?: string;
  expression_text?: string;
  output_uom_code?: string | null;
  function_code?: string | null;
  source_column_keys?: string[];
  render_metadata?: Record<string, unknown>;
  sort_order?: number;
  is_active?: boolean;
};

export type TemplateRenderContract = {
  template?: Record<string, unknown>;
  version?: Record<string, unknown>;
  axes?: TemplateAxis[];
  measures?: TemplateMeasure[];
  cells?: Record<string, unknown>[];
  render_elements?: Record<string, unknown>[];
  validation_rule_refs?: Record<string, unknown>[];
};

export type TemplateDefinitionPayload = {
  template_code: string;
  name: string;
  owning_unit_code: string;
  template_type: string;
  status: string;
  default_locale_code: string;
  is_active: boolean;
  description?: string;
};

export type TemplateVersionPayload = {
  template_code: string;
  version_code: string;
  title: string;
  unit_code: string;
  version_number?: number;
  render_contract_version: string;
  effective_from?: string;
  effective_to?: string;
  is_current: boolean;
  status: string;
  publish_notes?: string;
  subtitle?: string;
  instructions?: string;
};

export type TemplatePublishPayload = {
  unit_code: string;
  publish_notes?: string | null;
  effective_from?: string | null;
};

export type TemplateVersionStatusPayload = {
  unit_code: string;
  status: string;
  is_current?: boolean;
};

export type TemplateAxisPayload = {
  axis_code: string;
  axis_role: string;
  dimension_code: string;
  label: string;
  unit_code: string;
  parent_axis_code?: string;
  member_strategy: string;
  member_set_code?: string;
  axis_depth: number;
  display_when_single_member: boolean;
  is_required: boolean;
  allow_multiple: boolean;
  sort_order: number;
  render_metadata: Record<string, unknown>;
  is_active: boolean;
  help_text?: string;
};

export type TemplateMeasurePayload = {
  measure_code: string;
  indicator_version_code: string;
  source_measure_code: string;
  label: string;
  unit_code: string;
  value_type?: string | null;
  measure_unit_code?: string | null;
  aggregation_type?: string | null;
  decimal_places?: number | null;
  validation_rule_code?: string | null;
  sort_order: number;
  is_editable: boolean;
  is_required: boolean;
  render_metadata: Record<string, unknown>;
  is_active: boolean;
  help_text?: string | null;
};

export type TemplateStudioDraftPayload = {
  unit_code: string;
  studio_state: Record<string, unknown>;
  updated_by?: string | null;
};

export type TemplateFormulaOutputPayload = {
  formula_code: string;
  formula_name: string;
  formula_type: string;
  expression_text: string;
  unit_code: string;
  output_uom_code?: string | null;
  function_code?: string | null;
  source_column_keys?: string[];
  render_metadata?: Record<string, unknown>;
  sort_order?: number;
  is_active?: boolean;
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
  return query({ locale: getSelectedLocale(), unit_code: getSelectedUnitCode(), ...extra });
}

export async function listTemplates(filters: { status?: string; limit?: number; offset?: number } = {}) {
  const result = await apiGet<ListResponse<TemplateDefinition>>(
    `/templates${localeParams({
      status: filters.status === "ALL" ? undefined : filters.status,
      limit: filters.limit ?? 200,
      offset: filters.offset ?? 0,
    })}`,
  );
  return result.data;
}

export async function getTemplate(templateCode: string) {
  const result = await apiGet<DetailResponse<TemplateDefinition>>(
    `/templates/${encodeURIComponent(templateCode)}${localeParams()}`,
  );
  return result.data;
}

export async function createTemplate(payload: TemplateDefinitionPayload) {
  const result = await apiPost<DetailResponse<TemplateDefinition>, TemplateDefinitionPayload>(
    `/templates${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}

export async function updateTemplate(templateCode: string, payload: TemplateDefinitionPayload) {
  const result = await apiPatch<DetailResponse<TemplateDefinition>, TemplateDefinitionPayload>(
    `/templates/${encodeURIComponent(templateCode)}${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}

export async function deactivateTemplate(templateCode: string) {
  const result = await apiDelete<DetailResponse<TemplateDefinition>>(
    `/templates/${encodeURIComponent(templateCode)}${query({ locale: getSelectedLocale() })}`,
  );
  return result.data;
}

export async function listTemplateVersions(templateCode: string) {
  const result = await apiGet<ListResponse<TemplateVersion>>(
    `/templates/${encodeURIComponent(templateCode)}/versions${localeParams()}`,
  );
  return result.data;
}

export async function getTemplateVersion(versionCode: string) {
  const result = await apiGet<DetailResponse<TemplateVersion>>(
    `/templates/versions/${encodeURIComponent(versionCode)}${localeParams()}`,
  );
  return result.data;
}

export async function createTemplateVersion(templateCode: string, payload: TemplateVersionPayload) {
  const result = await apiPost<DetailResponse<TemplateVersion>, TemplateVersionPayload>(
    `/templates/${encodeURIComponent(templateCode)}/versions${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}

export async function updateTemplateVersion(templateCode: string, versionCode: string, payload: TemplateVersionPayload) {
  const result = await apiPatch<DetailResponse<TemplateVersion>, TemplateVersionPayload>(
    `/templates/${encodeURIComponent(templateCode)}/versions/${encodeURIComponent(versionCode)}${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}

export async function publishTemplateVersion(versionCode: string, payload: TemplatePublishPayload) {
  const result = await apiPost<DetailResponse<TemplateVersion>, TemplatePublishPayload>(
    `/templates/versions/${encodeURIComponent(versionCode)}/publish${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}

export async function setTemplateVersionStatus(versionCode: string, payload: TemplateVersionStatusPayload) {
  const result = await apiPatch<DetailResponse<TemplateVersion>, TemplateVersionStatusPayload>(
    `/templates/versions/${encodeURIComponent(versionCode)}/status${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}

export async function listTemplateAxes(versionCode: string) {
  const result = await apiGet<ListResponse<TemplateAxis>>(
    `/templates/versions/${encodeURIComponent(versionCode)}/axes${localeParams()}`,
  );
  return result.data;
}

export async function createTemplateAxis(versionCode: string, payload: TemplateAxisPayload) {
  const result = await apiPost<DetailResponse<TemplateAxis>, TemplateAxisPayload>(
    `/templates/versions/${encodeURIComponent(versionCode)}/axes${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}

export async function updateTemplateAxis(versionCode: string, axisCode: string, payload: TemplateAxisPayload) {
  const result = await apiPatch<DetailResponse<TemplateAxis>, TemplateAxisPayload>(
    `/templates/versions/${encodeURIComponent(versionCode)}/axes/${encodeURIComponent(axisCode)}${query({
      locale: getSelectedLocale(),
    })}`,
    payload,
  );
  return result.data;
}

export async function listTemplateMeasures(versionCode: string) {
  const result = await apiGet<ListResponse<TemplateMeasure>>(
    `/templates/versions/${encodeURIComponent(versionCode)}/measures${localeParams()}`,
  );
  return result.data;
}

export async function createTemplateMeasure(versionCode: string, payload: TemplateMeasurePayload) {
  const result = await apiPost<DetailResponse<TemplateMeasure>, TemplateMeasurePayload>(
    `/templates/versions/${encodeURIComponent(versionCode)}/measures${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}

export async function updateTemplateMeasure(versionCode: string, measureCode: string, payload: TemplateMeasurePayload) {
  const result = await apiPatch<DetailResponse<TemplateMeasure>, TemplateMeasurePayload>(
    `/templates/versions/${encodeURIComponent(versionCode)}/measures/${encodeURIComponent(measureCode)}${query({
      locale: getSelectedLocale(),
    })}`,
    payload,
  );
  return result.data;
}

export async function getTemplateRenderContract(versionCode: string) {
  const result = await apiGet<DetailResponse<TemplateRenderContract>>(
    `/templates/versions/${encodeURIComponent(versionCode)}/render-contract${localeParams()}`,
  );
  return result.data;
}

export async function getTemplateStudioDraft(versionCode: string) {
  const result = await apiGet<DetailResponse<TemplateStudioDraft>>(
    `/templates/versions/${encodeURIComponent(versionCode)}/studio-draft${localeParams()}`,
  );
  return result.data;
}

export async function saveTemplateStudioDraft(versionCode: string, payload: TemplateStudioDraftPayload) {
  const result = await apiPut<DetailResponse<TemplateStudioDraft>, TemplateStudioDraftPayload>(
    `/templates/versions/${encodeURIComponent(versionCode)}/studio-draft${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}

export async function listTemplateFormulaOutputs(versionCode: string) {
  const result = await apiGet<ListResponse<TemplateFormulaOutput>>(
    `/templates/versions/${encodeURIComponent(versionCode)}/formula-outputs${localeParams()}`,
  );
  return result.data;
}

export async function upsertTemplateFormulaOutput(versionCode: string, payload: TemplateFormulaOutputPayload) {
  const result = await apiPost<DetailResponse<TemplateFormulaOutput>, TemplateFormulaOutputPayload>(
    `/templates/versions/${encodeURIComponent(versionCode)}/formula-outputs${query({ locale: getSelectedLocale() })}`,
    payload,
  );
  return result.data;
}
