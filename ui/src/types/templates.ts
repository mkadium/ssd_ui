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
