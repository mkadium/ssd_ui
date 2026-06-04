import { apiRequest } from "@/api/client";
import type {
  ApiDetailResponse,
  ApiListResponse,
  InvitationNotificationStatusRequest,
  InvitationRevokeRequest,
  WorkflowRecord,
} from "@/types/workflow";

const params = (values: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
};

export const invitationAccessService = {
  listInvitations: ({ locale, unitCode, requestCode }: { locale: string; unitCode?: string; requestCode?: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/invitation-access/invitations?${params({ locale, unit_code: unitCode, request_code: requestCode })}`),

  getInvitation: ({ locale, unitCode, invitationCode }: { locale: string; unitCode?: string; invitationCode: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/invitation-access/invitations/${encodeURIComponent(invitationCode)}?${params({ locale, unit_code: unitCode })}`),

  listEvents: ({ locale, unitCode, invitationCode }: { locale: string; unitCode?: string; invitationCode: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/invitation-access/invitations/${encodeURIComponent(invitationCode)}/events?${params({ locale, unit_code: unitCode })}`),

  generateLink: ({ locale, invitationCode, payload }: { locale: string; invitationCode: string; payload: WorkflowRecord }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/invitation-access/invitations/${encodeURIComponent(invitationCode)}/generate-link?${params({ locale })}`, {
      method: "POST",
      json: payload,
    }),

  updateNotificationStatus: ({ locale, invitationCode, payload }: { locale: string; invitationCode: string; payload: InvitationNotificationStatusRequest }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/invitation-access/invitations/${encodeURIComponent(invitationCode)}/notification-status?${params({ locale })}`, {
      method: "PATCH",
      json: payload,
    }),

  revoke: ({ locale, invitationCode, payload }: { locale: string; invitationCode: string; payload: InvitationRevokeRequest }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/invitation-access/invitations/${encodeURIComponent(invitationCode)}/revoke?${params({ locale })}`, {
      method: "PATCH",
      json: payload,
    }),
};
