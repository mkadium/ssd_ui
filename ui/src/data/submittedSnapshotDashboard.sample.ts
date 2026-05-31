export type SnapshotSummaryCard = {
  code: string;
  label: string;
  value: string;
  helper: string;
  tone: "blue" | "green" | "orange" | "purple" | "red";
};

export type SnapshotGoalStatus = {
  goal_code: string;
  goal_label: string;
  approved_indicators: number;
  published_indicators: number;
  pending_publication: number;
};

export type SnapshotSourceUnit = {
  unit_code: string;
  unit_name: string;
  approved_count: number;
  published_count: number;
  pending_count: number;
  health_percent: number;
};

export type SnapshotIndicator = {
  indicator_code: string;
  indicator_label: string;
  goal_code: string;
  target_code: string;
  source_unit_code: string;
  latest_year: string;
  latest_value: string;
  validation_status: string;
  review_status: string;
  publication_status: string;
};

export const snapshotSummaryCards: SnapshotSummaryCard[] = [
  {
    code: "APPROVED_INDICATORS",
    label: "Approved indicators",
    value: "24",
    helper: "Ready evidence",
    tone: "green",
  },
  {
    code: "PUBLISHED_INDICATORS",
    label: "Published",
    value: "18",
    helper: "Public-ready",
    tone: "blue",
  },
  {
    code: "PENDING_PUBLICATION",
    label: "Pending publication",
    value: "6",
    helper: "Awaiting release",
    tone: "orange",
  },
  {
    code: "GOAL_COVERAGE",
    label: "Goals covered",
    value: "4",
    helper: "First-demo set",
    tone: "purple",
  },
  {
    code: "PUBLIC_BOUNDARY",
    label: "Public boundary",
    value: "ON",
    helper: "Admin controlled",
    tone: "green",
  },
];

export const snapshotGoalRows: SnapshotGoalStatus[] = [
  {
    goal_code: "GOAL_01",
    goal_label: "No Poverty",
    approved_indicators: 8,
    published_indicators: 6,
    pending_publication: 2,
  },
  {
    goal_code: "GOAL_02",
    goal_label: "Zero Hunger",
    approved_indicators: 5,
    published_indicators: 4,
    pending_publication: 1,
  },
  {
    goal_code: "GOAL_03",
    goal_label: "Good Health",
    approved_indicators: 7,
    published_indicators: 5,
    pending_publication: 2,
  },
  {
    goal_code: "GOAL_04",
    goal_label: "Quality Education",
    approved_indicators: 4,
    published_indicators: 3,
    pending_publication: 1,
  },
];

export const snapshotSourceUnits: SnapshotSourceUnit[] = [
  {
    unit_code: "SSD_DEMO_SOURCE",
    unit_name: "Social Statistics Division",
    approved_count: 10,
    published_count: 8,
    pending_count: 2,
    health_percent: 92,
  },
  {
    unit_code: "STATE_UNIT",
    unit_name: "State Planning Unit",
    approved_count: 6,
    published_count: 5,
    pending_count: 1,
    health_percent: 86,
  },
  {
    unit_code: "EDU_SOURCE",
    unit_name: "Education Data Cell",
    approved_count: 5,
    published_count: 3,
    pending_count: 2,
    health_percent: 74,
  },
  {
    unit_code: "HEALTH_SOURCE",
    unit_name: "Health Reporting Cell",
    approved_count: 3,
    published_count: 2,
    pending_count: 1,
    health_percent: 68,
  },
];

export const snapshotIndicators: SnapshotIndicator[] = [
  {
    indicator_code: "NIF_1_2_1",
    indicator_label: "Population below poverty line",
    goal_code: "GOAL_01",
    target_code: "TARGET_1_2",
    source_unit_code: "SSD_DEMO_SOURCE",
    latest_year: "2012-13",
    latest_value: "24.1%",
    validation_status: "PASSED",
    review_status: "APPROVED",
    publication_status: "PUBLISHED",
  },
  {
    indicator_code: "NIF_2_1_1",
    indicator_label: "Prevalence of undernourishment",
    goal_code: "GOAL_02",
    target_code: "TARGET_2_1",
    source_unit_code: "SSD_DEMO_SOURCE",
    latest_year: "2012-13",
    latest_value: "12.6%",
    validation_status: "PASSED",
    review_status: "APPROVED",
    publication_status: "PUBLISHED",
  },
  {
    indicator_code: "NIF_3_8_1",
    indicator_label: "Essential health service coverage",
    goal_code: "GOAL_03",
    target_code: "TARGET_3_8",
    source_unit_code: "HEALTH_SOURCE",
    latest_year: "2012-13",
    latest_value: "62.4",
    validation_status: "PASSED",
    review_status: "APPROVED",
    publication_status: "READY",
  },
  {
    indicator_code: "NIF_4_1_1",
    indicator_label: "School completion rate",
    goal_code: "GOAL_04",
    target_code: "TARGET_4_1",
    source_unit_code: "EDU_SOURCE",
    latest_year: "2012-13",
    latest_value: "81.2%",
    validation_status: "PASSED",
    review_status: "APPROVED",
    publication_status: "READY",
  },
];
