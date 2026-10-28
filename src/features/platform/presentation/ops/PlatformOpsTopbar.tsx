import { Menu, Search } from "lucide-react";
import { getUserFullName } from "@shared/lib/userHelpers";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { opsCopy } from "./opsCopy";
import { OpsOperatorMark } from "./patterns/OpsOperatorMark";
import { OpsButton } from "./ui/OpsButton";
import { OpsThemeToggle } from "./ui/OpsThemeToggle";

interface PlatformOpsTopbarProps {
  onOpenCommand: () => void;
  menuOpen?: boolean;
  onOpenMenu?: () => void;
}

export function PlatformOpsTopbar({
  onOpenCommand,
  menuOpen = false,
  onOpenMenu,
}: PlatformOpsTopbarProps) {
  const { user } = usePlatformAuth();

  return (
    <header
      className="ops-bg-elevated ops-border fixed right-0 top-0 z-30 flex h-[var(--ops-topbar-h)] items-center justify-between border-b px-3 left-0 lg:left-[var(--ops-rail-w)]"
      role="banner"
      data-testid="platform-ops-topbar"
    >
      <OpsButton
        variant="ghost"
        size="sm"
        className="ops-nav-toggle shrink-0"
        aria-label={opsCopy.nav.openMenu}
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        data-testid="ops-nav-menu"
        onClick={onOpenMenu}
      >
        <Menu className="h-4 w-4" aria-hidden />
      </OpsButton>
      <OpsButton
        variant="ghost"
        onClick={onOpenCommand}
        className="ops-topbar-search max-w-md flex-1 justify-start gap-2"
        aria-label={opsCopy.cmdk.trigger}
        data-testid="ops-topbar-search"
      >
        <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate text-left">{opsCopy.cmdk.placeholder}</span>
        <kbd className="ops-rounded ml-auto hidden border ops-border px-1.5 py-0.5 ops-type-caption ops-text-muted sm:inline">
          {opsCopy.cmdk.shortcutHint}
        </kbd>
      </OpsButton>

      <div className="ml-3 flex items-center gap-2 ops-type-caption">
        <OpsThemeToggle />
        <span className="hidden max-w-[10rem] truncate ops-text sm:inline">
          {user ? getUserFullName(user) : "—"}
        </span>
        <OpsOperatorMark role={user?.platformRole} />
      </div>
    </header>
  );
}
