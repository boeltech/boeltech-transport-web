import { memo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { ScrollArea } from "@shared/ui/scroll-area";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { usePlatformSidebar } from "../providers/PlatformSidebarProvider";
import { platformCopy } from "../copy/platformCopy";
import { PlatformBrandMark } from "./PlatformBrandMark";
import {
  isPlatformNavItemActive,
  PLATFORM_NAV_ITEMS,
} from "./platformNavigation";
import { isPlatformOwner } from "../../domain/entities";

export const PlatformMobileSidebar = memo(function PlatformMobileSidebar() {
  const location = useLocation();
  const { user, logout } = usePlatformAuth();
  const { isMobileOpen, closeMobile } = usePlatformSidebar();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        closeMobile();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, closeMobile]);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const handleLogout = () => {
    closeMobile();
    logout();
  };

  const handleNavClick = () => {
    closeMobile();
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={platformCopy.shell.openMenu}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            to="/platform"
            className="flex items-center gap-2"
            onClick={handleNavClick}
            aria-label={platformCopy.brand.name}
          >
            <PlatformBrandMark />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeMobile}
            aria-label={platformCopy.shell.closeMenu}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {user ? (
          <div className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {user.firstName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {platformCopy.roles[user.platformRole] ?? user.platformRole}
                  {!isPlatformOwner(user.platformRole)
                    ? ` · ${platformCopy.shell.readOnlyHint}`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <ScrollArea className="min-h-0 flex-1">
          <nav className="space-y-1 p-3">
            {PLATFORM_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isPlatformNavItemActive(location.pathname, item.href);

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <Link
            to="/login"
            onClick={handleNavClick}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            {platformCopy.nav.erpLink}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {platformCopy.nav.logout}
          </button>
        </div>
      </aside>
    </>
  );
});
