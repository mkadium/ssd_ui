import { apiRequest } from "@/api/client";
import type { ApiDetailResponse, ApiListResponse, WorkflowRecord } from "@/types/workflow";

const params = (values: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
};

type DashboardFilters = {
  locale: string;
  unitCode?: string;
  nationalIndicatorCode?: string;
  sourceOrganizationCode?: string;
  measureCode?: string;
  timePeriodMemberCode?: string;
};

export const dashboardService = {
  getOverallSummary: ({ locale, unitCode }: { locale: string; unitCode?: string }) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/dashboard/overall-summary?${params({ locale, unit_code: unitCode })}`),

  listUnits: ({ locale, unitCode }: { locale: string; unitCode?: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/dashboard/units?${params({ locale, unit_code: unitCode })}`),

  listGoals: ({ locale, unitCode }: { locale: string; unitCode?: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/dashboard/goals?${params({ locale, unit_code: unitCode })}`),

  listTargets: ({ locale, unitCode }: { locale: string; unitCode?: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/dashboard/targets?${params({ locale, unit_code: unitCode })}`),

  listNationalIndicators: ({ locale, unitCode }: { locale: string; unitCode?: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/dashboard/national-indicators?${params({ locale, unit_code: unitCode })}`),

  listSourceOrganizations: ({ locale, unitCode }: { locale: string; unitCode?: string }) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(`/dashboard/source-organizations?${params({ locale, unit_code: unitCode })}`),

  getDrilldown: ({ locale, unitCode, nationalIndicatorCode }: DashboardFilters) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/dashboard/drilldown?${params({ locale, unit_code: unitCode, national_indicator_code: nationalIndicatorCode })}`),

  getPipelineStatus: ({ locale, unitCode, nationalIndicatorCode }: DashboardFilters) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(`/dashboard/pipeline-status?${params({ locale, unit_code: unitCode, national_indicator_code: nationalIndicatorCode })}`),

  listApprovedObservations: ({ locale, unitCode, nationalIndicatorCode, sourceOrganizationCode, measureCode, timePeriodMemberCode }: DashboardFilters) =>
    apiRequest<ApiListResponse<WorkflowRecord>>(
      `/dashboard/approved-observations?${params({
        locale,
        unit_code: unitCode,
        national_indicator_code: nationalIndicatorCode,
        source_organization_code: sourceOrganizationCode,
        measure_code: measureCode,
        time_period_member_code: timePeriodMemberCode,
      })}`,
    ),

  getApprovedSummary: ({ locale, unitCode, nationalIndicatorCode, sourceOrganizationCode, measureCode, timePeriodMemberCode }: DashboardFilters) =>
    apiRequest<ApiDetailResponse<WorkflowRecord>>(
      `/dashboard/approved-summary?${params({
        locale,
        unit_code: unitCode,
        national_indicator_code: nationalIndicatorCode,
        source_organization_code: sourceOrganizationCode,
        measure_code: measureCode,
        time_period_member_code: timePeriodMemberCode,
      })}`,
    ),
};
