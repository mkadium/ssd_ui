import { apiRequest } from "@/api/client";
import type {
  TemplateDefinitionDetail,
  TemplateDefinitionListItem,
  TemplateDetailResponse,
  TemplateListResponse,
  TemplateRenderContract,
  TemplateVersionListItem,
} from "@/types/templates";

export const templatesService = {
  listTemplates: async ({
    locale,
    unitCode,
    status,
    limit = 500,
    offset = 0,
  }: {
    locale: string;
    unitCode?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<TemplateListResponse<TemplateDefinitionListItem>> => {
    const params = new URLSearchParams({
      locale,
      limit: String(limit),
      offset: String(offset),
    });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    if (status) {
      params.set("status", status);
    }

    return apiRequest<TemplateListResponse<TemplateDefinitionListItem>>(
      `/templates?${params.toString()}`,
    );
  },

  getTemplate: async ({
    templateCode,
    locale,
  }: {
    templateCode: string;
    locale: string;
  }): Promise<TemplateDetailResponse<TemplateDefinitionDetail>> => {
    const params = new URLSearchParams({ locale });

    return apiRequest<TemplateDetailResponse<TemplateDefinitionDetail>>(
      `/templates/${encodeURIComponent(templateCode)}?${params.toString()}`,
    );
  },

  getTemplateVersion: async ({
    versionCode,
    locale,
    unitCode,
  }: {
    versionCode: string;
    locale: string;
    unitCode?: string;
  }): Promise<TemplateDetailResponse<TemplateVersionListItem>> => {
    const params = new URLSearchParams({ locale });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<TemplateDetailResponse<TemplateVersionListItem>>(
      `/templates/versions/${encodeURIComponent(versionCode)}?${params.toString()}`,
    );
  },

  getRenderContract: async ({
    versionCode,
    locale,
    unitCode,
  }: {
    versionCode: string;
    locale: string;
    unitCode?: string;
  }): Promise<TemplateDetailResponse<TemplateRenderContract>> => {
    const params = new URLSearchParams({ locale });

    if (unitCode) {
      params.set("unit_code", unitCode);
    }

    return apiRequest<TemplateDetailResponse<TemplateRenderContract>>(
      `/templates/versions/${encodeURIComponent(versionCode)}/render-contract?${params.toString()}`,
    );
  },
};
