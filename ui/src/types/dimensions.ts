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

export type DimensionMemberSetItem = {
  dimension_code: string;
  set_code: string;
  set_type?: string | null;
  name: string;
  member_count?: number | string | null;
  status?: string | null;
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
