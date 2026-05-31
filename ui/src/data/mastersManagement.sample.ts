export type MasterTabCode =
  | "locales"
  | "framework-editions"
  | "framework-levels"
  | "framework-nodes"
  | "node-relationships"
  | "global-indicators"
  | "national-indicators"
  | "indicator-versions"
  | "metadata-details"
  | "units"
  | "measures"
  | "periodicities"
  | "framework-mappings"
  | "global-mappings"
  | "organizations"
  | "officers"
  | "source-assignments";

export type MasterColumn = {
  key: string;
  label: string;
};

export type MasterRow = {
  id: string;
  status?: string;
  is_active?: string;
  [key: string]: string | undefined;
};

export type MasterTab = {
  code: MasterTabCode;
  label: string;
  tableName: string;
  dependency: string;
  columns: MasterColumn[];
  rows: MasterRow[];
};

export const masterTabs: MasterTab[] = [
  {
    code: "locales",
    label: "Locales",
    tableName: "metadata.locales",
    dependency: "Base locale registry. i18n forms depend on this table.",
    columns: [
      { key: "locale_code", label: "Locale" },
      { key: "name", label: "Name" },
      { key: "is_default", label: "Default" },
      { key: "is_active", label: "Active" },
    ],
    rows: [
      { id: "en-IN", locale_code: "en-IN", name: "English India", is_default: "YES", is_active: "YES" },
      { id: "hi-IN", locale_code: "hi-IN", name: "Hindi India", is_default: "NO", is_active: "YES" },
    ],
  },
  {
    code: "framework-editions",
    label: "Framework Editions",
    tableName: "metadata.framework_editions",
    dependency: "Create edition first, then levels, nodes, relationships, indicators, and mappings.",
    columns: [
      { key: "framework_code", label: "Framework" },
      { key: "edition_code", label: "Edition" },
      { key: "version_label", label: "Version" },
      { key: "status", label: "Status" },
      { key: "effective_from", label: "Effective from" },
    ],
    rows: [
      { id: "SDG_NIF_2025", framework_code: "SDG_NIF", edition_code: "SDG_NIF_2025", version_label: "2025", status: "ACTIVE", effective_from: "2025-04-01" },
      { id: "SDG_NIF_2024", framework_code: "SDG_NIF", edition_code: "SDG_NIF_2024", version_label: "2024", status: "RETIRED", effective_from: "2024-04-01" },
    ],
  },
  {
    code: "framework-levels",
    label: "Hierarchy Levels",
    tableName: "metadata.framework_hierarchy_levels",
    dependency: "Levels are dynamic per edition. Nodes use level_code; indicator mapping is allowed only where configured.",
    columns: [
      { key: "edition_code", label: "Edition" },
      { key: "level_code", label: "Level code" },
      { key: "level_number", label: "Level no" },
      { key: "name", label: "Name" },
      { key: "allows_indicator_mapping", label: "Allows indicator" },
    ],
    rows: [
      { id: "GOAL", edition_code: "SDG_NIF_2025", level_code: "GOAL", level_number: "1", name: "Goal", allows_indicator_mapping: "NO", is_active: "YES" },
      { id: "TARGET", edition_code: "SDG_NIF_2025", level_code: "TARGET", level_number: "2", name: "Target", allows_indicator_mapping: "YES", is_active: "YES" },
    ],
  },
  {
    code: "framework-nodes",
    label: "Hierarchy Nodes",
    tableName: "metadata.framework_nodes",
    dependency: "Nodes belong to a dynamic level. Parent-child relation is managed separately.",
    columns: [
      { key: "node_code", label: "Node code" },
      { key: "level_code", label: "Level" },
      { key: "node_number", label: "Number" },
      { key: "name", label: "Name" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { id: "GOAL_01", node_code: "GOAL_01", level_code: "GOAL", node_number: "1", name: "No Poverty", color_value: "#E5243B", status: "ACTIVE" },
      { id: "TARGET_1_2", node_code: "TARGET_1_2", level_code: "TARGET", node_number: "1.2", name: "Reduce poverty in all dimensions", parent_node_code: "GOAL_01", status: "ACTIVE" },
      { id: "GOAL_02", node_code: "GOAL_02", level_code: "GOAL", node_number: "2", name: "Zero Hunger", color_value: "#DDA63A", status: "ACTIVE" },
      { id: "TARGET_2_1", node_code: "TARGET_2_1", level_code: "TARGET", node_number: "2.1", name: "End hunger and ensure access to food", parent_node_code: "GOAL_02", status: "ACTIVE" },
    ],
  },
  {
    code: "node-relationships",
    label: "Node Relations",
    tableName: "metadata.framework_node_relationships",
    dependency: "Create nodes first, then link parent to child. Relation type supports parent-child and related.",
    columns: [
      { key: "parent_node_code", label: "Parent" },
      { key: "child_node_code", label: "Child" },
      { key: "relationship_type", label: "Type" },
      { key: "sort_order", label: "Sort" },
      { key: "is_active", label: "Active" },
    ],
    rows: [
      { id: "REL_GOAL_01_TARGET_1_2", parent_node_code: "GOAL_01", child_node_code: "TARGET_1_2", relationship_type: "PARENT_CHILD", sort_order: "10", is_active: "YES" },
      { id: "REL_GOAL_02_TARGET_2_1", parent_node_code: "GOAL_02", child_node_code: "TARGET_2_1", relationship_type: "PARENT_CHILD", sort_order: "20", is_active: "YES" },
    ],
  },
  {
    code: "global-indicators",
    label: "Global Indicators",
    tableName: "metadata.global_indicators",
    dependency: "Global indicators can be mapped to national indicators after both are created.",
    columns: [
      { key: "global_indicator_code", label: "Global code" },
      { key: "indicator_number", label: "Number" },
      { key: "name", label: "Name" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { id: "GIND_1_2_1", global_indicator_code: "GIND_1_2_1", indicator_number: "1.2.1", name: "Global indicator 1.2.1", status: "ACTIVE" },
      { id: "GIND_2_1_1", global_indicator_code: "GIND_2_1_1", indicator_number: "2.1.1", name: "Global indicator 2.1.1", status: "ACTIVE" },
      { id: "GIND_3_8_1", global_indicator_code: "GIND_3_8_1", indicator_number: "3.8.1", name: "Global indicator 3.8.1", status: "ACTIVE" },
    ],
  },
  {
    code: "national-indicators",
    label: "National Indicators",
    tableName: "metadata.national_indicators",
    dependency: "Create national indicator, current version, measure, framework mapping, global mapping, and source assignment.",
    columns: [
      { key: "national_indicator_code", label: "Indicator" },
      { key: "indicator_number", label: "Number" },
      { key: "name", label: "Name" },
      { key: "mapped_node_code", label: "Mapped node" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { id: "NIF_1_2_1", national_indicator_code: "NIF_1_2_1", indicator_number: "1.2.1", name: "Population below poverty line", owning_unit_code: "SDG", mapped_node_code: "TARGET_1_2", mapped_node_path: "GOAL_01 > TARGET_1_2", status: "ACTIVE" },
      { id: "NIF_2_1_1", national_indicator_code: "NIF_2_1_1", indicator_number: "2.1.1", name: "Prevalence of undernourishment", owning_unit_code: "SDG", mapped_node_code: "TARGET_2_1", mapped_node_path: "GOAL_02 > TARGET_2_1", status: "ACTIVE" },
      { id: "NIF_3_8_1", national_indicator_code: "NIF_3_8_1", indicator_number: "3.8.1", name: "Essential health service coverage", owning_unit_code: "SDG", mapped_node_code: "TARGET_3_8", mapped_node_path: "GOAL_03 > TARGET_3_8", status: "DRAFT" },
    ],
  },
  {
    code: "indicator-versions",
    label: "Indicator Versions",
    tableName: "metadata.indicator_versions",
    dependency: "Versions belong to national indicators. Current version drives measures/templates.",
    columns: [
      { key: "national_indicator_code", label: "Indicator" },
      { key: "version_code", label: "Version" },
      { key: "data_type", label: "Data type" },
      { key: "unit_of_measure_code", label: "Unit" },
      { key: "is_current", label: "Current" },
    ],
    rows: [
      { id: "NIF_1_2_1_V1", national_indicator_code: "NIF_1_2_1", version_code: "NIF_1_2_1_V1", data_type: "NUMERIC", unit_of_measure_code: "PERCENT", decimal_places: "2", is_current: "YES", status: "ACTIVE" },
      { id: "NIF_2_1_1_V1", national_indicator_code: "NIF_2_1_1", version_code: "NIF_2_1_1_V1", data_type: "NUMERIC", unit_of_measure_code: "PERCENT", decimal_places: "2", is_current: "YES", status: "ACTIVE" },
    ],
  },
  {
    code: "metadata-details",
    label: "Metadata Details",
    tableName: "metadata.indicator_metadata_details",
    dependency: "Metadata details are versioned through indicator_version_id.",
    columns: [
      { key: "version_code", label: "Version" },
      { key: "data_reference_period", label: "Reference period" },
      { key: "latest_data_availability", label: "Availability" },
      { key: "source_reference_code", label: "Source ref" },
      { key: "is_active", label: "Active" },
    ],
    rows: [
      { id: "MD_NIF_1_2_1_V1", version_code: "NIF_1_2_1_V1", data_reference_period: "FY 2025", latest_data_availability: "2025-26", source_reference_code: "SSD_SOURCE", is_active: "YES" },
      { id: "MD_NIF_2_1_1_V1", version_code: "NIF_2_1_1_V1", data_reference_period: "FY 2025", latest_data_availability: "2025-26", source_reference_code: "FOOD_SOURCE", is_active: "YES" },
    ],
  },
  {
    code: "units",
    label: "Units",
    tableName: "metadata.units",
    dependency: "Units are reusable measurement references. Indicator measures reference unit_code.",
    columns: [
      { key: "unit_code", label: "Unit" },
      { key: "name", label: "Name" },
      { key: "unit_type", label: "Type" },
      { key: "symbol", label: "Symbol" },
      { key: "is_active", label: "Active" },
    ],
    rows: [
      { id: "PERCENT", unit_code: "PERCENT", name: "Percent", unit_type: "RATIO", symbol: "%", is_active: "YES" },
      { id: "COUNT", unit_code: "COUNT", name: "Count", unit_type: "NUMBER", symbol: "count", is_active: "YES" },
      { id: "INDEX", unit_code: "INDEX", name: "Index", unit_type: "INDEX", symbol: "index", is_active: "YES" },
    ],
  },
  {
    code: "measures",
    label: "Measures",
    tableName: "metadata.indicator_measures",
    dependency: "Measures belong to indicator versions and reference Units for value collection.",
    columns: [
      { key: "version_code", label: "Version" },
      { key: "measure_code", label: "Measure" },
      { key: "value_type", label: "Type" },
      { key: "unit_code", label: "Unit" },
      { key: "is_required", label: "Required" },
    ],
    rows: [
      { id: "MEASURE_NIF_1_2_1_VALUE", version_code: "NIF_1_2_1_V1", measure_code: "INDICATOR_VALUE", value_type: "NUMERIC", unit_code: "PERCENT", aggregation_type: "SUM", is_required: "YES" },
      { id: "MEASURE_NIF_2_1_1_VALUE", version_code: "NIF_2_1_1_V1", measure_code: "INDICATOR_VALUE", value_type: "NUMERIC", unit_code: "PERCENT", aggregation_type: "SUM", is_required: "YES" },
    ],
  },
  {
    code: "periodicities",
    label: "Periodicities",
    tableName: "metadata.indicator_periodicities",
    dependency: "Source assignments reference periodicity for collection cadence.",
    columns: [
      { key: "periodicity_code", label: "Periodicity" },
      { key: "name", label: "Name" },
      { key: "months_interval", label: "Months" },
      { key: "sort_order", label: "Sort" },
      { key: "is_active", label: "Active" },
    ],
    rows: [
      { id: "ANNUAL", periodicity_code: "ANNUAL", name: "Annual", months_interval: "12", sort_order: "10", is_active: "YES" },
      { id: "QUARTERLY", periodicity_code: "QUARTERLY", name: "Quarterly", months_interval: "3", sort_order: "20", is_active: "YES" },
    ],
  },
  {
    code: "framework-mappings",
    label: "Framework Mappings",
    tableName: "metadata.framework_indicator_mappings",
    dependency: "Maps national indicators to dynamic framework nodes where level allows indicator mapping.",
    columns: [
      { key: "node_code", label: "Node" },
      { key: "national_indicator_code", label: "Indicator" },
      { key: "mapping_type", label: "Type" },
      { key: "is_active", label: "Active" },
    ],
    rows: [
      { id: "MAP_TARGET_1_2_NIF_1_2_1", node_code: "TARGET_1_2", national_indicator_code: "NIF_1_2_1", mapping_type: "PRIMARY", is_active: "YES" },
      { id: "MAP_TARGET_2_1_NIF_2_1_1", node_code: "TARGET_2_1", national_indicator_code: "NIF_2_1_1", mapping_type: "PRIMARY", is_active: "YES" },
    ],
  },
  {
    code: "global-mappings",
    label: "Global Mappings",
    tableName: "metadata.national_global_indicator_mappings",
    dependency: "Maps national indicators to global indicators with direct/proxy/partial type.",
    columns: [
      { key: "national_indicator_code", label: "National" },
      { key: "global_indicator_code", label: "Global" },
      { key: "mapping_type", label: "Type" },
      { key: "mapping_note", label: "Note" },
      { key: "is_active", label: "Active" },
    ],
    rows: [
      { id: "NIF_1_2_1_GIND_1_2_1", national_indicator_code: "NIF_1_2_1", global_indicator_code: "GIND_1_2_1", mapping_type: "DIRECT", mapping_note: "Direct national mapping", is_active: "YES" },
      { id: "NIF_2_1_1_GIND_2_1_1", national_indicator_code: "NIF_2_1_1", global_indicator_code: "GIND_2_1_1", mapping_type: "DIRECT", mapping_note: "Direct national mapping", is_active: "YES" },
    ],
  },
  {
    code: "organizations",
    label: "Ministries / Units",
    tableName: "org.organizations",
    dependency: "Organizations form a parent-child hierarchy. Officers and source assignments depend on this table.",
    columns: [
      { key: "organization_code", label: "Code" },
      { key: "organization_type", label: "Type" },
      { key: "parent_organization_code", label: "Parent" },
      { key: "name", label: "Name" },
      { key: "is_active", label: "Active" },
    ],
    rows: [
      { id: "MOSPI", organization_code: "MOSPI", organization_type: "MINISTRY", parent_organization_code: "ROOT", short_code: "MOSPI", name: "Ministry of Statistics and Programme Implementation", is_active: "YES" },
      { id: "SSD_DEMO_SOURCE", organization_code: "SSD_DEMO_SOURCE", organization_type: "DIVISION", parent_organization_code: "MOSPI", short_code: "SSD", name: "Social Statistics Division", is_active: "YES" },
      { id: "HEALTH_SOURCE", organization_code: "HEALTH_SOURCE", organization_type: "DEPARTMENT", parent_organization_code: "ROOT", short_code: "HLTH", name: "Health Reporting Cell", is_active: "YES" },
    ],
  },
  {
    code: "officers",
    label: "Officers",
    tableName: "org.officers",
    dependency: "Officers belong to organizations and may optionally link to auth users later.",
    columns: [
      { key: "officer_code", label: "Officer" },
      { key: "organization_code", label: "Organization" },
      { key: "display_name", label: "Name" },
      { key: "designation", label: "Designation" },
      { key: "is_active", label: "Active" },
    ],
    rows: [
      { id: "SSD_DEMO_OFFICER", officer_code: "SSD_DEMO_OFFICER", organization_code: "SSD_DEMO_SOURCE", display_name: "SSD Demo Officer", designation: "Nodal Officer", email: "not set", mobile_number: "not set", is_active: "YES" },
      { id: "HEALTH_OFFICER", officer_code: "HEALTH_OFFICER", organization_code: "HEALTH_SOURCE", display_name: "Health Officer", designation: "Data Officer", email: "not set", mobile_number: "not set", is_active: "YES" },
    ],
  },
  {
    code: "source-assignments",
    label: "Source Assignments",
    tableName: "org.indicator_source_assignments",
    dependency: "Assignments connect indicator -> organization -> officer -> periodicity.",
    columns: [
      { key: "national_indicator_code", label: "Indicator" },
      { key: "source_organization_code", label: "Source org" },
      { key: "officer_code", label: "Officer" },
      { key: "periodicity_code", label: "Periodicity" },
      { key: "assignment_role", label: "Role" },
    ],
    rows: [
      { id: "SRC_NIF_1_2_1_PRIMARY", national_indicator_code: "NIF_1_2_1", source_organization_code: "SSD_DEMO_SOURCE", officer_code: "SSD_DEMO_OFFICER", periodicity_code: "ANNUAL", assignment_role: "PRIMARY_SOURCE", valid_from: "2025-04-01", is_active: "YES" },
      { id: "SRC_NIF_1_2_1_REVIEW", national_indicator_code: "NIF_1_2_1", source_organization_code: "MOSPI", officer_code: "SSD_DEMO_OFFICER", periodicity_code: "ANNUAL", assignment_role: "REVIEW_SOURCE", valid_from: "2025-04-01", is_active: "YES" },
      { id: "SRC_NIF_1_2_1_SECONDARY", national_indicator_code: "NIF_1_2_1", source_organization_code: "HEALTH_SOURCE", officer_code: "HEALTH_OFFICER", periodicity_code: "ANNUAL", assignment_role: "SECONDARY_SOURCE", valid_from: "2025-04-01", is_active: "YES" },
      { id: "SRC_NIF_3_8_1_PRIMARY", national_indicator_code: "NIF_3_8_1", source_organization_code: "HEALTH_SOURCE", officer_code: "HEALTH_OFFICER", periodicity_code: "ANNUAL", assignment_role: "PRIMARY_SOURCE", valid_from: "2025-04-01", is_active: "YES" },
    ],
  },
];

export const getMasterTab = (code: MasterTabCode) => masterTabs.find((tab) => tab.code === code);

export const hierarchyLevelOptions = masterTabs.find((tab) => tab.code === "framework-levels")?.rows ?? [];

export const hierarchyNodeOptions = masterTabs.find((tab) => tab.code === "framework-nodes")?.rows ?? [];

export const indicatorMappingNodeOptions = hierarchyNodeOptions.filter((node) => {
  const level = hierarchyLevelOptions.find((item) => item.level_code === node.level_code);
  return level?.allows_indicator_mapping === "YES";
});

export const nationalIndicatorOptions = masterTabs.find((tab) => tab.code === "national-indicators")?.rows ?? [];

export const globalIndicatorOptions = masterTabs.find((tab) => tab.code === "global-indicators")?.rows ?? [];

export const organizationOptions = masterTabs.find((tab) => tab.code === "organizations")?.rows ?? [];

export const officerOptions = masterTabs.find((tab) => tab.code === "officers")?.rows ?? [];

export const periodicityOptions = masterTabs.find((tab) => tab.code === "periodicities")?.rows ?? [];

export const unitOptions = masterTabs.find((tab) => tab.code === "units")?.rows ?? [];
