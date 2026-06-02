export type MetadataListResponse<T> = {
  data: T[];
  locale: string;
  count: number;
};

export type OrganizationListItem = {
  organization_code: string;
  organization_type: string;
  parent_organization_code?: string | null;
  short_code?: string | null;
  name: string;
};

export type FrameworkEditionListItem = {
  framework_code: string;
  edition_code: string;
  version_label?: string | null;
  status: string;
  is_active?: boolean;
  name: string;
  description?: string | null;
  effective_from?: string | null;
};

export type FrameworkHierarchyLevel = {
  level_code: string;
  level_number: number;
  allows_indicator_mapping: boolean;
  name: string;
  description?: string | null;
};

export type FrameworkHierarchyNode = {
  node_code: string;
  level_code: string;
  node_number: string;
  color_value?: string | null;
  color_method?: string | null;
  icon_path?: string | null;
  status?: string | null;
  sort_order?: number | null;
  name: string;
  short_name?: string | null;
  description?: string | null;
};

export type FrameworkHierarchyRelationship = {
  parent_node_code: string;
  child_node_code: string;
  relationship_type: string;
  sort_order?: number | null;
};

export type FrameworkHierarchyDetail = {
  framework_code: string;
  edition_code: string;
  version_label?: string | null;
  status?: string | null;
  name: string;
  description?: string | null;
  levels: FrameworkHierarchyLevel[];
  nodes: FrameworkHierarchyNode[];
  relationships: FrameworkHierarchyRelationship[];
};

export type MetadataDetailResponse<T> = {
  data: T;
  locale: string;
};

export type IndicatorListItem = {
  national_indicator_code: string;
  indicator_number: string;
  owning_unit_code?: string | null;
  color_value?: string | null;
  color_method?: string | null;
  icon_path?: string | null;
  status?: string | null;
  framework_code?: string | null;
  edition_code?: string | null;
  current_version_code?: string | null;
  name: string;
  description?: string | null;
};

export type SourceAssignmentListItem = {
  national_indicator_code: string;
  source_organization_code: string;
  source_organization_name?: string | null;
  officer_code?: string | null;
  officer_display_name?: string | null;
  periodicity_code?: string | null;
  assignment_role?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  is_active?: boolean;
};
