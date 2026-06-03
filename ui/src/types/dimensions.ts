export type DimensionListResponse<T> = {
  data: T[];
  locale: string;
  count: number;
};

export type DimensionDetailResponse<T> = {
  data: T;
  locale: string;
};

export type DimensionsHealthResponse = {
  status: string;
  module: string;
};

export type DimensionRequest = {
  dimension_code?: string | null;
  dimension_type?: string;
  value_type?: string;
  is_hierarchical?: boolean;
  sort_order?: number;
  is_active?: boolean;
  name: string;
  description?: string | null;
};

export type DimensionDefinitionItem = {
  dimension_code: string;
  dimension_type: "GENERAL" | "GEOGRAPHY" | "TIME" | string;
  value_type: "TEXT" | "NUMERIC" | "INTEGER" | "BOOLEAN" | "DATE" | string;
  is_hierarchical: boolean;
  name: string;
  description?: string | null;
  status?: string | null;
  member_count?: number | string | null;
  set_count?: number | string | null;
  template_usage_count?: number | string | null;
};

export type DimensionMemberItem = {
  dimension_code: string;
  member_code: string;
  parent_member_code?: string | null;
  external_code?: string | null;
  name: string;
  short_name?: string | null;
  sort_order?: number | string | null;
  status?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
};

export type DimensionMemberRequest = {
  member_code?: string | null;
  external_code?: string | null;
  sort_order?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
  name: string;
  short_name?: string | null;
  description?: string | null;
};

export type DimensionMemberSetItem = {
  dimension_code: string;
  set_code: string;
  set_type?: string | null;
  name: string;
  member_count?: number | string | null;
  status?: string | null;
};

export type DimensionMemberSetRequest = {
  set_code?: string | null;
  set_type?: string;
  is_active?: boolean;
  name: string;
  description?: string | null;
};

export type DimensionMemberSetItemRequest = {
  dimension_code: string;
  member_code: string;
  sort_order?: number;
  is_active?: boolean;
};

export type DimensionMemberRelationshipRequest = {
  parent_member_code: string;
  child_member_code: string;
  relationship_type?: string;
  sort_order?: number;
  is_active?: boolean;
};

export type DimensionMemberSetMemberItem = DimensionMemberItem & {
  set_code: string;
};

export type GeographyItem = {
  geography_code: string;
  member_code: string;
  level_code: string;
  parent_geography_code?: string | null;
  iso_alpha2_code?: string | null;
  iso_alpha3_code?: string | null;
  name: string;
  status?: string | null;
};

export type GeographyLevelItem = {
  level_code: string;
  level_number: number | string;
  name: string;
  description?: string | null;
  is_active?: boolean | string | null;
};

export type GeographyRequest = {
  geography_code?: string | null;
  member_code?: string | null;
  level_code: string;
  parent_geography_code?: string | null;
  iso_alpha2_code?: string | null;
  iso_alpha3_code?: string | null;
  census_code?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  is_active?: boolean;
  name: string;
  short_name?: string | null;
  description?: string | null;
};

export type TimePeriodItem = {
  time_period_code: string;
  member_code?: string | null;
  frequency_code: string;
  period_year?: number | string | null;
  period_quarter?: number | string | null;
  period_month?: number | string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  name: string;
};

export type TimeFrequencyItem = {
  frequency_code: string;
  months_interval?: number | string | null;
  sort_order?: number | string | null;
  name: string;
  description?: string | null;
  is_active?: boolean | string | null;
};

export type TimePeriodRequest = {
  time_period_code?: string | null;
  member_code?: string | null;
  frequency_code: string;
  period_year: number;
  period_quarter?: number | null;
  period_month?: number | null;
  start_date: string;
  end_date: string;
  status?: string;
  is_active?: boolean;
  name: string;
  short_name?: string | null;
  description?: string | null;
};

export type DimensionMemberRollupRuleItem = {
  id?: string;
  dimension_code?: string;
  parent_member_code: string;
  parent_label?: string | null;
  rule_code: string;
  entry_mode?: string | null;
  aggregation_method?: string | null;
  measure_code?: string | null;
  weight_measure_code?: string | null;
  validation_rule_code?: string | null;
  status?: string | null;
  is_active?: boolean | string | null;
  children?: Array<{
    member_code: string;
    label?: string | null;
    child_order?: number | string | null;
    child_weight?: number | string | null;
  }>;
};
