export type DataEntryAssignmentStatus = "ASSIGNED" | "IN_PROGRESS" | "DRAFT_SAVED" | "VALIDATION_FAILED" | "READY_TO_SUBMIT" | "SUBMITTED";
export type DataEntryCellStatus = "DRAFT" | "MISSING" | "VALID" | "WARNING";
export type DataEntryActionStatus = "DONE" | "PENDING" | "BLOCKED";

export type DataEntryAssignmentSample = {
  assignment_code: string;
  request_code: string;
  item_code: string;
  template_instance_code: string;
  template_version_code: string;
  national_indicator_code: string;
  indicator_label: string;
  source_organization_name: string;
  officer_name: string;
  due_date: string;
  status: DataEntryAssignmentStatus;
  completion_label: string;
  issue_count: number;
  last_saved_at: string;
};

export type DataEntryGridRowSample = {
  row_number: number;
  geography_code: string;
  geography_label: string;
  values: Record<string, string>;
  status: DataEntryCellStatus;
};

export type DataEntrySelectedCellSample = {
  address: string;
  value: string;
  row_label: string;
  time_period: string;
  area_type: string;
  gender?: string;
  measure_code: string;
  value_type: "NUMERIC" | "TEXT";
  unit_code: string;
  required: boolean;
  validation_profile_code: string;
  comment: string;
};

export type DataEntryValidationHintSample = {
  rule_code: string;
  severity: "INFO" | "WARNING" | "ERROR";
  message: string;
};

export type DataEntryWorkflowStepSample = {
  label: string;
  status: DataEntryActionStatus;
};

export const dataEntryAssignments: DataEntryAssignmentSample[] = [
  {
    assignment_code: "ASN_REQ_SDG_NIF_2025_0001_PROVIDER",
    request_code: "REQ_SDG_NIF_2025_0001",
    item_code: "REQITEM_NIF_1_2_1_2025",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0001_NIF_1_2_1",
    template_version_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP_V1",
    national_indicator_code: "NIF_1_2_1",
    indicator_label: "Population below poverty line",
    source_organization_name: "Social Statistics Division",
    officer_name: "SSD Demo Officer",
    due_date: "2025-06-30",
    status: "IN_PROGRESS",
    completion_label: "32 / 36 cells",
    issue_count: 1,
    last_saved_at: "2026-05-31 10:42",
  },
  {
    assignment_code: "ASN_REQ_SDG_NIF_2025_0002_OWNER",
    request_code: "REQ_SDG_NIF_2025_0002",
    item_code: "REQITEM_NIF_1_2_1_2025_STATE",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0002_NIF_1_2_1",
    template_version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1",
    national_indicator_code: "NIF_1_2_1",
    indicator_label: "Population below poverty line",
    source_organization_name: "State Planning Unit",
    officer_name: "State Reviewer",
    due_date: "2025-07-15",
    status: "ASSIGNED",
    completion_label: "0 / 72 cells",
    issue_count: 0,
    last_saved_at: "Not started",
  },
];

export const dataEntryGridRows: DataEntryGridRowSample[] = [
  {
    row_number: 1,
    geography_code: "KA",
    geography_label: "Karnataka",
    values: { total_2011: "28.4", rural_2011: "18.1", urban_2011: "10.3", total_2012: "26.7", rural_2012: "17.2", urban_2012: "9.5" },
    status: "DRAFT",
  },
  {
    row_number: 2,
    geography_code: "TN",
    geography_label: "Tamil Nadu",
    values: { total_2011: "", rural_2011: "14.9", urban_2011: "8.6", total_2012: "24.1", rural_2012: "13.0", urban_2012: "8.0" },
    status: "MISSING",
  },
  {
    row_number: 3,
    geography_code: "MH",
    geography_label: "Maharashtra",
    values: { total_2011: "21.0", rural_2011: "12.2", urban_2011: "7.8", total_2012: "19.8", rural_2012: "11.5", urban_2012: "7.1" },
    status: "DRAFT",
  },
  {
    row_number: 4,
    geography_code: "KL",
    geography_label: "Kerala",
    values: { total_2011: "9.1", rural_2011: "5.2", urban_2011: "3.2", total_2012: "8.3", rural_2012: "4.8", urban_2012: "3.0" },
    status: "VALID",
  },
  {
    row_number: 5,
    geography_code: "AP",
    geography_label: "Andhra Pradesh",
    values: { total_2011: "", rural_2011: "", urban_2011: "", total_2012: "", rural_2012: "", urban_2012: "" },
    status: "WARNING",
  },
];

export const dataEntrySelectedCell: DataEntrySelectedCellSample = {
  address: "B5",
  value: "",
  row_label: "Tamil Nadu",
  time_period: "2011-12",
  area_type: "Total",
  measure_code: "INDICATOR_VALUE",
  value_type: "NUMERIC",
  unit_code: "PERCENT",
  required: true,
  validation_profile_code: "NUMERIC_NON_NEGATIVE",
  comment: "Optional note for missing value or source clarification.",
};

export const dataEntryValidationHints: DataEntryValidationHintSample[] = [
  { rule_code: "REQUIRED_WHEN_REQUESTED", severity: "ERROR", message: "Tamil Nadu / 2011-12 / Total is required before submit." },
  { rule_code: "NUMERIC_NON_NEGATIVE", severity: "INFO", message: "Use a numeric value greater than or equal to zero." },
  { rule_code: "DECIMAL_PLACES_2", severity: "WARNING", message: "Use up to two decimal places for percentage values." },
];

export const dataEntryWorkflowSteps: DataEntryWorkflowStepSample[] = [
  { label: "Assigned", status: "DONE" },
  { label: "Fill template", status: "PENDING" },
  { label: "Add note/comment", status: "PENDING" },
  { label: "Validate", status: "BLOCKED" },
  { label: "Preview submit", status: "BLOCKED" },
  { label: "Submit", status: "BLOCKED" },
];
