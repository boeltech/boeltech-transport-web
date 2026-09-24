import { memo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { ScrollArea } from "@shared/ui/scroll-area";
import { usePlatformSidebar } from "../providers/PlatformSidebarProvider";
import { platformCopy } from "../copy/platformCopy";
import { PlatformBrandMark } from "./PlatformBrandMark";
import {
  isPlatformNavItemActive,
  PLATFORM_NAV_ITEMS,
} from "./platformNavigation";

export const PlatformMobileSidebar = memo(function PlatformMobileSidebar() {
  const location = useLocation();
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
          "fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={platformCopy.shell.openMenu}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            to="/platform"
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
            onClick={handleNavClick}
            aria-label={platformCopy.brand.name}
          >
            <PlatformBrandMark sidebarSurface />
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
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    active &&
                      "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                  )}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                    />
                  ) : null}
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
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {platformCopy.nav.erpLink}
          </Link>
        </div>
      </aside>
    </>
  );
});
