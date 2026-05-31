export type SummaryCard = {
  code: string;
  label: string;
  value: number | string;
  tone: "blue" | "green" | "orange" | "purple" | "red";
  helper: string;
  endpoint: string;
};

export type PipelineStep = {
  code: string;
  label: string;
  count: number;
  status: "complete" | "active" | "pending";
};

export type UnitProgress = {
  unit_code: string;
  unit_name: string;
  required_count: number;
  requested_count: number;
  submitted_count: number;
  validated_count: number;
  in_review_count: number;
  approved_count: number;
  health_percent: number;
};

export type GoalProgress = {
  goal_code: string;
  goal_label: string;
  required_indicators: number;
  requested_indicators: number;
  submitted_indicators: number;
  approved_indicators: number;
  blocked_indicators: number;
};

export type ReviewQueueItem = {
  queue_code: string;
  review_level_label: string;
  pending_count: number;
  overdue_count: number;
};

export type PendingItem = {
  code: string;
  label: string;
  owner: string;
  severity: "action" | "warning" | "info";
};

export type OperationItem = {
  code: string;
  label: string;
  pending_count: number;
  upcoming_count: number;
};

export const summaryCards: SummaryCard[] = [
  {
    code: "ACTIVE_UNITS",
    label: "Active units",
    value: 42,
    tone: "green",
    helper: "Live units",
    endpoint: "GET /dashboard/units",
  },
  {
    code: "REQUESTS_SENT",
    label: "Requests",
    value: 128,
    tone: "blue",
    helper: "18 due",
    endpoint: "GET /dashboard/drilldown",
  },
  {
    code: "SUBMISSIONS",
    label: "Submissions",
    value: 91,
    tone: "green",
    helper: "7 drafts",
    endpoint: "GET /dashboard/pipeline-status",
  },
  {
    code: "VALIDATION",
    label: "Validation",
    value: 12,
    tone: "orange",
    helper: "Needs fix",
    endpoint: "GET /dashboard/pipeline-status",
  },
  {
    code: "REVIEW",
    label: "Review",
    value: 23,
    tone: "purple",
    helper: "Waiting",
    endpoint: "GET /dashboard/review-queue",
  },
  {
    code: "ALERTS",
    label: "Alerts",
    value: 9,
    tone: "red",
    helper: "Action",
    endpoint: "GET /dashboard/drilldown",
  },
];

export const pipelineSteps: PipelineStep[] = [
  { code: "REQUEST_SENT", label: "Request sent", count: 36, status: "complete" },
  { code: "SUBMITTED", label: "Submitted", count: 28, status: "complete" },
  { code: "VALIDATED", label: "Validated", count: 21, status: "complete" },
  { code: "IN_REVIEW", label: "In review", count: 14, status: "active" },
  { code: "PUBLISHED", label: "Published", count: 8, status: "pending" },
];

export const unitProgressRows: UnitProgress[] = [
  {
    unit_code: "MOSPI",
    unit_name: "MoSPI",
    required_count: 48,
    requested_count: 44,
    submitted_count: 39,
    validated_count: 31,
    in_review_count: 18,
    approved_count: 12,
    health_percent: 88,
  },
  {
    unit_code: "STATE_KA",
    unit_name: "Karnataka",
    required_count: 36,
    requested_count: 34,
    submitted_count: 31,
    validated_count: 27,
    in_review_count: 11,
    approved_count: 9,
    health_percent: 86,
  },
  {
    unit_code: "STATE_TN",
    unit_name: "Tamil Nadu",
    required_count: 36,
    requested_count: 34,
    submitted_count: 29,
    validated_count: 24,
    in_review_count: 9,
    approved_count: 7,
    health_percent: 81,
  },
  {
    unit_code: "STATE_MH",
    unit_name: "Maharashtra",
    required_count: 36,
    requested_count: 32,
    submitted_count: 24,
    validated_count: 20,
    in_review_count: 8,
    approved_count: 5,
    health_percent: 72,
  },
];

export const goalProgressRows: GoalProgress[] = [
  {
    goal_code: "GOAL_01",
    goal_label: "No Poverty",
    required_indicators: 28,
    requested_indicators: 22,
    submitted_indicators: 18,
    approved_indicators: 7,
    blocked_indicators: 2,
  },
  {
    goal_code: "GOAL_02",
    goal_label: "Zero Hunger",
    required_indicators: 31,
    requested_indicators: 26,
    submitted_indicators: 21,
    approved_indicators: 9,
    blocked_indicators: 1,
  },
  {
    goal_code: "GOAL_03",
    goal_label: "Good Health",
    required_indicators: 42,
    requested_indicators: 34,
    submitted_indicators: 29,
    approved_indicators: 11,
    blocked_indicators: 3,
  },
];

export const reviewQueueRows: ReviewQueueItem[] = [
  { queue_code: "LEVEL_1", review_level_label: "Level 1 review", pending_count: 12, overdue_count: 2 },
  { queue_code: "LEVEL_2", review_level_label: "Level 2 review", pending_count: 6, overdue_count: 1 },
  { queue_code: "CLARIFICATION", review_level_label: "Clarification", pending_count: 3, overdue_count: 0 },
  { queue_code: "READY", review_level_label: "Ready to publish", pending_count: 2, overdue_count: 0 },
];

export const pendingItems: PendingItem[] = [
  {
    code: "NIF_1_2_1",
    label: "NIF 1.2.1 validation fix pending",
    owner: "State Planning Unit",
    severity: "action",
  },
  {
    code: "REQ_SDG_NIF_2025_0001",
    label: "7 request assignments pending",
    owner: "MoSPI",
    severity: "warning",
  },
  {
    code: "INV_TEMP_ACCESS",
    label: "3 invitations expire soon",
    owner: "Invitation access",
    severity: "warning",
  },
  {
    code: "VAL_RUN_ERRORS",
    label: "1 validation run has errors",
    owner: "Validation",
    severity: "action",
  },
];

export const operationItems: OperationItem[] = [
  { code: "REMINDERS", label: "Reminders", pending_count: 4, upcoming_count: 3 },
  { code: "EMAILS", label: "Emails", pending_count: 0, upcoming_count: 12 },
  { code: "DRAFTS", label: "Drafts", pending_count: 3, upcoming_count: 0 },
  { code: "BACKUPS", label: "Backups", pending_count: 0, upcoming_count: 1 },
];
