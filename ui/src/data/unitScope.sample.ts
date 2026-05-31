export type UnitScopeOption = {
  unit_code: string;
  unit_name: string;
  unit_type: string;
  jurisdiction: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
};

export const unitScopeOptions: UnitScopeOption[] = [
  {
    unit_code: "SDG",
    unit_name: "SDG Coordination Unit",
    unit_type: "NATIONAL_COORDINATION",
    jurisdiction: "India",
    status: "ACTIVE",
  },
  {
    unit_code: "MOSPI",
    unit_name: "Ministry of Statistics and Programme Implementation",
    unit_type: "MINISTRY",
    jurisdiction: "India",
    status: "ACTIVE",
  },
  {
    unit_code: "SSD_DEMO_SOURCE",
    unit_name: "Social Statistics Division",
    unit_type: "DIVISION",
    jurisdiction: "India",
    status: "ACTIVE",
  },
  {
    unit_code: "STATE_UNIT",
    unit_name: "State Planning Unit",
    unit_type: "STATE_UNIT",
    jurisdiction: "State sample",
    status: "DRAFT",
  },
];
