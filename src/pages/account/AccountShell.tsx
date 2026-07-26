/**
 * AccountShell — chrome de Mi cuenta con tabs Datos | Seguridad.
 */

import { NavLink, Outlet } from "react-router-dom";
import { Shield, User } from "lucide-react";
import { useAuth } from "@features/auth";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { cn } from "@shared/lib/utils/cn";
import { accountCopy } from "./accountCopy";

const TABS = [
  {
    to: "/account",
    end: true,
    label: accountCopy.tabs.data,
    icon: User,
  },
  {
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
        <nav
          className="flex gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1"
          aria-label={accountCopy.page.title}
        >
          {TABS.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </FormPageShell>
  );
}
