import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@app/providers/AuthProvider";

export const useRequirePermission = (
  permission: string,
  redirectTo = "/forbidden"
) => {
  const { hasPermission, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const allowed = hasPermission(permission);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !allowed) {
      navigate(redirectTo, { replace: true });
    }
  }, [allowed, isAuthenticated, isLoading, navigate, redirectTo]);

  return { allowed, isLoading };
};
