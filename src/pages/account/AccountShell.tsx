/**
 * AccountShell — chrome NL de Mi cuenta (MC1–MC3).
 * Encabezado raíz sin back/icon; SectionTabs vía RouteTabsNav;
 * punto attention si admin ∧ MFA off; ancho común en ambos tabs.
 */

import { Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  authApi,
  MFA_STATUS_QUERY_KEY,
  useAuth,
} from "@features/auth";
import { ROLES, ROLE_LABELS, type UserRole } from "@shared/constants/roles";
import { formatDetailContext } from "@shared/ui/page-shells/formatDetailContext";
import { RouteTabsNav, type RouteTabsNavItem } from "@shared/ui/tabs";
import { accountCopy } from "./accountCopy";

export function AccountShell() {
  const { user } = useAuth();

  const isAdmin = user?.role === ROLES.ADMIN;

  const mfaQuery = useQuery({
    queryKey: MFA_STATUS_QUERY_KEY,
    queryFn: () => authApi.getMfaStatus(),
    enabled: Boolean(user),
  });

  if (!user) return null;

  const securityNeedsAttention =
    isAdmin && !mfaQuery.isLoading && mfaQuery.data?.enabled === false;

  const tabs: RouteTabsNavItem[] = [
    {
      id: "data",
      to: "/account",
      end: true,
      label: accountCopy.tabs.data,
    },
    {
      id: "security",
      to: "/account/security",
      end: false,
      label: accountCopy.tabs.security,
      ...(securityNeedsAttention
        ? {
            signal: "attention" as const,
            signalLabel: accountCopy.tabs.securityAttention,
          }
        : {}),
    },
  ];

  const roleLabel = ROLE_LABELS[user.role as UserRole] ?? user.role;
  const contextLine = formatDetailContext([
    user.getFullName(),
    roleLabel,
    user.getTenantName(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1040px] space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {accountCopy.page.title}
        </h1>
        {contextLine ? (
          <p className="text-sm text-muted-foreground">{contextLine}</p>
        ) : null}
      </header>

      <RouteTabsNav
        items={tabs}
        aria-label={accountCopy.page.tabsAriaLabel}
      />

      <Outlet />
    </div>
  );
}
