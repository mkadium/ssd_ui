export type UnitSummaryCard = {
  code: string;
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "green" | "orange" | "purple" | "red";
};

export type GoalStatus = {
  goal_code: string;
  goal_label: string;
  required_indicators: number;
  requested_indicators: number;
  submitted_indicators: number;
  approved_indicators: number;
  pending_indicators: number;
};

export type TargetStatus = {
  target_code: string;
  target_label: string;
  goal_code: string;
  required_indicators: number;
  requested_indicators: number;
  submitted_indicators: number;
  validation_errors: number;
  review_pending: number;
};

export type IndicatorStatus = {
  indicator_code: string;
  indicator_label: string;
  goal_code: string;
  target_code: string;
  request_code: string;
  template_version_code: string;
  required: boolean;
  request_status: string;
  submission_status: string;
  validation_status: string;
  review_status: string;
  due_date: string;
};

export const unitSummaryCards: UnitSummaryCard[] = [
  {
    code: "REQUIRED_INDICATORS",
    label: "Required indicators",
    value: "36",
    helper: "Across 4 goals",
    tone: "blue",
  },
  {
    code: "REQUESTED_INDICATORS",
    label: "Requested",
    value: "32",
    helper: "4 pending request",
    tone: "purple",
  },
  {
    code: "SUBMITTED_INDICATORS",
    label: "Submitted",
    value: "28",
    helper: "87% completion",
    tone: "green",
  },
  {
    code: "VALIDATION_ISSUES",
    label: "Validation issues",
    value: "5",
    helper: "2 blocking",
    tone: "orange",
  },
  {
    code: "REVIEW_PENDING",
    label: "Review pending",
    value: "9",
    helper: "3 overdue",
    tone: "red",
  },
];

export const goalStatusRows: GoalStatus[] = [
  {
    goal_code: "GOAL_01",
    goal_label: "No Poverty",
    required_indicators: 10,
    requested_indicators: 9,
    submitted_indicators: 8,
    approved_indicators: 5,
    pending_indicators: 3,
  },
  {
    goal_code: "GOAL_02",
    goal_label: "Zero Hunger",
    required_indicators: 8,
    requested_indicators: 7,
    submitted_indicators: 6,
    approved_indicators: 4,
    pending_indicators: 2,
  },
  {
    goal_code: "GOAL_03",
    goal_label: "Good Health",
    required_indicators: 12,
    requested_indicators: 11,
    submitted_indicators: 10,
    approved_indicators: 7,
    pending_indicators: 3,
  },
  {
    goal_code: "GOAL_04",
    goal_label: "Quality Education",
    required_indicators: 6,
    requested_indicators: 5,
    submitted_indicators: 4,
    approved_indicators: 2,
    pending_indicators: 2,
  },
];

export const targetStatusRows: TargetStatus[] = [
  {
    target_code: "TARGET_1_2",
    target_label: "Reduce poverty",
    goal_code: "GOAL_01",
    required_indicators: 4,
    requested_indicators: 4,
    submitted_indicators: 3,
    validation_errors: 1,
    review_pending: 1,
  },
  {
    target_code: "TARGET_2_1",
    target_label: "Food access",
    goal_code: "GOAL_02",
    required_indicators: 3,
    requested_indicators: 3,
    submitted_indicators: 3,
    validation_errors: 0,
    review_pending: 2,
  },
  {
    target_code: "TARGET_3_8",
    target_label: "Health coverage",
    goal_code: "GOAL_03",
    required_indicators: 5,
    requested_indicators: 4,
    submitted_indicators: 4,
    validation_errors: 1,
    review_pending: 2,
  },
  {
    target_code: "TARGET_4_1",
    target_label: "School completion",
    goal_code: "GOAL_04",
    required_indicators: 2,
    requested_indicators: 2,
    submitted_indicators: 1,
    validation_errors: 1,
    review_pending: 1,
  },
];

export const indicatorStatusRows: IndicatorStatus[] = [
  {
    indicator_code: "NIF_1_2_1",
    indicator_label: "Population below poverty line",
    goal_code: "GOAL_01",
    target_code: "TARGET_1_2",
    request_code: "REQ_SDG_NIF_2025_0001",
    template_version_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP_V1",
    required: true,
    request_status: "SENT",
    submission_status: "RECEIVED",
    validation_status: "HAS_ERRORS",
    review_status: "BLOCKED",
    due_date: "2025-06-30",
  },
  {
    indicator_code: "NIF_2_1_1",
    indicator_label: "Prevalence of undernourishment",
    goal_code: "GOAL_02",
    target_code: "TARGET_2_1",
    request_code: "REQ_SDG_NIF_2025_0002",
    template_version_code: "TPL_SDG_NIF_2_1_1_STATE_SUBGROUP_V1",
    required: true,
    request_status: "SENT",
    submission_status: "SUBMITTED",
    validation_status: "PASSED",
    review_status: "IN_REVIEW",
    due_date: "2025-06-30",
  },
  {
    indicator_code: "NIF_3_8_1",
    indicator_label: "Essential health service coverage",
    goal_code: "GOAL_03",
    target_code: "TARGET_3_8",
    request_code: "REQ_SDG_NIF_2025_0003",
    template_version_code: "TPL_SDG_NIF_3_8_1_STATE_SUBGROUP_V1",
    required: true,
    request_status: "SENT",
    submission_status: "DRAFT",
    validation_status: "NOT_RUN",
    review_status: "NOT_STARTED",
    due_date: "2025-07-05",
  },
  {
    indicator_code: "NIF_4_1_1",
    indicator_label: "School completion rate",
    goal_code: "GOAL_04",
    target_code: "TARGET_4_1",
    request_code: "REQ_SDG_NIF_2025_0004",
    template_version_code: "TPL_SDG_NIF_4_1_1_STATE_SUBGROUP_V1",
    required: true,
    request_status: "PENDING",
    submission_status: "NOT_SENT",
    validation_status: "NOT_RUN",
    review_status: "NOT_STARTED",
    due_date: "2025-07-10",
  },
];
