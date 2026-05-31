export type TemplateStatus = "DRAFT" | "ACTIVE" | "RETIRED";

export type TemplateDefinitionSample = {
  template_code: string;
  template_type: "DATA_ENTRY" | "REVIEW" | "REPORTING";
  owning_unit_code: string;
  status: TemplateStatus;
  is_active: boolean;
  current_version_code: string;
  name: string;
  description: string;
  mapped_indicator_code: string;
  mapped_indicator_number: string;
  mapped_indicator_name: string;
  mapped_global_indicator_code: string;
  source_unit_code: string;
  version_count: number;
  axis_count: number;
  cell_count: number;
  validation_rule_count: number;
  updated_at: string;
};

export type TemplateVersionSample = {
  template_code: string;
  version_code: string;
  version_number: number;
  render_contract_version: string;
  effective_from: string;
  effective_to?: string;
  is_current: boolean;
  status: TemplateStatus;
  title: string;
  instructions: string;
};

export type TemplateAxisSample = {
  axis_code: string;
  version_code: string;
  axis_role: "ROW" | "COLUMN" | "PAGE" | "CONTEXT";
  dimension_code: string;
  member_strategy: "FIXED" | "FROM_REQUEST" | "CONTRIBUTOR_SELECT" | "CONTRIBUTOR_EXTEND";
  member_set_code?: string;
  axis_depth: number;
  is_required: boolean;
  allow_multiple: boolean;
  label: string;
};

export type TemplateMeasureSample = {
  measure_code: string;
  version_code: string;
  indicator_measure_code: string;
  value_type: "NUMERIC" | "INTEGER" | "TEXT" | "BOOLEAN" | "DATE";
  unit_code: string;
  aggregation_type: string;
  is_editable: boolean;
  is_required: boolean;
  decimal_places: number;
  label: string;
};

export type TemplateCellSample = {
  cell_code: string;
  version_code: string;
  indicator_version_code: string;
  measure_code: string;
  row_axis_code: string;
  column_axis_code: string;
  context_axis_code: string;
  is_editable: boolean;
  is_required: boolean;
  validation_profile_code: string;
  label: string;
};

export type TemplateValidationRuleSample = {
  rule_code: string;
  version_code: string;
  cell_code?: string;
  measure_code?: string;
  severity: "INFO" | "WARNING" | "ERROR" | "BLOCKER";
  label: string;
};

export type TemplateGridCellSample = {
  address: string;
  row: number;
  column: number;
  value: string;
  role: "TITLE" | "HEADER" | "DIMENSION_MEMBER" | "MEASURE" | "INPUT" | "STATUS" | "EMPTY";
  row_span?: number;
  column_span?: number;
  bound_code?: string;
  editable?: boolean;
  required?: boolean;
};

export const templateDefinitions: TemplateDefinitionSample[] = [
  {
    template_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP",
    template_type: "DATA_ENTRY",
    owning_unit_code: "SDG",
    status: "ACTIVE",
    is_active: true,
    current_version_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP_V1",
    name: "SDG NIF 1.2.1 State subgroup data template",
    description: "State-level poverty-line population data with area-type subgroup columns.",
    mapped_indicator_code: "NIF_1_2_1",
    mapped_indicator_number: "1.2.1",
    mapped_indicator_name: "Population below poverty line",
    mapped_global_indicator_code: "GIND_1_2_1",
    source_unit_code: "SSD_DEMO_SOURCE",
    version_count: 1,
    axis_count: 3,
    cell_count: 3,
    validation_rule_count: 3,
    updated_at: "2026-05-29 10:42",
  },
  {
    template_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT",
    template_type: "DATA_ENTRY",
    owning_unit_code: "SDG",
    status: "DRAFT",
    is_active: false,
    current_version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1",
    name: "NIF 1.2.1 area, gender, and time draft",
    description: "Draft template using geography rows, merged time headers, area type, and gender column groups.",
    mapped_indicator_code: "NIF_1_2_1",
    mapped_indicator_number: "1.2.1",
    mapped_indicator_name: "Population below poverty line",
    mapped_global_indicator_code: "GIND_1_2_1",
    source_unit_code: "SSD_DEMO_SOURCE",
    version_count: 1,
    axis_count: 4,
    cell_count: 12,
    validation_rule_count: 2,
    updated_at: "2026-05-31 13:10",
  },
  {
    template_code: "TPL_NIF_3_8_1_HEALTH_ACCESS",
    template_type: "DATA_ENTRY",
    owning_unit_code: "HEALTH",
    status: "DRAFT",
    is_active: false,
    current_version_code: "TPL_NIF_3_8_1_HEALTH_ACCESS_V1",
    name: "NIF 3.8.1 health access draft",
    description: "Health access reporting draft pending indicator/version readiness.",
    mapped_indicator_code: "NIF_3_8_1",
    mapped_indicator_number: "3.8.1",
    mapped_indicator_name: "Coverage of essential health services",
    mapped_global_indicator_code: "GIND_3_8_1",
    source_unit_code: "HEALTH",
    version_count: 1,
    axis_count: 2,
    cell_count: 4,
    validation_rule_count: 1,
    updated_at: "2026-05-30 16:22",
  },
];

export const templateVersions: TemplateVersionSample[] = [
  {
    template_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP",
    version_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP_V1",
    version_number: 1,
    render_contract_version: "v1",
    effective_from: "2025-04-01",
    is_current: true,
    status: "ACTIVE",
    title: "SDG NIF 1.2.1 State subgroup template",
    instructions: "Enter values for each requested geography and subgroup.",
  },
  {
    template_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT",
    version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1",
    version_number: 1,
    render_contract_version: "v1",
    effective_from: "2026-04-01",
    is_current: true,
    status: "DRAFT",
    title: "NIF 1.2.1 area, gender, and time draft",
    instructions: "Draft layout with nested headers for time, area type, and gender.",
  },
  {
    template_code: "TPL_NIF_3_8_1_HEALTH_ACCESS",
    version_code: "TPL_NIF_3_8_1_HEALTH_ACCESS_V1",
    version_number: 1,
    render_contract_version: "v1",
    effective_from: "2026-04-01",
    is_current: true,
    status: "DRAFT",
    title: "NIF 3.8.1 health access draft",
    instructions: "Draft template pending source mapping confirmation.",
  },
];

export const templateAxes: TemplateAxisSample[] = [
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", axis_code: "AXIS_GEOGRAPHY_ROWS", axis_role: "ROW", dimension_code: "GEOGRAPHY", member_strategy: "FROM_REQUEST", member_set_code: "STATE_COLLECTION_SCOPE", axis_depth: 1, is_required: true, allow_multiple: true, label: "Location" },
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", axis_code: "AXIS_TIME_COLUMNS", axis_role: "COLUMN", dimension_code: "TIME_PERIOD", member_strategy: "FIXED", member_set_code: "FY_STANDARD", axis_depth: 1, is_required: true, allow_multiple: true, label: "Year" },
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", axis_code: "AXIS_AREA_COLUMNS", axis_role: "COLUMN", dimension_code: "AREA_TYPE", member_strategy: "FIXED", member_set_code: "AREA_TYPE_STANDARD", axis_depth: 2, is_required: true, allow_multiple: true, label: "Area type" },
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", axis_code: "AXIS_GENDER_COLUMNS", axis_role: "COLUMN", dimension_code: "GENDER", member_strategy: "FIXED", member_set_code: "GENDER_STANDARD", axis_depth: 3, is_required: true, allow_multiple: true, label: "Gender" },
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", axis_code: "AXIS_INDICATOR_CONTEXT", axis_role: "CONTEXT", dimension_code: "NATIONAL_INDICATOR", member_strategy: "FIXED", axis_depth: 1, is_required: true, allow_multiple: false, label: "Indicator" },
];

export const templateMeasures: TemplateMeasureSample[] = [
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", measure_code: "INDICATOR_VALUE", indicator_measure_code: "INDICATOR_VALUE", value_type: "NUMERIC", unit_code: "PERCENT", aggregation_type: "SUM", is_editable: true, is_required: true, decimal_places: 2, label: "Indicator value" },
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", measure_code: "COMMENT", indicator_measure_code: "COMMENT", value_type: "TEXT", unit_code: "NA", aggregation_type: "NONE", is_editable: true, is_required: false, decimal_places: 0, label: "Comment" },
];

export const templateCells: TemplateCellSample[] = [
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", cell_code: "CELL_NIF_1_2_1_2011_TOTAL_FEMALE", indicator_version_code: "NIF_1_2_1_V1", measure_code: "INDICATOR_VALUE", row_axis_code: "AXIS_GEOGRAPHY_ROWS", column_axis_code: "AXIS_AREA_COLUMNS", context_axis_code: "AXIS_TIME_COLUMNS", is_editable: true, is_required: true, validation_profile_code: "NUMERIC_NON_NEGATIVE", label: "2011-12 Total Female" },
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", cell_code: "CELL_NIF_1_2_1_2011_TOTAL_MALE", indicator_version_code: "NIF_1_2_1_V1", measure_code: "INDICATOR_VALUE", row_axis_code: "AXIS_GEOGRAPHY_ROWS", column_axis_code: "AXIS_AREA_COLUMNS", context_axis_code: "AXIS_TIME_COLUMNS", is_editable: true, is_required: true, validation_profile_code: "NUMERIC_NON_NEGATIVE", label: "2011-12 Total Male" },
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", cell_code: "CELL_NIF_1_2_1_2012_URBAN_FEMALE", indicator_version_code: "NIF_1_2_1_V1", measure_code: "INDICATOR_VALUE", row_axis_code: "AXIS_GEOGRAPHY_ROWS", column_axis_code: "AXIS_AREA_COLUMNS", context_axis_code: "AXIS_TIME_COLUMNS", is_editable: true, is_required: true, validation_profile_code: "NUMERIC_NON_NEGATIVE", label: "2012-13 Urban Female" },
];

export const templateValidationRules: TemplateValidationRuleSample[] = [
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", cell_code: "CELL_NIF_1_2_1_2011_TOTAL_FEMALE", rule_code: "NUMERIC_NON_NEGATIVE", severity: "ERROR", label: "Value must be zero or above" },
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", measure_code: "INDICATOR_VALUE", rule_code: "REQUIRED_WHEN_REQUESTED", severity: "BLOCKER", label: "Required cells must be completed before submit" },
  { version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1", measure_code: "INDICATOR_VALUE", rule_code: "DECIMAL_PLACES_2", severity: "WARNING", label: "Use up to two decimals" },
];

export const templateGridCells: TemplateGridCellSample[] = [
  { address: "A1", row: 1, column: 1, value: "Indicator: Population below poverty line", role: "TITLE", column_span: 4, bound_code: "NIF_1_2_1" },
  { address: "E1", row: 1, column: 5, value: "Code: NIF_1_2_1", role: "TITLE", column_span: 3, bound_code: "NIF_1_2_1_V1" },
  { address: "A2", row: 2, column: 1, value: "Location", role: "HEADER", row_span: 2, bound_code: "GEOGRAPHY" },
  { address: "B2", row: 2, column: 2, value: "2011-12", role: "HEADER", column_span: 6, bound_code: "TIME_2011_12" },
  { address: "H2", row: 2, column: 8, value: "2012-13", role: "HEADER", column_span: 6, bound_code: "TIME_2012_13" },
  { address: "B3", row: 3, column: 2, value: "Total / Female", role: "HEADER", bound_code: "TOTAL:FEMALE" },
  { address: "C3", row: 3, column: 3, value: "Total / Male", role: "HEADER", bound_code: "TOTAL:MALE" },
  { address: "D3", row: 3, column: 4, value: "Rural / Female", role: "HEADER", bound_code: "RURAL:FEMALE" },
  { address: "E3", row: 3, column: 5, value: "Rural / Male", role: "HEADER", bound_code: "RURAL:MALE" },
  { address: "F3", row: 3, column: 6, value: "Urban / Female", role: "HEADER", bound_code: "URBAN:FEMALE" },
  { address: "G3", row: 3, column: 7, value: "Urban / Male", role: "HEADER", bound_code: "URBAN:MALE" },
  { address: "H3", row: 3, column: 8, value: "Total / Female", role: "HEADER", bound_code: "TOTAL:FEMALE" },
  { address: "I3", row: 3, column: 9, value: "Total / Male", role: "HEADER", bound_code: "TOTAL:MALE" },
  { address: "J3", row: 3, column: 10, value: "Rural / Female", role: "HEADER", bound_code: "RURAL:FEMALE" },
  { address: "K3", row: 3, column: 11, value: "Rural / Male", role: "HEADER", bound_code: "RURAL:MALE" },
  { address: "L3", row: 3, column: 12, value: "Urban / Female", role: "HEADER", bound_code: "URBAN:FEMALE" },
  { address: "M3", row: 3, column: 13, value: "Urban / Male", role: "HEADER", bound_code: "URBAN:MALE" },
  { address: "A4", row: 4, column: 1, value: "Karnataka", role: "DIMENSION_MEMBER", bound_code: "KA" },
  { address: "A5", row: 5, column: 1, value: "Tamil Nadu", role: "DIMENSION_MEMBER", bound_code: "TN" },
  { address: "A6", row: 6, column: 1, value: "Maharashtra", role: "DIMENSION_MEMBER", bound_code: "MH" },
];

export const templateDraftMatches = [
  { match_type: "Dimension", code: "AREA_TYPE", label: "Area type", note: "3 values: Total, Rural, Urban" },
  { match_type: "Dimension", code: "GEOGRAPHY", label: "Geography", note: "Request-scoped location rows" },
  { match_type: "Dimension", code: "GENDER", label: "Gender", note: "3 values: Total, Female, Male" },
  { match_type: "Measure", code: "INDICATOR_VALUE", label: "Indicator value", note: "NUMERIC / Percent" },
  { match_type: "Indicator", code: "NIF_1_2_1", label: "Population below poverty line", note: "Mapped to GIND_1_2_1" },
];
