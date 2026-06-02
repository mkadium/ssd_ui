import { useQuery } from "@tanstack/react-query";

import {
  unitScopeOptions,
  type UnitScopeOption,
} from "@/data/unitScope.sample";
import { authService } from "@/services/authService";
import type { AuthAdminUnit } from "@/types/auth";

function toUnitScopeOption(unit: AuthAdminUnit): UnitScopeOption {
  const status = unit.status === "DRAFT" || unit.status === "ARCHIVED" ? unit.status : "ACTIVE";

  return {
    unit_code: unit.unit_code,
    unit_name: unit.unit_name ?? unit.name ?? unit.unit_code,
    unit_type: unit.unit_type ?? "UNIT",
    jurisdiction: unit.jurisdiction ?? unit.parent_unit_code ?? "India",
    status,
  };
}

export function useUnitScopeOptions({
  enabled = true,
  locale,
}: {
  enabled?: boolean;
  locale: string;
}) {
  return useQuery({
    queryKey: ["auth", "admin", "units", locale],
    queryFn: async () => {
      const response = await authService.listAdminUnits();
      const apiUnits = response.data.map(toUnitScopeOption);

      return apiUnits.length > 0 ? apiUnits : unitScopeOptions;
    },
    enabled,
    retry: 1,
    placeholderData: unitScopeOptions,
  });
}
