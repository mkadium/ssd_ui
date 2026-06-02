import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { canAccessRoute, getDefaultDashboardPath } from "@/lib/authRedirect";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, roles, pages } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessRoute(location.pathname, { roles, pages })) {
    return (
      <Navigate
        to={getDefaultDashboardPath({ roles, pages })}
        replace
        state={{ deniedFrom: location.pathname }}
      />
    );
  }

  return children;
}
