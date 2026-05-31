export type FrameworkEdition = {
  framework_code: string;
  edition_code: string;
  version_label: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  is_active: boolean;
  name: string;
  description: string;
  effective_from: string;
};

export type FrameworkLevel = {
  level_code: string;
  level_number: number;
  name: string;
  allows_indicator_mapping: boolean;
  node_count: number;
};

export type FrameworkNode = {
  node_code: string;
  level_code: string;
  node_number: string;
  name: string;
  parent_node_code?: string;
  color_value: string;
  mapped_indicator_count: number;
};

export type IndicatorMapping = {
  national_indicator_code: string;
  indicator_number: string;
  indicator_name: string;
  mapped_node_code: string;
  mapped_node_path: string;
  global_indicator_code: string | "NONE";
  source_organization_code: string;
  officer_code: string;
  periodicity_code: string;
  readiness_status: "READY" | "NEEDS_MAPPING" | "SOURCE_PENDING";
};

export const frameworkEditions: FrameworkEdition[] = [
  {
    framework_code: "SDG_NIF",
    edition_code: "SDG_NIF_2025",
    version_label: "2025",
    status: "ACTIVE",
    is_active: true,
    name: "SDG National Indicator Framework",
    description: "First-demo SDG framework edition used for request, template, validation, review, and dashboard flows.",
    effective_from: "2025-04-01",
  },
  {
    framework_code: "SDG_NIF",
    edition_code: "SDG_NIF_2024",
    version_label: "2024",
    status: "ARCHIVED",
    is_active: false,
    name: "SDG NIF previous edition",
    description: "Historical framework edition retained for comparison and audit.",
    effective_from: "2024-04-01",
  },
];

export const frameworkLevels: FrameworkLevel[] = [
  {
    level_code: "GOAL",
    level_number: 1,
    name: "Goal",
    allows_indicator_mapping: false,
    node_count: 4,
  },
  {
    level_code: "TARGET",
    level_number: 2,
    name: "Target",
    allows_indicator_mapping: true,
    node_count: 8,
  },
];

export const frameworkNodes: FrameworkNode[] = [
  {
    node_code: "GOAL_01",
    level_code: "GOAL",
    node_number: "1",
    name: "No Poverty",
    color_value: "#E5243B",
    mapped_indicator_count: 3,
  },
  {
    node_code: "TARGET_1_2",
    level_code: "TARGET",
    node_number: "1.2",
    name: "Reduce poverty in all dimensions",
    parent_node_code: "GOAL_01",
    color_value: "#E5243B",
    mapped_indicator_count: 2,
  },
  {
    node_code: "GOAL_02",
    level_code: "GOAL",
    node_number: "2",
    name: "Zero Hunger",
    color_value: "#DDA63A",
    mapped_indicator_count: 2,
  },
  {
    node_code: "TARGET_2_1",
    level_code: "TARGET",
    node_number: "2.1",
    name: "End hunger and ensure access to food",
    parent_node_code: "GOAL_02",
    color_value: "#DDA63A",
    mapped_indicator_count: 1,
  },
  {
    node_code: "GOAL_03",
    level_code: "GOAL",
    node_number: "3",
    name: "Good Health and Well-being",
    color_value: "#4C9F38",
    mapped_indicator_count: 2,
  },
  {
    node_code: "TARGET_3_8",
    level_code: "TARGET",
    node_number: "3.8",
    name: "Achieve universal health coverage",
    parent_node_code: "GOAL_03",
    color_value: "#4C9F38",
    mapped_indicator_count: 1,
  },
];

export const indicatorMappings: IndicatorMapping[] = [
  {
    national_indicator_code: "NIF_1_2_1",
    indicator_number: "1.2.1",
    indicator_name: "Population below poverty line",
    mapped_node_code: "TARGET_1_2",
    mapped_node_path: "Goal / 1 No Poverty / Target / 1.2 Reduce poverty in all dimensions",
    global_indicator_code: "GIND_1_2_1",
    source_organization_code: "SSD_DEMO_SOURCE",
    officer_code: "SSD_DEMO_OFFICER",
    periodicity_code: "ANNUAL",
    readiness_status: "READY",
  },
  {
    national_indicator_code: "NIF_2_1_1",
    indicator_number: "2.1.1",
    indicator_name: "Prevalence of undernourishment",
    mapped_node_code: "TARGET_2_1",
    mapped_node_path: "Goal / 2 Zero Hunger / Target / 2.1 End hunger and ensure access to food",
    global_indicator_code: "GIND_2_1_1",
    source_organization_code: "SSD_DEMO_SOURCE",
    officer_code: "SSD_DEMO_OFFICER",
    periodicity_code: "ANNUAL",
    readiness_status: "READY",
  },
  {
    national_indicator_code: "NIF_3_8_1",
    indicator_number: "3.8.1",
    indicator_name: "Essential health service coverage",
    mapped_node_code: "TARGET_3_8",
    mapped_node_path: "Goal / 3 Good Health and Well-being / Target / 3.8 Achieve universal health coverage",
    global_indicator_code: "NONE",
    source_organization_code: "HEALTH_SOURCE",
    officer_code: "HEALTH_OFFICER",
    periodicity_code: "ANNUAL",
    readiness_status: "NEEDS_MAPPING",
  },
  {
    national_indicator_code: "NIF_4_1_1",
    indicator_number: "4.1.1",
    indicator_name: "School completion rate",
    mapped_node_code: "TARGET_4_1",
    mapped_node_path: "Goal / 4 Quality Education / Target / 4.1 School completion",
    global_indicator_code: "GIND_4_1_1",
    source_organization_code: "NONE",
    officer_code: "NONE",
    periodicity_code: "ANNUAL",
    readiness_status: "SOURCE_PENDING",
  },
];

export const frameworkReadiness = [
  {
    code: "EDITION",
    label: "Edition selected",
    detail: "framework_code and edition_code are active",
    status: "OK",
  },
  {
    code: "LEVELS",
    label: "Hierarchy levels",
    detail: "Dynamic level sequence is available",
    status: "OK",
  },
  {
    code: "NODES",
    label: "Nodes and relationships",
    detail: "Parent-child relationships are available",
    status: "OK",
  },
  {
    code: "INDICATORS",
    label: "Indicator mappings",
    detail: "One indicator needs global/source mapping",
    status: "NEEDS_ACTION",
  },
  {
    code: "TEMPLATES",
    label: "Template dependency",
    detail: "Mapped indicators can proceed to template setup",
    status: "OK",
  },
];
