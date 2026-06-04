import { apiRequest } from "@/api/client";
import type {
  CollectionCycleItem,
  CollectionRequestItem,
  CollectionRequestPayload,
  AssignmentStatusPayload,
  RequestAssignmentPayload,
  RequestAssignmentItem,
  RequestChildItem,
  RequestDetailResponse,
  RequestItemPayload,
  RequestListResponse,
  RequestScopeMembersPayload,
  RequestScopeMemberItem,
  RequestTokenHashPayload,
  TemplateInstancePayload,
  RequestTemplateInstanceItem,
  StatusChangePayload,
} from "@/types/requests";

const buildParams = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

export const requestsService = {
  listCycles: ({
    locale,
    unitCode,
    status = "ACTIVE",
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    unitCode?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiRequest<RequestListResponse<CollectionCycleItem>>(
      `/requests/cycles?${buildParams({ locale, unit_code: unitCode, status, limit, offset })}`,
    ),

  listRequests: ({
    locale,
    unitCode,
    cycleCode,
    status,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    unitCode?: string;
    cycleCode?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiRequest<RequestListResponse<CollectionRequestItem>>(
      `/requests?${buildParams({ locale, unit_code: unitCode, cycle_code: cycleCode, status, limit, offset })}`,
    ),

  getRequest: ({ requestCode, locale, unitCode }: { requestCode: string; locale: string; unitCode?: string }) =>
    apiRequest<RequestDetailResponse<CollectionRequestItem>>(
      `/requests/${encodeURIComponent(requestCode)}?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  listRequestItems: ({ requestCode, locale, unitCode }: { requestCode: string; locale: string; unitCode?: string }) =>
    apiRequest<RequestListResponse<RequestChildItem>>(
      `/requests/${encodeURIComponent(requestCode)}/items?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  getRequestItem: ({
    requestCode,
    itemCode,
    locale,
    unitCode,
  }: {
    requestCode: string;
    itemCode: string;
    locale: string;
    unitCode?: string;
  }) =>
    apiRequest<RequestDetailResponse<RequestChildItem>>(
      `/requests/${encodeURIComponent(requestCode)}/items/${encodeURIComponent(itemCode)}?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  listScopeMembers: ({
    requestCode,
    itemCode,
    locale,
    unitCode,
  }: {
    requestCode: string;
    itemCode: string;
    locale: string;
    unitCode?: string;
  }) =>
    apiRequest<RequestListResponse<RequestScopeMemberItem>>(
      `/requests/${encodeURIComponent(requestCode)}/items/${encodeURIComponent(itemCode)}/scope-members?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  getTemplateInstance: ({
    requestCode,
    itemCode,
    locale,
    unitCode,
  }: {
    requestCode: string;
    itemCode: string;
    locale: string;
    unitCode?: string;
  }) =>
    apiRequest<RequestDetailResponse<RequestTemplateInstanceItem>>(
      `/requests/${encodeURIComponent(requestCode)}/items/${encodeURIComponent(itemCode)}/template-instance?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  listAssignments: ({ requestCode, locale, unitCode }: { requestCode: string; locale: string; unitCode?: string }) =>
    apiRequest<RequestListResponse<RequestAssignmentItem>>(
      `/requests/${encodeURIComponent(requestCode)}/assignments?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  getAssignment: ({ assignmentCode, locale, unitCode }: { assignmentCode: string; locale: string; unitCode?: string }) =>
    apiRequest<RequestDetailResponse<RequestAssignmentItem>>(
      `/requests/assignments/${encodeURIComponent(assignmentCode)}?${buildParams({ locale, unit_code: unitCode })}`,
    ),

  upsertRequest: ({ locale, payload, requestCode, method = "POST" }: {
    locale: string;
    payload: CollectionRequestPayload;
    requestCode?: string;
    method?: "POST" | "PATCH";
  }) => {
    const path = requestCode ? `/requests/${encodeURIComponent(requestCode)}` : "/requests";
    return apiRequest<RequestDetailResponse<CollectionRequestItem>>(`${path}?${buildParams({ locale })}`, { method, json: payload });
  },

  updateRequestStatus: ({ locale, requestCode, payload }: { locale: string; requestCode: string; payload: StatusChangePayload }) =>
    apiRequest<RequestDetailResponse<CollectionRequestItem>>(
      `/requests/${encodeURIComponent(requestCode)}/status?${buildParams({ locale })}`,
      { method: "PATCH", json: payload },
    ),

  upsertRequestItem: ({
    locale,
    requestCode,
    itemCode,
    payload,
    method = "POST",
  }: {
    locale: string;
    requestCode: string;
    itemCode?: string;
    payload: RequestItemPayload;
    method?: "POST" | "PATCH";
  }) => {
    const itemPath = itemCode ? `/${encodeURIComponent(itemCode)}` : "";
    return apiRequest<RequestDetailResponse<RequestChildItem>>(
      `/requests/${encodeURIComponent(requestCode)}/items${itemPath}?${buildParams({ locale })}`,
      { method, json: payload },
    );
  },

  updateRequestItemStatus: ({
    locale,
    requestCode,
    itemCode,
    payload,
  }: {
    locale: string;
    requestCode: string;
    itemCode: string;
    payload: StatusChangePayload;
  }) =>
    apiRequest<RequestDetailResponse<RequestChildItem>>(
      `/requests/${encodeURIComponent(requestCode)}/items/${encodeURIComponent(itemCode)}/status?${buildParams({ locale })}`,
      { method: "PATCH", json: payload },
    ),

  replaceScopeMembers: ({
    locale,
    requestCode,
    itemCode,
    payload,
  }: {
    locale: string;
    requestCode: string;
    itemCode: string;
    payload: RequestScopeMembersPayload;
  }) =>
    apiRequest<RequestListResponse<RequestScopeMemberItem>>(
      `/requests/${encodeURIComponent(requestCode)}/items/${encodeURIComponent(itemCode)}/scope-members?${buildParams({ locale })}`,
      { method: "PUT", json: payload },
    ),

  upsertTemplateInstance: ({
    locale,
    requestCode,
    itemCode,
    payload,
  }: {
    locale: string;
    requestCode: string;
    itemCode: string;
    payload: TemplateInstancePayload;
  }) =>
    apiRequest<RequestDetailResponse<RequestTemplateInstanceItem>>(
      `/requests/${encodeURIComponent(requestCode)}/items/${encodeURIComponent(itemCode)}/template-instance?${buildParams({ locale })}`,
      { method: "PUT", json: payload },
    ),

  upsertAssignment: ({
    locale,
    requestCode,
    assignmentCode,
    payload,
    method = "POST",
  }: {
    locale: string;
    requestCode: string;
    assignmentCode?: string;
    payload: RequestAssignmentPayload;
    method?: "POST" | "PATCH";
  }) => {
    const assignmentPath = assignmentCode ? `/${encodeURIComponent(assignmentCode)}` : "";
    return apiRequest<RequestDetailResponse<RequestAssignmentItem>>(
      `/requests/${encodeURIComponent(requestCode)}/assignments${assignmentPath}?${buildParams({ locale })}`,
      { method, json: payload },
    );
  },

  updateAssignmentStatus: ({ locale, assignmentCode, payload }: { locale: string; assignmentCode: string; payload: AssignmentStatusPayload }) =>
    apiRequest<RequestDetailResponse<RequestAssignmentItem>>(
      `/requests/assignments/${encodeURIComponent(assignmentCode)}/status?${buildParams({ locale })}`,
      { method: "PATCH", json: payload },
    ),

  createRequestTokenMetadata: ({
    locale,
    requestCode,
    payload,
  }: {
    locale: string;
    requestCode: string;
    payload: RequestTokenHashPayload;
  }) =>
    apiRequest<RequestDetailResponse<Record<string, unknown>>>(
      `/requests/${encodeURIComponent(requestCode)}/tokens?${buildParams({ locale })}`,
      { method: "POST", json: payload },
    ),
};
