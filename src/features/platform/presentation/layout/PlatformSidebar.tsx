import { memo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { ScrollArea } from "@shared/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { usePlatformSidebar } from "../providers/PlatformSidebarProvider";
import { platformCopy } from "../copy/platformCopy";
import { PlatformBrandMark } from "./PlatformBrandMark";
import {
  isPlatformNavItemActive,
  PLATFORM_NAV_ITEMS,
} from "./platformNavigation";

export const PlatformSidebar = memo(function PlatformSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCollapsed, toggle } = usePlatformSidebar();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-[260px]",
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
          <Link
            to="/platform"
            className={cn(
              "flex items-center overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
              isCollapsed ? "justify-center" : "w-full",
            )}
            aria-label={platformCopy.brand.name}
          >
            <PlatformBrandMark compact={isCollapsed} />
          </Link>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav className="space-y-1 p-2">
            {PLATFORM_NAV_ITEMS.map((item) => {
              const active = isPlatformNavItemActive(location.pathname, item.href);
              const Icon = item.icon;

              const content = (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    isCollapsed && "justify-center px-2",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.id}>{content}</div>;
            })}
          </nav>
        </ScrollArea>

        <div className="space-y-1 border-t border-sidebar-border p-2">
          <PlatformSidebarAction
            icon={ExternalLink}
            label={platformCopy.nav.erpLink}
            isCollapsed={isCollapsed}
            onClick={() => navigate("/login")}
          />

          <Button
            variant="ghost"
            size="sm"
            className={cn("mt-1 w-full justify-center", isCollapsed && "px-0")}
            onClick={toggle}
            aria-label={platformCopy.shell.collapseSidebar}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span>{platformCopy.shell.collapseSidebar}</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
});

interface PlatformSidebarActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
}

const PlatformSidebarAction = memo(function PlatformSidebarAction({
  icon: Icon,
  label,
  isCollapsed,
  onClick,
}: PlatformSidebarActionProps) {
  const content = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        isCollapsed && "justify-center px-2",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed ? <span className="truncate">{label}</span> : null}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return content;
});
