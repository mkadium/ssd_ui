export type TemplateListResponse<T> = {
  data: T[];
  locale: string;
  count: number;
};

export type TemplateDetailResponse<T> = {
  data: T;
  locale: string;
};

export type TemplateStatus = "DRAFT" | "ACTIVE" | "RETIRED" | string;

export type TemplateDefinitionListItem = {
  template_code: string;
  template_type?: "DATA_ENTRY" | "REVIEW" | "REPORTING" | string | null;
  owning_unit_code?: string | null;
  status?: TemplateStatus | null;
  is_active?: boolean | string | null;
  current_version_code?: string | null;
  name: string;
  description?: string | null;
};

export type TemplateVersionListItem = {
  template_code?: string | null;
  version_code: string;
  version_number?: number | string | null;
  render_contract_version?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  is_current?: boolean | string | null;
  status?: TemplateStatus | null;
  title?: string | null;
  instructions?: string | null;
};

export type TemplateDefinitionDetail = TemplateDefinitionListItem & {
  versions?: TemplateVersionListItem[];
};

export type TemplateDefinitionRequest = {
  template_code: string;
  name: string;
  owning_unit_code: string;
  template_type?: string;
  status?: string;
  default_locale_code?: string;
  is_active?: boolean;
  description?: string | null;
};

export type TemplateVersionRequest = {
  template_code: string;
  version_code: string;
  title: string;
  unit_code: string;
  version_number?: number | null;
  render_contract_version?: string;
  effective_from?: string | null;
  effective_to?: string | null;
  is_current?: boolean;
  status?: string;
  publish_notes?: string | null;
  subtitle?: string | null;
  instructions?: string | null;
};

export type TemplateAxisRequest = {
  axis_code: string;
  axis_role: string;
  dimension_code: string;
  label: string;
  unit_code: string;
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

export type TemplateAxisMemberRequest = {
  axis_code: string;
  member_code: string;
  unit_code: string;
  member_order?: number;
  is_default?: boolean;
  is_active?: boolean;
};

export type TemplateMeasureRequest = {
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
  sort_order?: number;
  is_editable?: boolean;
  is_required?: boolean;
  render_metadata?: Record<string, unknown>;
  is_active?: boolean;
  help_text?: string | null;
};

export type TemplateBindingGroupRequest = {
  binding_group_code: string;
  binding_group_type?: string;
  unit_code: string;
  axis_code?: string | null;
  measure_code?: string | null;
  parent_binding_group_code?: string | null;
  axis_role?: string | null;
  header_label?: string | null;
  show_header?: boolean;
  axis_alignment?: string;
  freeze_group?: boolean;
  is_editable?: boolean;
  is_required?: boolean;
  display_order?: number;
  nesting_order?: number;
  selected_range?: string | null;
  render_options?: Record<string, unknown>;
  is_active?: boolean;
  horizontal_align?: string | null;
  vertical_align?: string | null;
  value_type_override?: string | null;
  decimal_places_override?: number | null;
  validation_rule_code_override?: string | null;
  merge_enabled?: boolean;
  merge_row_span?: number;
  merge_column_span?: number;
  combine_mode?: string | null;
  geography_scope_code?: string | null;
  preview_enabled?: boolean;
};

export type TemplateCellRequest = {
  cell_code: string;
  measure_code: string;
  unit_code: string;
  indicator_version_code?: string | null;
  row_axis_code?: string | null;
  column_axis_code?: string | null;
  page_axis_code?: string | null;
  context_axis_code?: string | null;
  is_editable?: boolean;
  is_required?: boolean;
  validation_profile_code?: string | null;
  render_metadata?: Record<string, unknown>;
  is_active?: boolean;
};

export type TemplateCellAxisMemberBinding = {
  axis_code: string;
  dimension_code: string;
  member_code: string;
};

export type TemplateCellAxisMembersRequest = {
  unit_code: string;
  axis_member_bindings: TemplateCellAxisMemberBinding[];
};

export type TemplateRenderElementRequest = {
  element_code: string;
  element_type: string;
  unit_code: string;
  label?: string | null;
  parent_element_code?: string | null;
  axis_code?: string | null;
  cell_code?: string | null;
  row_start?: number | null;
  row_span?: number;
  column_start?: number | null;
  column_span?: number;
  sort_order?: number;
  render_metadata?: Record<string, unknown>;
  is_active?: boolean;
  help_text?: string | null;
};

export type TemplateValidationRuleRefRequest = {
  rule_code: string;
  unit_code: string;
  cell_code?: string | null;
  measure_code?: string | null;
  severity?: string;
  rule_config?: Record<string, unknown>;
  is_active?: boolean;
};

export type TemplatePublishRequest = {
  unit_code: string;
  publish_notes?: string | null;
  effective_from?: string | null;
};

export type TemplateActiveRequest = {
  unit_code: string;
  is_active: boolean;
};

export type TemplateRenderContract = {
  version?: Record<string, unknown>;
  axes?: Array<Record<string, unknown>>;
  axis_members?: Array<Record<string, unknown>>;
  measures?: Array<Record<string, unknown>>;
  binding_groups?: Array<Record<string, unknown>>;
  cells?: Array<Record<string, unknown>>;
  cell_axis_members?: Array<Record<string, unknown>>;
  render_elements?: Array<Record<string, unknown>>;
  validation_rule_refs?: Array<Record<string, unknown>>;
  data_entry_cell_bindings?: Array<Record<string, unknown>>;
  dimension_rollup_rules?: Array<Record<string, unknown>>;
  designer_contract?: {
    group_tree?: Array<Record<string, unknown>>;
    binding_group_paths?: Array<Record<string, unknown>>;
    measure_column_groups?: Array<Record<string, unknown>>;
    supported_designer_options?: Record<string, unknown>;
    [key: string]: unknown;
  };
  data_entry_contract?: {
    value_bindings?: Array<Record<string, unknown>>;
    value_bindings_by_measure?: Record<string, Array<Record<string, unknown>>>;
    submitted_value_shape?: Record<string, unknown>;
    [key: string]: unknown;
  };
};
