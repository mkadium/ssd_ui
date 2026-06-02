import { apiRequest } from "@/api/client";
import type {
  FrameworkEditionListItem,
  FrameworkHierarchyDetail,
  IndicatorDetail,
  IndicatorListItem,
  IndicatorVersionDetail,
  MetadataDetailResponse,
  MetadataListResponse,
  OfficerListItem,
  OrganizationListItem,
  PeriodicityListItem,
  SourceAssignmentListItem,
} from "@/types/masters";

export const mastersService = {
  listFrameworks: async ({
    locale,
  }: {
    locale: string;
  }): Promise<MetadataListResponse<FrameworkEditionListItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataListResponse<FrameworkEditionListItem>>(
      `/masters/frameworks?${params.toString()}`,
    );
  },

  getFrameworkHierarchy: async ({
    frameworkCode,
    locale,
  }: {
    frameworkCode: string;
    locale: string;
  }): Promise<MetadataDetailResponse<FrameworkHierarchyDetail>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<FrameworkHierarchyDetail>>(
      `/masters/frameworks/${encodeURIComponent(frameworkCode)}/hierarchy?${params.toString()}`,
    );
  },

  listIndicators: async ({
    locale,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    limit?: number;
    offset?: number;
  }): Promise<MetadataListResponse<IndicatorListItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    return apiRequest<MetadataListResponse<IndicatorListItem>>(
      `/masters/indicators?${params.toString()}`,
    );
  },

  getIndicator: async ({
    indicatorCode,
    locale,
  }: {
    indicatorCode: string;
    locale: string;
  }): Promise<MetadataDetailResponse<IndicatorDetail>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<IndicatorDetail>>(
      `/masters/indicators/${encodeURIComponent(indicatorCode)}?${params.toString()}`,
    );
  },

  getIndicatorVersion: async ({
    versionCode,
    locale,
  }: {
    versionCode: string;
    locale: string;
  }): Promise<MetadataDetailResponse<IndicatorVersionDetail>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<IndicatorVersionDetail>>(
      `/masters/indicator-versions/${encodeURIComponent(versionCode)}?${params.toString()}`,
    );
  },

  listPeriodicities: async ({
    locale,
  }: {
    locale: string;
  }): Promise<MetadataListResponse<PeriodicityListItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataListResponse<PeriodicityListItem>>(
      `/masters/periodicities?${params.toString()}`,
    );
  },

  listSourceAssignments: async ({
    locale,
    indicatorCode,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    indicatorCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<MetadataListResponse<SourceAssignmentListItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    if (indicatorCode) {
      params.set("indicator_code", indicatorCode);
    }

    return apiRequest<MetadataListResponse<SourceAssignmentListItem>>(
      `/masters/source-assignments?${params.toString()}`,
    );
  },

  listOrganizations: async ({
    locale,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    limit?: number;
    offset?: number;
  }): Promise<MetadataListResponse<OrganizationListItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    return apiRequest<MetadataListResponse<OrganizationListItem>>(
      `/masters/organizations?${params.toString()}`,
    );
  },

  listOfficers: async ({
    locale,
    organizationCode,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    organizationCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<MetadataListResponse<OfficerListItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    if (organizationCode) {
      params.set("organization_code", organizationCode);
    }

    return apiRequest<MetadataListResponse<OfficerListItem>>(
      `/masters/officers?${params.toString()}`,
    );
  },
};
