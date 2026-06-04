export type ApiListResponse<T> = {
  data: T[];
  locale?: string;
  count?: number;
};

export type ApiDetailResponse<T> = {
  data: T;
  locale?: string;
};

export type WorkflowRecord = Record<string, unknown>;

export type ReviewActionRequest = {
  unit_code: string;
  action_type: string;
  comment?: string | null;
  is_final_approval?: boolean;
};

export type ReviewApprovalRequest = {
  unit_code: string;
  approval_status: "APPROVED" | "REJECTED" | string;
  comment?: string | null;
  is_final_approval?: boolean;
};

export type InvitationNotificationStatusRequest = {
  unit_code: string;
  notification_status: string;
};

export type InvitationRevokeRequest = {
  unit_code: string;
  revoke_reason?: string | null;
};
