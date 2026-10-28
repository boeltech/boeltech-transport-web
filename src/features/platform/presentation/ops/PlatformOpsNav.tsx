import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { isPlatformOwner } from "../../domain/entities";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import {
  OPS_NAV_ITEMS,
  OPS_SECONDARY_NAV,
  OPS_TERTIARY_NAV,
  isOpsNavItemActive,
} from "./opsNavigation";
import { opsCopy } from "./opsCopy";
import { OpsButton } from "./ui/OpsButton";

interface PlatformOpsNavProps {
  pathname: string;
  onNavigate?: () => void;
}

/**
 * Secciones de la consola. La usa el riel y el sheet de ancho estrecho.
 */
export function PlatformOpsNav({ pathname, onNavigate }: PlatformOpsNavProps) {
  const { logout, user } = usePlatformAuth();
  const showDesignSystem = isPlatformOwner(user?.platformRole);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Secciones">
        {OPS_NAV_ITEMS.map((item) => {
          const active = isOpsNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.href}
              aria-current={active ? "page" : undefined}
              className="ops-nav-link ops-ring-accent"
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-0.5 border-t ops-border p-2">
        {OPS_SECONDARY_NAV.map((item) => {
          const active = isOpsNavItemActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.href}
              aria-current={active ? "page" : undefined}
              className="ops-nav-link"
              onClick={onNavigate}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        {showDesignSystem
          ? OPS_TERTIARY_NAV.map((item) => {
              const active = isOpsNavItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  aria-current={active ? "page" : undefined}
                  className="ops-nav-link"
                  data-testid="ops-nav-design-system"
                  onClick={onNavigate}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                </Link>
              );
            })
          : null}
        <Link to="/login" className="ops-nav-link" onClick={onNavigate}>
          {opsCopy.nav.erpLink}
        </Link>
        <OpsButton
          variant="ghost"
          size="sm"
          className="ops-nav-link w-full justify-start ops-text-danger"
          onClick={() => {
            onNavigate?.();
            void logout();
          }}
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          {opsCopy.nav.logout}
        </OpsButton>
      </div>
    </div>
  );
}
