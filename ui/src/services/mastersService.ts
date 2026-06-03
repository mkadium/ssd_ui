import { apiRequest } from "@/api/client";
import type {
  FrameworkEditionListItem,
  FrameworkEditionRequest,
  FrameworkHierarchyDetail,
  FrameworkHierarchyLevelRequest,
  FrameworkNodeRelationshipRequest,
  FrameworkNodeRequest,
  IndicatorDetail,
  IndicatorListItem,
  IndicatorVersionDetail,
  LocaleListItem,
  MetadataDetailResponse,
  MetadataListResponse,
  OfficerListItem,
  OrganizationListItem,
  PeriodicityListItem,
  SourceAssignmentListItem,
} from "@/types/masters";


export const mastersService = {
  listLocales: async ({
    locale,
  }: {
    locale: string;
  }): Promise<MetadataListResponse<LocaleListItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataListResponse<LocaleListItem>>(
      `/masters/locales?${params.toString()}`,
    );
  },

  listFrameworks: async ({
    locale,
    unitCode,
  }: {
    locale: string;
    unitCode?: string;
  }): Promise<MetadataListResponse<FrameworkEditionListItem>> => {
    const params = new URLSearchParams({ locale });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<MetadataListResponse<FrameworkEditionListItem>>(
      `/masters/frameworks?${params.toString()}`,
    );
  },

  listFrameworkEditions: async ({
    locale,
    includeInactive = true,
  }: {
    locale: string;
    includeInactive?: boolean;
  }): Promise<MetadataListResponse<FrameworkEditionListItem>> => {
    const params = new URLSearchParams({
      locale,
      include_inactive: String(includeInactive),
    });

    return apiRequest<MetadataListResponse<FrameworkEditionListItem>>(
      `/masters/framework-editions?${params.toString()}`,
    );
  },

  createFrameworkEdition: async ({
    locale,
    body,
  }: {
    locale: string;
    body: FrameworkEditionRequest;
  }): Promise<MetadataDetailResponse<FrameworkEditionListItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<FrameworkEditionListItem>>(
      `/masters/framework-editions?${params.toString()}`,
      {
        method: "POST",
        json: body,
      },
    );
  },

  updateFrameworkEdition: async ({
    frameworkCode,
    editionCode,
    locale,
    body,
  }: {
    frameworkCode: string;
    editionCode: string;
    locale: string;
    body: FrameworkEditionRequest;
  }): Promise<MetadataDetailResponse<FrameworkEditionListItem>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<FrameworkEditionListItem>>(
      `/masters/framework-editions/${encodeURIComponent(frameworkCode)}/${encodeURIComponent(editionCode)}?${params.toString()}`,
      {
        method: "PATCH",
        json: body,
      },
    );
  },

  setFrameworkEditionActive: async ({
    frameworkCode,
    editionCode,
    locale,
    active,
  }: {
    frameworkCode: string;
    editionCode: string;
    locale: string;
    active: boolean;
  }): Promise<MetadataDetailResponse<FrameworkEditionListItem>> => {
    const params = new URLSearchParams({ locale });
    const path = active
      ? `/masters/framework-editions/${encodeURIComponent(frameworkCode)}/${encodeURIComponent(editionCode)}/restore`
      : `/masters/framework-editions/${encodeURIComponent(frameworkCode)}/${encodeURIComponent(editionCode)}`;

    return apiRequest<MetadataDetailResponse<FrameworkEditionListItem>>(
      `${path}?${params.toString()}`,
      { method: active ? "POST" : "DELETE" },
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

  createFrameworkLevel: async ({
    frameworkCode,
    editionCode,
    locale,
    body,
  }: {
    frameworkCode: string;
    editionCode: string;
    locale: string;
    body: FrameworkHierarchyLevelRequest;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/framework-editions/${encodeURIComponent(frameworkCode)}/${encodeURIComponent(editionCode)}/levels?${params.toString()}`,
      {
        method: "POST",
        json: body,
      },
    );
  },

  updateFrameworkLevel: async ({
    frameworkCode,
    editionCode,
    levelCode,
    locale,
    body,
  }: {
    frameworkCode: string;
    editionCode: string;
    levelCode: string;
    locale: string;
    body: FrameworkHierarchyLevelRequest;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/framework-editions/${encodeURIComponent(frameworkCode)}/${encodeURIComponent(editionCode)}/levels/${encodeURIComponent(levelCode)}?${params.toString()}`,
      {
        method: "PATCH",
        json: body,
      },
    );
  },

  createFrameworkNode: async ({
    frameworkCode,
    editionCode,
    locale,
    body,
  }: {
    frameworkCode: string;
    editionCode: string;
    locale: string;
    body: FrameworkNodeRequest;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/framework-editions/${encodeURIComponent(frameworkCode)}/${encodeURIComponent(editionCode)}/nodes?${params.toString()}`,
      {
        method: "POST",
        json: body,
      },
    );
  },

  updateFrameworkNode: async ({
    frameworkCode,
    editionCode,
    nodeCode,
    locale,
    body,
  }: {
    frameworkCode: string;
    editionCode: string;
    nodeCode: string;
    locale: string;
    body: FrameworkNodeRequest;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/framework-editions/${encodeURIComponent(frameworkCode)}/${encodeURIComponent(editionCode)}/nodes/${encodeURIComponent(nodeCode)}?${params.toString()}`,
      {
        method: "PATCH",
        json: body,
      },
    );
  },

  createFrameworkNodeRelationship: async ({
    frameworkCode,
    editionCode,
    locale,
    body,
  }: {
    frameworkCode: string;
    editionCode: string;
    locale: string;
    body: FrameworkNodeRelationshipRequest;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/framework-editions/${encodeURIComponent(frameworkCode)}/${encodeURIComponent(editionCode)}/relationships?${params.toString()}`,
      {
        method: "POST",
        json: body,
      },
    );
  },

  listIndicators: async ({
    locale,
    unitCode,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    unitCode?: string;
    limit?: number;
    offset?: number;
  }): Promise<MetadataListResponse<IndicatorListItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<MetadataListResponse<IndicatorListItem>>(
      `/masters/indicators?${params.toString()}`,
    );
  },

  getIndicator: async ({
    indicatorCode,
    locale,
    unitCode,
  }: {
    indicatorCode: string;
    locale: string;
    unitCode?: string;
  }): Promise<MetadataDetailResponse<IndicatorDetail>> => {
    const params = new URLSearchParams({ locale });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<MetadataDetailResponse<IndicatorDetail>>(
      `/masters/indicators/${encodeURIComponent(indicatorCode)}?${params.toString()}`,
    );
  },

  createIndicator: async ({
    locale,
    body,
  }: {
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/indicators?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateIndicator: async ({
    indicatorCode,
    locale,
    body,
  }: {
    indicatorCode: string;
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/indicators/${encodeURIComponent(indicatorCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  getIndicatorVersion: async ({
    versionCode,
    locale,
    unitCode,
  }: {
    versionCode: string;
    locale: string;
    unitCode?: string;
  }): Promise<MetadataDetailResponse<IndicatorVersionDetail>> => {
    const params = new URLSearchParams({ locale });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<MetadataDetailResponse<IndicatorVersionDetail>>(
      `/masters/indicator-versions/${encodeURIComponent(versionCode)}?${params.toString()}`,
    );
  },

  createIndicatorVersion: async ({
    locale,
    body,
  }: {
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/indicator-versions?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateIndicatorVersion: async ({
    versionCode,
    locale,
    body,
  }: {
    versionCode: string;
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/indicator-versions/${encodeURIComponent(versionCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  createIndicatorMeasure: async ({
    versionCode,
    locale,
    body,
  }: {
    versionCode: string;
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/indicator-versions/${encodeURIComponent(versionCode)}/measures?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateIndicatorMeasure: async ({
    versionCode,
    measureCode,
    locale,
    body,
  }: {
    versionCode: string;
    measureCode: string;
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/indicator-versions/${encodeURIComponent(versionCode)}/measures/${encodeURIComponent(measureCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  createGlobalIndicator: async ({
    locale,
    body,
  }: {
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/global-indicators?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateGlobalIndicator: async ({
    indicatorCode,
    locale,
    body,
  }: {
    indicatorCode: string;
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/global-indicators/${encodeURIComponent(indicatorCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  createFrameworkIndicatorMapping: async ({
    locale,
    body,
  }: {
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/framework-indicator-mappings?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  createNationalGlobalIndicatorMapping: async ({
    locale,
    body,
  }: {
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/national-global-indicator-mappings?${params.toString()}`,
      { method: "POST", json: body },
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

  createPeriodicity: async ({
    locale,
    body,
  }: {
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/periodicities?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updatePeriodicity: async ({
    periodicityCode,
    locale,
    body,
  }: {
    periodicityCode: string;
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/periodicities/${encodeURIComponent(periodicityCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  listSourceAssignments: async ({
    locale,
    indicatorCode,
    unitCode,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    indicatorCode?: string;
    unitCode?: string;
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

    if (unitCode) {
      params.set("unit_code", unitCode);
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

  createOrganization: async ({
    locale,
    body,
  }: {
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/organizations?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateOrganization: async ({
    organizationCode,
    locale,
    body,
  }: {
    organizationCode: string;
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/organizations/${encodeURIComponent(organizationCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
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

  createOfficer: async ({
    locale,
    body,
  }: {
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/officers?${params.toString()}`,
      { method: "POST", json: body },
    );
  },

  updateOfficer: async ({
    organizationCode,
    officerCode,
    locale,
    body,
  }: {
    organizationCode: string;
    officerCode: string;
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/organizations/${encodeURIComponent(organizationCode)}/officers/${encodeURIComponent(officerCode)}?${params.toString()}`,
      { method: "PATCH", json: body },
    );
  },

  createSourceAssignment: async ({
    locale,
    body,
  }: {
    locale: string;
    body: Record<string, unknown>;
  }): Promise<MetadataDetailResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<MetadataDetailResponse<Record<string, unknown>>>(
      `/masters/source-assignments?${params.toString()}`,
      { method: "POST", json: body },
    );
  },
};
