export type DimensionDefinition = {
  dimension_code: string;
  dimension_type: "GENERAL" | "GEOGRAPHY" | "TIME";
  value_type: "TEXT" | "NUMERIC" | "INTEGER" | "BOOLEAN" | "DATE";
  is_hierarchical: boolean;
  name: string;
  description: string;
  status: "ACTIVE" | "DRAFT" | "RETIRED";
  member_count: number;
  set_count: number;
  template_usage_count: number;
};

export type DimensionMember = {
  id: string;
  dimension_code: string;
  member_code: string;
  parent_member_code?: string;
  external_code: string;
  name: string;
  short_name: string;
  sort_order: number;
  status: "ACTIVE" | "DRAFT" | "RETIRED";
  valid_from: string;
  valid_to?: string;
};

export type DimensionMemberSet = {
  id: string;
  dimension_code: string;
  set_code: string;
  set_type: "CONTROLLED_SCOPE" | "TEMPLATE_SCOPE" | "REQUEST_SCOPE" | "REPORT_SCOPE";
  name: string;
  member_count: number;
  status: "ACTIVE" | "DRAFT" | "RETIRED";
};

export type GeographyLevel = {
  level_code: string;
  level_number: number;
  name: string;
};

export type GeographyRecord = {
  geography_code: string;
  member_code: string;
  level_code: string;
  parent_geography_code?: string;
  iso_alpha2_code?: string;
  iso_alpha3_code?: string;
  name: string;
  status: "ACTIVE" | "DRAFT" | "RETIRED";
};

export type TimeFrequency = {
  frequency_code: string;
  name: string;
  months_interval: number;
  status: "ACTIVE" | "DRAFT" | "RETIRED";
};

export type TimePeriodRecord = {
  time_period_code: string;
  member_code: string;
  frequency_code: string;
  period_year: number;
  period_quarter?: number;
  period_month?: number;
  start_date: string;
  end_date: string;
  status: "ACTIVE" | "DRAFT" | "CLOSED" | "RETIRED";
  name: string;
};

export type DimensionUsage = {
  id: string;
  dimension_code: string;
  usage_area: string;
  dependency: string;
  record_count: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
};

export type DimensionRollupRule = {
  id: string;
  dimension_code: string;
  parent_member_code: string;
  parent_label: string;
  rule_code: string;
  entry_mode: "MANUAL" | "DERIVED" | "MANUAL_WITH_VALIDATION";
  aggregation_method: "SUM" | "AVG" | "WEIGHTED_AVG" | "MIN" | "MAX" | "NO_ROLLUP";
  measure_code: string;
  weight_measure_code?: string;
  validation_rule_code: string;
  children: { member_code: string; label: string; child_order: number; child_weight?: string }[];
  status: "ACTIVE" | "DRAFT" | "RETIRED";
};

export const dimensionDefinitions: DimensionDefinition[] = [
  {
    dimension_code: "GEOGRAPHY",
    dimension_type: "GEOGRAPHY",
    value_type: "TEXT",
    is_hierarchical: true,
    name: "Geography",
    description: "Country, State/UT, district, and other geography members used by templates and requests.",
    status: "ACTIVE",
    member_count: 42,
    set_count: 3,
    template_usage_count: 6,
  },
  {
    dimension_code: "TIME_PERIOD",
    dimension_type: "TIME",
    value_type: "TEXT",
    is_hierarchical: false,
    name: "Time period",
    description: "Annual, quarterly, and monthly reporting/reference periods.",
    status: "ACTIVE",
    member_count: 75,
    set_count: 2,
    template_usage_count: 5,
  },
  {
    dimension_code: "AREA_TYPE",
    dimension_type: "GENERAL",
    value_type: "TEXT",
    is_hierarchical: true,
    name: "Area type",
    description: "Total, rural, and urban disaggregation members with governed Total rollup behavior.",
    status: "ACTIVE",
    member_count: 3,
    set_count: 2,
    template_usage_count: 4,
  },
  {
    dimension_code: "GENDER",
    dimension_type: "GENERAL",
    value_type: "TEXT",
    is_hierarchical: false,
    name: "Gender",
    description: "Female, male, and total gender disaggregation members.",
    status: "ACTIVE",
    member_count: 3,
    set_count: 1,
    template_usage_count: 3,
  },
];

export const dimensionMembers: DimensionMember[] = [
  { id: "IND", dimension_code: "GEOGRAPHY", member_code: "IND", external_code: "IND", name: "India", short_name: "India", sort_order: 10, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "KA", dimension_code: "GEOGRAPHY", member_code: "KA", parent_member_code: "IND", external_code: "29", name: "Karnataka", short_name: "Karnataka", sort_order: 20, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "TN", dimension_code: "GEOGRAPHY", member_code: "TN", parent_member_code: "IND", external_code: "33", name: "Tamil Nadu", short_name: "Tamil Nadu", sort_order: 30, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "MH", dimension_code: "GEOGRAPHY", member_code: "MH", parent_member_code: "IND", external_code: "27", name: "Maharashtra", short_name: "Maharashtra", sort_order: 40, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "KL", dimension_code: "GEOGRAPHY", member_code: "KL", parent_member_code: "IND", external_code: "32", name: "Kerala", short_name: "Kerala", sort_order: 50, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "BLR", dimension_code: "GEOGRAPHY", member_code: "BLR", parent_member_code: "KA", external_code: "572", name: "Bengaluru Urban", short_name: "Bengaluru", sort_order: 21, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "MYS", dimension_code: "GEOGRAPHY", member_code: "MYS", parent_member_code: "KA", external_code: "577", name: "Mysuru", short_name: "Mysuru", sort_order: 22, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "TIME_2011_12", dimension_code: "TIME_PERIOD", member_code: "TIME_2011_12", external_code: "2011-12", name: "2011-12", short_name: "2011-12", sort_order: 10, status: "ACTIVE", valid_from: "2011-04-01", valid_to: "2012-03-31" },
  { id: "TIME_2012_13", dimension_code: "TIME_PERIOD", member_code: "TIME_2012_13", external_code: "2012-13", name: "2012-13", short_name: "2012-13", sort_order: 20, status: "ACTIVE", valid_from: "2012-04-01", valid_to: "2013-03-31" },
  { id: "TIME_2025", dimension_code: "TIME_PERIOD", member_code: "TIME_2025", external_code: "2025", name: "2025", short_name: "2025", sort_order: 30, status: "ACTIVE", valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { id: "TOTAL", dimension_code: "AREA_TYPE", member_code: "TOTAL", external_code: "TOTAL", name: "Total", short_name: "Total", sort_order: 10, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "RURAL", dimension_code: "AREA_TYPE", member_code: "RURAL", parent_member_code: "TOTAL", external_code: "RURAL", name: "Rural", short_name: "Rural", sort_order: 20, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "URBAN", dimension_code: "AREA_TYPE", member_code: "URBAN", parent_member_code: "TOTAL", external_code: "URBAN", name: "Urban", short_name: "Urban", sort_order: 30, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "GENDER_TOTAL", dimension_code: "GENDER", member_code: "GENDER_TOTAL", external_code: "TOTAL", name: "Total", short_name: "Total", sort_order: 10, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "FEMALE", dimension_code: "GENDER", member_code: "FEMALE", external_code: "F", name: "Female", short_name: "Female", sort_order: 20, status: "ACTIVE", valid_from: "2025-04-01" },
  { id: "MALE", dimension_code: "GENDER", member_code: "MALE", external_code: "M", name: "Male", short_name: "Male", sort_order: 30, status: "ACTIVE", valid_from: "2025-04-01" },
];

export const dimensionMemberSets: DimensionMemberSet[] = [
  { id: "MOSPI_AREA_MASTER_SCOPE", dimension_code: "GEOGRAPHY", set_code: "MOSPI_AREA_MASTER_SCOPE", set_type: "TEMPLATE_SCOPE", name: "MoSPI Area Master Scope", member_count: 5, status: "ACTIVE" },
  { id: "STATE_COLLECTION_SCOPE", dimension_code: "GEOGRAPHY", set_code: "STATE_COLLECTION_SCOPE", set_type: "REQUEST_SCOPE", name: "State Collection Scope", member_count: 4, status: "ACTIVE" },
  { id: "AREA_TYPE_STANDARD", dimension_code: "AREA_TYPE", set_code: "AREA_TYPE_STANDARD", set_type: "TEMPLATE_SCOPE", name: "Area Type Standard", member_count: 3, status: "ACTIVE" },
  { id: "GENDER_STANDARD", dimension_code: "GENDER", set_code: "GENDER_STANDARD", set_type: "TEMPLATE_SCOPE", name: "Gender Standard", member_count: 3, status: "ACTIVE" },
  { id: "FY_STANDARD", dimension_code: "TIME_PERIOD", set_code: "FY_STANDARD", set_type: "REPORT_SCOPE", name: "Financial Year Standard", member_count: 3, status: "ACTIVE" },
];

export const geographyLevels: GeographyLevel[] = [
  { level_code: "COUNTRY", level_number: 1, name: "Country" },
  { level_code: "STATE_UT", level_number: 2, name: "State / UT" },
  { level_code: "DISTRICT", level_number: 3, name: "District" },
];

export const geographies: GeographyRecord[] = [
  { geography_code: "IND", member_code: "IND", level_code: "COUNTRY", iso_alpha2_code: "IN", iso_alpha3_code: "IND", name: "India", status: "ACTIVE" },
  { geography_code: "KA", member_code: "KA", level_code: "STATE_UT", parent_geography_code: "IND", name: "Karnataka", status: "ACTIVE" },
  { geography_code: "TN", member_code: "TN", level_code: "STATE_UT", parent_geography_code: "IND", name: "Tamil Nadu", status: "ACTIVE" },
  { geography_code: "MH", member_code: "MH", level_code: "STATE_UT", parent_geography_code: "IND", name: "Maharashtra", status: "ACTIVE" },
  { geography_code: "KL", member_code: "KL", level_code: "STATE_UT", parent_geography_code: "IND", name: "Kerala", status: "ACTIVE" },
  { geography_code: "BLR", member_code: "BLR", level_code: "DISTRICT", parent_geography_code: "KA", name: "Bengaluru Urban", status: "ACTIVE" },
  { geography_code: "MYS", member_code: "MYS", level_code: "DISTRICT", parent_geography_code: "KA", name: "Mysuru", status: "ACTIVE" },
];

export const timeFrequencies: TimeFrequency[] = [
  { frequency_code: "ANNUAL", name: "Annual", months_interval: 12, status: "ACTIVE" },
  { frequency_code: "QUARTERLY", name: "Quarterly", months_interval: 3, status: "ACTIVE" },
  { frequency_code: "MONTHLY", name: "Monthly", months_interval: 1, status: "ACTIVE" },
];

export const timePeriods: TimePeriodRecord[] = [
  { time_period_code: "TIME_2011_12", member_code: "TIME_2011_12", frequency_code: "ANNUAL", period_year: 2011, start_date: "2011-04-01", end_date: "2012-03-31", status: "ACTIVE", name: "2011-12" },
  { time_period_code: "TIME_2012_13", member_code: "TIME_2012_13", frequency_code: "ANNUAL", period_year: 2012, start_date: "2012-04-01", end_date: "2013-03-31", status: "ACTIVE", name: "2012-13" },
  { time_period_code: "TIME_2025", member_code: "TIME_2025", frequency_code: "ANNUAL", period_year: 2025, start_date: "2025-01-01", end_date: "2025-12-31", status: "ACTIVE", name: "2025" },
  { time_period_code: "TIME_2025_Q1", member_code: "TIME_2025_Q1", frequency_code: "QUARTERLY", period_year: 2025, period_quarter: 1, start_date: "2025-01-01", end_date: "2025-03-31", status: "ACTIVE", name: "2025 Q1" },
];

export const dimensionUsage: DimensionUsage[] = [
  { id: "TPL_GEO", dimension_code: "GEOGRAPHY", usage_area: "Templates", dependency: "Used as row axis in SDG NIF 1.2.1 state subgroup template", record_count: 1, risk: "MEDIUM" },
  { id: "REQ_GEO", dimension_code: "GEOGRAPHY", usage_area: "Requests", dependency: "Used in request item scope members", record_count: 4, risk: "MEDIUM" },
  { id: "TPL_AREA", dimension_code: "AREA_TYPE", usage_area: "Templates", dependency: "Used as column subgroup in data entry templates", record_count: 2, risk: "LOW" },
  { id: "TPL_GENDER", dimension_code: "GENDER", usage_area: "Templates", dependency: "Used as optional subgroup in generated grid templates", record_count: 1, risk: "LOW" },
  { id: "TPL_TIME", dimension_code: "TIME_PERIOD", usage_area: "Templates", dependency: "Used as merged year header in template designer", record_count: 3, risk: "MEDIUM" },
  { id: "DASH_TIME", dimension_code: "TIME_PERIOD", usage_area: "Dashboard", dependency: "Used for published trend and snapshot filtering", record_count: 4, risk: "LOW" },
];

export const dimensionRollupRules: DimensionRollupRule[] = [
  {
    id: "ROLLUP_SUBGROUP_LOCATION_TOTAL",
    dimension_code: "AREA_TYPE",
    parent_member_code: "TOTAL",
    parent_label: "Total",
    rule_code: "ROLLUP_SUBGROUP_LOCATION_TOTAL",
    entry_mode: "MANUAL_WITH_VALIDATION",
    aggregation_method: "SUM",
    measure_code: "INDICATOR_VALUE",
    validation_rule_code: "TOTAL_EQUALS_CHILD_SUM",
    status: "ACTIVE",
    children: [
      { member_code: "RURAL", label: "Rural", child_order: 1 },
      { member_code: "URBAN", label: "Urban", child_order: 2 },
    ],
  },
  {
    id: "ROLLUP_GENDER_TOTAL",
    dimension_code: "GENDER",
    parent_member_code: "GENDER_TOTAL",
    parent_label: "Total",
    rule_code: "ROLLUP_GENDER_TOTAL",
    entry_mode: "DERIVED",
    aggregation_method: "SUM",
    measure_code: "PERSON_COUNT",
    validation_rule_code: "TOTAL_EQUALS_CHILD_SUM",
    status: "DRAFT",
    children: [
      { member_code: "FEMALE", label: "Female", child_order: 1 },
      { member_code: "MALE", label: "Male", child_order: 2 },
    ],
  },
];
