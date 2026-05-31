export type ValidationRuleStatus = "ACTIVE" | "DRAFT" | "RETIRED";
export type ValidationBindingStatus = "ACTIVE" | "INACTIVE";

export type ValidationRuleSample = {
  rule_code: string;
  rule_type: "REQUIRED" | "RANGE" | "COMPARISON" | "FORMAT";
  severity: "INFO" | "WARNING" | "ERROR" | "BLOCKER";
  status: ValidationRuleStatus;
  name: string;
  message_template: string;
  safe_expression_label: string;
};

export type ValidationBindingSample = {
  binding_code: string;
  rule_code: string;
  template_version_code: string;
  measure_code: string;
  cell_scope: string;
  status: ValidationBindingStatus;
};

export const validationRules: ValidationRuleSample[] = [
  {
    rule_code: "REQUIRED_WHEN_REQUESTED",
    rule_type: "REQUIRED",
    severity: "ERROR",
    status: "ACTIVE",
    name: "Required when requested",
    message_template: "A requested value is required before submit.",
    safe_expression_label: "Configured rule; no executable expression stored",
  },
  {
    rule_code: "NUMERIC_NON_NEGATIVE",
    rule_type: "RANGE",
    severity: "ERROR",
    status: "ACTIVE",
    name: "Numeric non-negative",
    message_template: "Numeric values must be greater than or equal to zero.",
    safe_expression_label: "Minimum value: 0",
  },
  {
    rule_code: "PREVIOUS_PERIOD_VARIANCE",
    rule_type: "COMPARISON",
    severity: "WARNING",
    status: "ACTIVE",
    name: "Previous period variance",
    message_template: "Value differs from expected range compared with previous approved value.",
    safe_expression_label: "Reference comparison threshold",
  },
  {
    rule_code: "DECIMAL_PLACES_2",
    rule_type: "FORMAT",
    severity: "WARNING",
    status: "ACTIVE",
    name: "Two decimal places",
    message_template: "Use up to two decimal places.",
    safe_expression_label: "Decimal places <= 2",
  },
];

export const validationBindings: ValidationBindingSample[] = [
  {
    binding_code: "VALBIND_TPL_NIF_1_2_1_REQUIRED",
    rule_code: "REQUIRED_WHEN_REQUESTED",
    template_version_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP_V1",
    measure_code: "INDICATOR_VALUE",
    cell_scope: "Editable requested cells",
    status: "ACTIVE",
  },
  {
    binding_code: "VALBIND_TPL_NIF_1_2_1_NON_NEGATIVE",
    rule_code: "NUMERIC_NON_NEGATIVE",
    template_version_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP_V1",
    measure_code: "INDICATOR_VALUE",
    cell_scope: "Numeric values",
    status: "ACTIVE",
  },
  {
    binding_code: "VALBIND_TPL_NIF_1_2_1_VARIANCE",
    rule_code: "PREVIOUS_PERIOD_VARIANCE",
    template_version_code: "TPL_SDG_NIF_1_2_1_STATE_SUBGROUP_V1",
    measure_code: "INDICATOR_VALUE",
    cell_scope: "Comparison-enabled cells",
    status: "ACTIVE",
  },
];
