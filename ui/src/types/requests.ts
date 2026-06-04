export type RequestListResponse<T> = {
  data: T[];
  locale: string;
  count: number;
};

export type RequestDetailResponse<T> = {
  data: T;
  locale: string;
};

export type CollectionCycleItem = {
  cycle_code: string;
  cycle_type?: string | null;
  reporting_year?: number | string | null;
  status?: string | null;
  framework_code?: string | null;
  edition_code?: string | null;
  unit_code?: string | null;
  name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  request_count?: number | string | null;
  submitted_count?: number | string | null;
  description?: string | null;
};

export type CollectionRequestItem = {
  request_code: string;
  cycle_code?: string | null;
  unit_code?: string | null;
  request_type?: string | null;
  priority?: string | null;
  status?: string | null;
  source_organization_code?: string | null;
  source_organization_name?: string | null;
  officer_code?: string | null;
  officer_name?: string | null;
  due_date?: string | null;
  item_count?: number | string | null;
  assignment_count?: number | string | null;
  sent_at?: string | null;
  request_metadata?: Record<string, unknown> | null;
};

export type RequestChildItem = Record<string, unknown> & {
  item_code?: string;
  request_code?: string;
  template_version_code?: string | null;
};

export type RequestAssignmentItem = Record<string, unknown> & {
  assignment_code: string;
  request_code?: string | null;
  item_code?: string | null;
  status?: string | null;
};

export type RequestScopeMemberItem = Record<string, unknown>;
export type RequestTemplateInstanceItem = Record<string, unknown> & {
  template_instance_code?: string;
  template_version_code?: string | null;
};

export type CollectionRequestPayload = {
  request_code: string;
  cycle_code: string;
  unit_code: string;
  source_organization_code?: string | null;
  officer_code?: string | null;
  request_type?: string;
  priority?: string;
  status?: string;
  due_date?: string | null;
  requested_by_username?: string | null;
  request_metadata?: Record<string, unknown>;
};

export type RequestItemPayload = {
  item_code: string;
  unit_code: string;
  national_indicator_code: string;
  indicator_version_code: string;
  template_version_code: string;
  source_organization_code?: string | null;
  source_assignment_role?: string;
  status?: string;
  due_date?: string | null;
  item_metadata?: Record<string, unknown>;
};

export type RequestScopeMemberPayload = {
  axis_code: string;
  dimension_code: string;
  member_code: string;
  scope_role?: string;
  source_type?: string;
  sort_order?: number;
  is_active?: boolean;
};

export type RequestScopeMembersPayload = {
  unit_code: string;
  changed_by_username?: string | null;
  scope_members: RequestScopeMemberPayload[];
};

export type TemplateInstancePayload = {
  template_instance_code: string;
  unit_code: string;
  instance_status?: string;
  render_contract_version?: string;
  resolved_scope_hash?: string | null;
  resolved_render_metadata?: Record<string, unknown>;
};

export type RequestAssignmentPayload = {
  assignment_code: string;
  unit_code: string;
  assignment_role?: string;
  item_code?: string | null;
  assigned_to_username?: string | null;
  assigned_to_organization_code?: string | null;
  assigned_to_officer_code?: string | null;
  assigned_by_username?: string | null;
  status?: string;
  due_date?: string | null;
  assignment_metadata?: Record<string, unknown>;
};

export type AssignmentStatusPayload = {
  unit_code: string;
  status: string;
  changed_by_username?: string | null;
  reason?: string | null;
};

export type RequestTokenHashPayload = {
  token_code: string;
  token_hash: string;
  expires_at: string;
  unit_code: string;
  item_code?: string | null;
  assignment_code?: string | null;
  hash_algorithm?: string;
  token_purpose?: string;
  status?: string;
  token_metadata?: Record<string, unknown>;
};

export type StatusChangePayload = {
  unit_code: string;
  status: string;
  changed_by_username?: string | null;
  reason?: string | null;
  cascade_items?: boolean;
};
