export type ReviewTaskStatus = "READY" | "IN_REVIEW" | "WAITING_CLARIFICATION" | "APPROVED" | "REJECTED" | "SENT_BACK";
export type ReviewPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type ReviewActionType = "APPROVE" | "REJECT" | "SEND_BACK" | "REQUEST_CLARIFICATION";
export type ReviewActionStatus = "DRAFT" | "RECORDED" | "SUPERSEDED";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";

export type ReviewTaskSample = {
  task_code: string;
  request_code: string;
  item_code: string;
  submission_version_code: string;
  validation_run_code: string;
  template_instance_code: string;
  national_indicator_code: string;
  indicator_label: string;
  goal_path: string;
  target_path: string;
  source_organization_name: string;
  submitted_by: string;
  reviewer_name: string;
  review_level: number;
  max_review_level: number;
  priority: ReviewPriority;
  status: ReviewTaskStatus;
  assigned_at: string;
  due_date: string;
  validation_status: "PASSED" | "FAILED_WITH_WARNINGS" | "FAILED";
  validation_error_count: number;
  validation_warning_count: number;
};

export type ReviewActionSample = {
  action_code: string;
  task_code: string;
  action_type: ReviewActionType;
  action_status: ReviewActionStatus;
  actor_name: string;
  review_level: number;
  action_at: string;
  note: string;
};

export type ReviewApprovalSample = {
  approval_code: string;
  task_code: string;
  review_level: number;
  approver_role: string;
  approver_name: string;
  status: ApprovalStatus;
  decided_at: string;
  note: string;
};

export type ReviewContextTrailSample = {
  label: "Request" | "Data entry" | "Ingestion" | "Validation" | "Review" | "Dashboard";
  code: string;
  status: string;
  note: string;
};

export type ReviewCellDetailSample = {
  cell_address: string;
  geography_label: string;
  time_period: string;
  area_type: string;
  submitted_value: string;
  previous_approved_value: string;
  validation_rule: string;
  validation_message: string;
  reviewer_observation: string;
};

export const reviewTasks: ReviewTaskSample[] = [
  {
    task_code: "REVTASK_REQ_SDG_NIF_2025_0002_L1",
    request_code: "REQ_SDG_NIF_2025_0002",
    item_code: "REQITEM_NIF_1_2_1_2025_STATE",
    submission_version_code: "SUBVER_REQ_SDG_NIF_2025_0002_V1",
    validation_run_code: "VALRUN_REQ_SDG_NIF_2025_0002_V1",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0002_NIF_1_2_1",
    national_indicator_code: "NIF_1_2_1",
    indicator_label: "Population below poverty line",
    goal_path: "Goal 1: No Poverty",
    target_path: "Target 1.2: Reduce poverty",
    source_organization_name: "State Planning Unit",
    submitted_by: "State Reviewer",
    reviewer_name: "SDG Unit Reviewer",
    review_level: 1,
    max_review_level: 2,
    priority: "HIGH",
    status: "READY",
    assigned_at: "2026-05-30 11:30",
    due_date: "2026-06-05",
    validation_status: "PASSED",
    validation_error_count: 0,
    validation_warning_count: 0,
  },
  {
    task_code: "REVTASK_REQ_SDG_NIF_2025_0001_L1",
    request_code: "REQ_SDG_NIF_2025_0001",
    item_code: "REQITEM_NIF_1_2_1_2025",
    submission_version_code: "SUBVER_SUB_REQ_SDG_NIF_2025_0001_V1_V2",
    validation_run_code: "VALRUN_REQ_SDG_NIF_2025_0001_V1",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0001_NIF_1_2_1",
    national_indicator_code: "NIF_1_2_1",
    indicator_label: "Population below poverty line",
    goal_path: "Goal 1: No Poverty",
    target_path: "Target 1.2: Reduce poverty",
    source_organization_name: "Social Statistics Division",
    submitted_by: "SSD Demo Officer",
    reviewer_name: "SDG Unit Reviewer",
    review_level: 1,
    max_review_level: 2,
    priority: "NORMAL",
    status: "WAITING_CLARIFICATION",
    assigned_at: "2026-05-29 14:30",
    due_date: "2026-06-03",
    validation_status: "FAILED_WITH_WARNINGS",
    validation_error_count: 1,
    validation_warning_count: 1,
  },
  {
    task_code: "REVTASK_REQ_HEALTH_2025_0001_L1",
    request_code: "REQ_HEALTH_2025_0001",
    item_code: "REQITEM_NIF_3_8_1_2025",
    submission_version_code: "SUBVER_REQ_HEALTH_2025_0001_V1",
    validation_run_code: "VALRUN_REQ_HEALTH_2025_0001_V1",
    template_instance_code: "TPLINST_REQ_HEALTH_2025_0001_NIF_3_8_1",
    national_indicator_code: "NIF_3_8_1",
    indicator_label: "Coverage of essential health services",
    goal_path: "Goal 3: Good Health and Well-being",
    target_path: "Target 3.8: Universal health coverage",
    source_organization_name: "Health Statistics Unit",
    submitted_by: "Health Data Officer",
    reviewer_name: "Health Unit Reviewer",
    review_level: 1,
    max_review_level: 3,
    priority: "NORMAL",
    status: "IN_REVIEW",
    assigned_at: "2026-05-31 09:20",
    due_date: "2026-06-07",
    validation_status: "PASSED",
    validation_error_count: 0,
    validation_warning_count: 2,
  },
];

export const reviewActions: ReviewActionSample[] = [
  {
    action_code: "REVACT_REQ_SDG_NIF_2025_0001_CLARIFY",
    task_code: "REVTASK_REQ_SDG_NIF_2025_0001_L1",
    action_type: "REQUEST_CLARIFICATION",
    action_status: "RECORDED",
    actor_name: "SDG Unit Reviewer",
    review_level: 1,
    action_at: "2026-05-29 15:10",
    note: "Required Tamil Nadu value was missing. Source department asked to clarify or correct.",
  },
  {
    action_code: "REVACT_REQ_SDG_NIF_2025_0002_OPENED",
    task_code: "REVTASK_REQ_SDG_NIF_2025_0002_L1",
    action_type: "REQUEST_CLARIFICATION",
    action_status: "DRAFT",
    actor_name: "SDG Unit Reviewer",
    review_level: 1,
    action_at: "Not recorded",
    note: "No decision recorded yet.",
  },
];

export const reviewApprovals: ReviewApprovalSample[] = [
  {
    approval_code: "REVAPP_REQ_SDG_NIF_2025_0002_L1",
    task_code: "REVTASK_REQ_SDG_NIF_2025_0002_L1",
    review_level: 1,
    approver_role: "Unit reviewer",
    approver_name: "SDG Unit Reviewer",
    status: "PENDING",
    decided_at: "Pending",
    note: "Awaiting level 1 review decision.",
  },
  {
    approval_code: "REVAPP_REQ_SDG_NIF_2025_0002_L2",
    task_code: "REVTASK_REQ_SDG_NIF_2025_0002_L1",
    review_level: 2,
    approver_role: "Approving authority",
    approver_name: "SDG Approver",
    status: "PENDING",
    decided_at: "Blocked until Level 1",
    note: "Dynamic review depth is derived by unit configuration.",
  },
  {
    approval_code: "REVAPP_REQ_SDG_NIF_2025_0001_L1",
    task_code: "REVTASK_REQ_SDG_NIF_2025_0001_L1",
    review_level: 1,
    approver_role: "Unit reviewer",
    approver_name: "SDG Unit Reviewer",
    status: "PENDING",
    decided_at: "Pending source clarification",
    note: "Clarification requested before decision.",
  },
];

export const reviewContextTrail: ReviewContextTrailSample[] = [
  { label: "Request", code: "REQ_SDG_NIF_2025_0002", status: "SENT", note: "Collection request issued to source organization" },
  { label: "Data entry", code: "TPLINST_REQ_SDG_NIF_2025_0002_NIF_1_2_1", status: "SUBMITTED", note: "Department submitted governed template values" },
  { label: "Ingestion", code: "SUBVER_REQ_SDG_NIF_2025_0002_V1", status: "RECEIVED", note: "Submission version and manifest created" },
  { label: "Validation", code: "VALRUN_REQ_SDG_NIF_2025_0002_V1", status: "PASSED", note: "Validation completed with no blockers" },
  { label: "Review", code: "REVTASK_REQ_SDG_NIF_2025_0002_L1", status: "READY", note: "Task is ready for reviewer decision" },
  { label: "Dashboard", code: "DASH_SNAPSHOT_NIF_1_2_1", status: "BLOCKED_UNTIL_APPROVED", note: "Snapshot appears after final approval" },
];

export const reviewCellDetail: ReviewCellDetailSample = {
  cell_address: "B4",
  geography_label: "Karnataka",
  time_period: "2011-12",
  area_type: "Total",
  submitted_value: "28.4",
  previous_approved_value: "27.9",
  validation_rule: "NUMERIC_NON_NEGATIVE",
  validation_message: "Value passed validation. Previous approved value is available for context.",
  reviewer_observation: "Trend looks consistent with previous approved snapshot.",
};
