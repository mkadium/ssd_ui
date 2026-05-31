export type ValidationQueueStatus = "PENDING" | "COMPLETED" | "FAILED" | "READY_FOR_REVIEW";
export type ValidationSeverity = "INFO" | "WARNING" | "ERROR" | "BLOCKER";
export type ValidationResultStatus = "PASS" | "WARNING" | "FAIL";

export type ValidationQueueItemSample = {
  validation_run_code: string;
  request_code: string;
  item_code: string;
  submission_code: string;
  submission_version_code: string;
  template_instance_code: string;
  national_indicator_code: string;
  indicator_label: string;
  goal_path: string;
  target_path: string;
  source_organization_name: string;
  submitted_by: string;
  submitted_to: string;
  received_at: string;
  status: ValidationQueueStatus;
  record_count: number;
  passed_count: number;
  warning_count: number;
  error_count: number;
  blocker_count: number;
};

export type ValidationResultSample = {
  result_code: string;
  validation_run_code: string;
  record_code: string;
  cell_address: string;
  geography_label: string;
  time_period: string;
  area_type: string;
  rule_code: string;
  severity: ValidationSeverity;
  status: ValidationResultStatus;
  message: string;
  comparison_type: "PREVIOUS_APPROVED" | "NO_REFERENCE" | "THRESHOLD" | "NONE";
  suggested_action: string;
};

export type ValidationTrailStepSample = {
  label: string;
  code: string;
  status: string;
};

export const validationQueueItems: ValidationQueueItemSample[] = [
  {
    validation_run_code: "VALRUN_REQ_SDG_NIF_2025_0001_V1",
    request_code: "REQ_SDG_NIF_2025_0001",
    item_code: "REQITEM_NIF_1_2_1_2025",
    submission_code: "SUB_REQ_SDG_NIF_2025_0001_V1",
    submission_version_code: "SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0001_NIF_1_2_1",
    national_indicator_code: "NIF_1_2_1",
    indicator_label: "Population below poverty line",
    goal_path: "Goal 1: No Poverty",
    target_path: "Target 1.2: Reduce poverty",
    source_organization_name: "Social Statistics Division",
    submitted_by: "SSD Demo Officer",
    submitted_to: "SDG Unit Reviewer",
    received_at: "2026-05-29 13:55",
    status: "FAILED",
    record_count: 36,
    passed_count: 34,
    warning_count: 1,
    error_count: 1,
    blocker_count: 0,
  },
  {
    validation_run_code: "VALRUN_REQ_SDG_NIF_2025_0002_V1",
    request_code: "REQ_SDG_NIF_2025_0002",
    item_code: "REQITEM_NIF_1_2_1_2025_STATE",
    submission_code: "SUB_REQ_SDG_NIF_2025_0002_V1",
    submission_version_code: "SUBVER_REQ_SDG_NIF_2025_0002_V1",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0002_NIF_1_2_1",
    national_indicator_code: "NIF_1_2_1",
    indicator_label: "Population below poverty line",
    goal_path: "Goal 1: No Poverty",
    target_path: "Target 1.2: Reduce poverty",
    source_organization_name: "State Planning Unit",
    submitted_by: "State Reviewer",
    submitted_to: "SDG Unit Reviewer",
    received_at: "2026-05-30 11:15",
    status: "READY_FOR_REVIEW",
    record_count: 72,
    passed_count: 72,
    warning_count: 0,
    error_count: 0,
    blocker_count: 0,
  },
  {
    validation_run_code: "VALRUN_REQ_HEALTH_2025_0001_V1",
    request_code: "REQ_HEALTH_2025_0001",
    item_code: "REQITEM_NIF_3_8_1_2025",
    submission_code: "SUB_REQ_HEALTH_2025_0001_V1",
    submission_version_code: "SUBVER_REQ_HEALTH_2025_0001_V1",
    template_instance_code: "TPLINST_REQ_HEALTH_2025_0001_NIF_3_8_1",
    national_indicator_code: "NIF_3_8_1",
    indicator_label: "Coverage of essential health services",
    goal_path: "Goal 3: Good Health and Well-being",
    target_path: "Target 3.8: Universal health coverage",
    source_organization_name: "Health Statistics Unit",
    submitted_by: "Health Data Officer",
    submitted_to: "Health Unit Reviewer",
    received_at: "Waiting",
    status: "PENDING",
    record_count: 0,
    passed_count: 0,
    warning_count: 0,
    error_count: 0,
    blocker_count: 0,
  },
];

export const validationResults: ValidationResultSample[] = [
  {
    validation_run_code: "VALRUN_REQ_SDG_NIF_2025_0001_V1",
    result_code: "VALRES_REQ_SDG_NIF_2025_TOTAL_NON_NEGATIVE",
    record_code: "STG_REQ_SDG_NIF_2025_0001_TN_TOTAL",
    cell_address: "B5",
    geography_label: "Tamil Nadu",
    time_period: "2011-12",
    area_type: "Total",
    rule_code: "REQUIRED_WHEN_REQUESTED",
    severity: "ERROR",
    status: "FAIL",
    message: "Missing required numeric value for Tamil Nadu, 2011-12, Total.",
    comparison_type: "NO_REFERENCE",
    suggested_action: "Return to data entry or request source clarification before review.",
  },
  {
    validation_run_code: "VALRUN_REQ_SDG_NIF_2025_0001_V1",
    result_code: "VALRES_REQ_SDG_NIF_2025_KA_RURAL_VARIANCE",
    record_code: "STG_REQ_SDG_NIF_2025_0001_KA_RURAL",
    cell_address: "C4",
    geography_label: "Karnataka",
    time_period: "2011-12",
    area_type: "Rural",
    rule_code: "PREVIOUS_PERIOD_VARIANCE",
    severity: "WARNING",
    status: "WARNING",
    message: "Value differs from expected range compared with previous approved value.",
    comparison_type: "PREVIOUS_APPROVED",
    suggested_action: "Reviewer should inspect comparison evidence before approval.",
  },
  {
    validation_run_code: "VALRUN_REQ_SDG_NIF_2025_0001_V1",
    result_code: "VALRES_REQ_SDG_NIF_2025_KA_TOTAL_PASS",
    record_code: "STG_REQ_SDG_NIF_2025_0001_KA_TOTAL",
    cell_address: "B4",
    geography_label: "Karnataka",
    time_period: "2011-12",
    area_type: "Total",
    rule_code: "NUMERIC_NON_NEGATIVE",
    severity: "INFO",
    status: "PASS",
    message: "Value 28.4 is valid.",
    comparison_type: "NONE",
    suggested_action: "No action required.",
  },
  {
    validation_run_code: "VALRUN_REQ_SDG_NIF_2025_0002_V1",
    result_code: "VALRES_REQ_SDG_NIF_2025_0002_ALL_PASS",
    record_code: "STG_REQ_SDG_NIF_2025_0002_SUMMARY",
    cell_address: "Summary",
    geography_label: "All selected states",
    time_period: "2025",
    area_type: "All",
    rule_code: "VALIDATION_SUMMARY",
    severity: "INFO",
    status: "PASS",
    message: "All staged records passed validation.",
    comparison_type: "NONE",
    suggested_action: "Continue to review.",
  },
];

export const validationTrailSteps: ValidationTrailStepSample[] = [
  { label: "Request", code: "REQ_SDG_NIF_2025_0001", status: "SENT" },
  { label: "Data entry", code: "TPLINST_REQ_SDG_NIF_2025_0001_NIF_1_2_1", status: "SUBMITTED" },
  { label: "Ingestion", code: "SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2", status: "RECEIVED" },
  { label: "Validation", code: "VALRUN_REQ_SDG_NIF_2025_0001_V1", status: "FAILED" },
  { label: "Review", code: "REV_REQ_SDG_NIF_2025_0001", status: "BLOCKED" },
];
