/**
 * AccountShell — chrome de Mi cuenta con tabs Datos | Seguridad.
 * Tabs canónicos (RouteTabsNav = soft, igual que DetailPageShell).
 */

import { Outlet } from "react-router-dom";
import { Shield, User } from "lucide-react";
import { useAuth } from "@features/auth";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { RouteTabsNav } from "@shared/ui/tabs";
import { accountCopy } from "./accountCopy";

const ACCOUNT_TABS = [
  {
    id: "data",
    to: "/account",
    end: true,
    label: accountCopy.tabs.data,
    icon: User,
  },
  {
    id: "security",
    to: "/account/security",
    end: false,
    label: accountCopy.tabs.security,
    icon: Shield,
  },
] as const;

export function AccountShell() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <FormPageShell
      isLoading={false}
      header={{
        backHref: "/dashboard",
        backLabel: accountCopy.page.backLabel,
        icon: <User className="h-5 w-5" aria-hidden />,
        title: accountCopy.page.title,
        subtitle: user.getFullName(),
      }}
    >
      <div className="space-y-6">
        <RouteTabsNav
          items={ACCOUNT_TABS}
          aria-label={accountCopy.page.title}
        />
        <Outlet />
      </div>
    </FormPageShell>
  );
}
