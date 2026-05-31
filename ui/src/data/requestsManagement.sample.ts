export type CycleStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED" | "CANCELLED";
export type RequestStatus = "DRAFT" | "READY" | "SENT" | "OPEN" | "IN_PROGRESS" | "SUBMITTED" | "CLOSED" | "CANCELLED" | "EXPIRED";
export type AssignmentStatus = "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EXPIRED";

export type CollectionCycleSample = {
  cycle_code: string;
  cycle_type: "REGULAR" | "BACKFILL" | "REVISION" | "CORRECTION";
  reporting_year: number;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  framework_code: string;
  edition_code: string;
  unit_code: string;
  name: string;
  request_count: number;
  submitted_count: number;
};

export type CollectionRequestSample = {
  request_code: string;
  cycle_code: string;
  request_type: "NEW_DATA" | "BACKFILL" | "CORRECTION" | "REVISION";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: RequestStatus;
  source_organization_code: string;
  source_organization_name: string;
  officer_code: string;
  officer_name: string;
  assigned_unit_code: string;
  due_date: string;
  sent_at?: string;
  first_opened_at?: string;
  submitted_at?: string;
  item_count: number;
  assignment_count: number;
};

export type RequestItemSample = {
  request_code: string;
  item_code: string;
  national_indicator_code: string;
  indicator_version_code: string;
  template_code: string;
  template_version_code: string;
  source_assignment_code: string;
  status: RequestStatus;
  due_date: string;
  indicator_label: string;
};

export type RequestScopeMemberSample = {
  item_code: string;
  axis_code: string;
  axis_role: "ROW" | "COLUMN" | "PAGE" | "CONTEXT";
  dimension_code: string;
  member_code: string;
  member_label: string;
  scope_role: "REQUESTED" | "OPTIONAL" | "CONTEXT" | "FIXED";
  source_type: "SSD_SELECTED" | "TEMPLATE_FIXED" | "CONTRIBUTOR_SELECTED" | "SYSTEM_DERIVED";
  is_required: boolean;
};

export type TemplateInstanceSample = {
  item_code: string;
  template_instance_code: string;
  template_code: string;
  template_version_code: string;
  instance_status: "DRAFT" | "ACTIVE" | "LOCKED" | "CANCELLED" | "EXPIRED";
  render_contract_version: string;
  generated_at: string;
};

export type RequestAssignmentSample = {
  assignment_code: string;
  request_code: string;
  item_code?: string;
  assignment_role: "DATA_PROVIDER" | "REQUEST_OWNER" | "OBSERVER";
  assigned_to_organization_code: string;
  assigned_to_officer_code: string;
  officer_name: string;
  status: AssignmentStatus;
  due_date: string;
  assigned_at: string;
  accepted_at?: string;
  completed_at?: string;
};

export type RequestStatusTrailSample = {
  stage: "Request" | "Data entry" | "Ingestion" | "Validation" | "Review" | "Dashboard";
  status: string;
  code: string;
  timestamp: string;
  action: string;
};

export const collectionCycles: CollectionCycleSample[] = [
  {
    cycle_code: "CYCLE_SDG_NIF_2025_DEMO",
    cycle_type: "REGULAR",
    reporting_year: 2025,
    start_date: "2025-04-01",
    end_date: "2026-03-31",
    status: "ACTIVE",
    framework_code: "SDG_NIF",
    edition_code: "SDG_NIF_2025",
    unit_code: "SDG",
    name: "SDG NIF 2025 Demo Collection Cycle",
    request_count: 3,
    submitted_count: 1,
  },
  {
    cycle_code: "CYCLE_SDG_NIF_2026_DRAFT",
    cycle_type: "REGULAR",
    reporting_year: 2026,
    start_date: "2026-04-01",
    end_date: "2027-03-31",
    status: "DRAFT",
    framework_code: "SDG_NIF",
    edition_code: "SDG_NIF_2025",
    unit_code: "SDG",
    name: "SDG NIF 2026 Draft Collection Cycle",
    request_count: 0,
    submitted_count: 0,
  },
];

export const collectionRequests: CollectionRequestSample[] = [
  {
    request_code: "REQ_SDG_NIF_2025_0001",
    cycle_code: "CYCLE_SDG_NIF_2025_DEMO",
    request_type: "NEW_DATA",
    priority: "NORMAL",
    status: "SENT",
    source_organization_code: "SSD_DEMO_SOURCE",
    source_organization_name: "Social Statistics Division",
    officer_code: "SSD_DEMO_OFFICER",
    officer_name: "SSD Demo Officer",
    assigned_unit_code: "SDG",
    due_date: "2025-06-30",
    sent_at: "2026-05-29 08:22",
    item_count: 1,
    assignment_count: 1,
  },
  {
    request_code: "REQ_SDG_NIF_2025_0002",
    cycle_code: "CYCLE_SDG_NIF_2025_DEMO",
    request_type: "NEW_DATA",
    priority: "HIGH",
    status: "READY",
    source_organization_code: "STATE_UNIT",
    source_organization_name: "State Planning Unit",
    officer_code: "STATE_REVIEWER",
    officer_name: "State Reviewer",
    assigned_unit_code: "SDG",
    due_date: "2025-07-15",
    item_count: 2,
    assignment_count: 2,
  },
  {
    request_code: "REQ_SDG_NIF_2025_0003",
    cycle_code: "CYCLE_SDG_NIF_2025_DEMO",
    request_type: "REVISION",
    priority: "NORMAL",
    status: "DRAFT",
    source_organization_code: "MOA",
    source_organization_name: "Agriculture",
    officer_code: "MOA_OFFICER",
    officer_name: "MOA Data Officer",
    assigned_unit_code: "SDG",
    due_date: "2025-08-01",
    item_count: 1,
    assignment_count: 0,
  },
];

export const requestItems: RequestItemSample[] = [
  {
    request_code: "REQ_SDG_NIF_2025_0001",
    item_code: "REQITEM_NIF_1_2_1_2025",
    national_indicator_code: "NIF_1_2_1",
    indicator_version_code: "NIF_1_2_1_V1",
    template_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP",
    template_version_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP_V1",
    source_assignment_code: "SRC_NIF_1_2_1_SSD_PRIMARY",
    status: "SENT",
    due_date: "2025-06-30",
    indicator_label: "Population below poverty line",
  },
  {
    request_code: "REQ_SDG_NIF_2025_0002",
    item_code: "REQITEM_NIF_1_2_1_2025_STATE",
    national_indicator_code: "NIF_1_2_1",
    indicator_version_code: "NIF_1_2_1_V1",
    template_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT",
    template_version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1",
    source_assignment_code: "SRC_NIF_1_2_1_STATE_REVIEW",
    status: "READY",
    due_date: "2025-07-15",
    indicator_label: "Population below poverty line",
  },
];

export const requestScopeMembers: RequestScopeMemberSample[] = [
  { item_code: "REQITEM_NIF_1_2_1_2025", axis_code: "AXIS_GEOGRAPHY_ROWS", axis_role: "ROW", dimension_code: "GEOGRAPHY", member_code: "IND", member_label: "India", scope_role: "REQUESTED", source_type: "SSD_SELECTED", is_required: true },
  { item_code: "REQITEM_NIF_1_2_1_2025", axis_code: "AXIS_GEOGRAPHY_ROWS", axis_role: "ROW", dimension_code: "GEOGRAPHY", member_code: "KA", member_label: "Karnataka", scope_role: "REQUESTED", source_type: "SSD_SELECTED", is_required: true },
  { item_code: "REQITEM_NIF_1_2_1_2025", axis_code: "AXIS_GEOGRAPHY_ROWS", axis_role: "ROW", dimension_code: "GEOGRAPHY", member_code: "TN", member_label: "Tamil Nadu", scope_role: "REQUESTED", source_type: "SSD_SELECTED", is_required: true },
  { item_code: "REQITEM_NIF_1_2_1_2025", axis_code: "AXIS_TIME_PERIOD_CONTEXT", axis_role: "CONTEXT", dimension_code: "TIME_PERIOD", member_code: "TIME_2025", member_label: "2025", scope_role: "CONTEXT", source_type: "SSD_SELECTED", is_required: true },
  { item_code: "REQITEM_NIF_1_2_1_2025", axis_code: "AXIS_LOCATION_COLUMNS", axis_role: "COLUMN", dimension_code: "AREA_TYPE", member_code: "TOTAL", member_label: "Total", scope_role: "FIXED", source_type: "TEMPLATE_FIXED", is_required: true },
  { item_code: "REQITEM_NIF_1_2_1_2025", axis_code: "AXIS_LOCATION_COLUMNS", axis_role: "COLUMN", dimension_code: "AREA_TYPE", member_code: "RURAL", member_label: "Rural", scope_role: "FIXED", source_type: "TEMPLATE_FIXED", is_required: true },
  { item_code: "REQITEM_NIF_1_2_1_2025", axis_code: "AXIS_LOCATION_COLUMNS", axis_role: "COLUMN", dimension_code: "AREA_TYPE", member_code: "URBAN", member_label: "Urban", scope_role: "FIXED", source_type: "TEMPLATE_FIXED", is_required: true },
];

export const templateInstances: TemplateInstanceSample[] = [
  {
    item_code: "REQITEM_NIF_1_2_1_2025",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0001_NIF_1_2_1",
    template_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP",
    template_version_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP_V1",
    instance_status: "ACTIVE",
    render_contract_version: "v1",
    generated_at: "2026-05-29 08:22",
  },
  {
    item_code: "REQITEM_NIF_1_2_1_2025_STATE",
    template_instance_code: "TPLINST_REQ_SDG_NIF_2025_0002_NIF_1_2_1",
    template_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT",
    template_version_code: "TPL_NIF_1_2_1_AREA_GENDER_TIME_DRAFT_V1",
    instance_status: "DRAFT",
    render_contract_version: "v1",
    generated_at: "Not generated",
  },
];

export const requestAssignments: RequestAssignmentSample[] = [
  {
    assignment_code: "ASN_REQ_SDG_NIF_2025_0001_PROVIDER",
    request_code: "REQ_SDG_NIF_2025_0001",
    item_code: "REQITEM_NIF_1_2_1_2025",
    assignment_role: "DATA_PROVIDER",
    assigned_to_organization_code: "SSD_DEMO_SOURCE",
    assigned_to_officer_code: "SSD_DEMO_OFFICER",
    officer_name: "SSD Demo Officer",
    status: "ASSIGNED",
    due_date: "2025-06-30",
    assigned_at: "2026-05-29 08:22",
  },
  {
    assignment_code: "ASN_REQ_SDG_NIF_2025_0002_OWNER",
    request_code: "REQ_SDG_NIF_2025_0002",
    item_code: "REQITEM_NIF_1_2_1_2025_STATE",
    assignment_role: "REQUEST_OWNER",
    assigned_to_organization_code: "STATE_UNIT",
    assigned_to_officer_code: "STATE_REVIEWER",
    officer_name: "State Reviewer",
    status: "ASSIGNED",
    due_date: "2025-07-15",
    assigned_at: "Draft",
  },
];

export const requestStatusTrail: RequestStatusTrailSample[] = [
  { stage: "Request", status: "SENT", code: "REQ_SDG_NIF_2025_0001", timestamp: "2026-05-29 08:22", action: "Request sent to source organization" },
  { stage: "Data entry", status: "PENDING", code: "TPLINST_REQ_SDG_NIF_2025_0001_NIF_1_2_1", timestamp: "Waiting", action: "Department fills resolved template instance" },
  { stage: "Ingestion", status: "READY_AFTER_SUBMIT", code: "SUB_REQ_SDG_NIF_2025_0001_V1", timestamp: "Future", action: "Submission/version/manifest created after submit" },
  { stage: "Validation", status: "BLOCKED_UNTIL_INGESTED", code: "VALRUN_REQ_SDG_NIF_2025_0001", timestamp: "Future", action: "Validate staged records" },
  { stage: "Review", status: "BLOCKED_UNTIL_VALIDATED", code: "REV_REQ_SDG_NIF_2025_0001", timestamp: "Future", action: "Reviewer sees request, data, validation context" },
  { stage: "Dashboard", status: "BLOCKED_UNTIL_APPROVED", code: "DASH_SNAPSHOT_NIF_1_2_1", timestamp: "Future", action: "Published snapshot becomes visible" },
];
