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
import { PlatformNavActiveRail } from "./PlatformNavActiveRail";
import { platformNavItemClassName } from "./platformNavItemStyles";

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
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
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
          <nav className="space-y-0.5 p-3">
            {PLATFORM_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isPlatformNavItemActive(location.pathname, item.href);

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  onClick={handleNavClick}
                  aria-current={active ? "page" : undefined}
                  className={platformNavItemClassName({ isActive: active })}
                >
                  <PlatformNavActiveRail visible={active} />
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
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
