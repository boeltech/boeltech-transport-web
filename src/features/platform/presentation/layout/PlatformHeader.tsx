import { memo } from "react";
import { Link } from "react-router-dom";
import { LogOut, Menu, User } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { ThemeCycleButton } from "@shared/ui/theme";
import { getUserFullName, getUserInitials } from "@shared/lib/userHelpers";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { usePlatformSidebar } from "../providers/PlatformSidebarProvider";
import { platformCopy } from "../copy/platformCopy";
import { PlatformBrandMark } from "./PlatformBrandMark";
import { isPlatformOwner } from "../../domain/entities";

interface PlatformHeaderProps {
  className?: string;
}

export const PlatformHeader = memo(function PlatformHeader({
  className,
}: PlatformHeaderProps) {
  const { user, logout } = usePlatformAuth();
  const { isCollapsed, openMobile } = usePlatformSidebar();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-4 transition-all duration-300 ease-in-out",
        "left-0 lg:left-[260px]",
        isCollapsed && "lg:left-[70px]",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={openMobile}
          aria-label={platformCopy.shell.openMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="lg:hidden">
          <PlatformBrandMark className="gap-2" />
        </div>

        <p className="hidden text-sm text-muted-foreground md:block">
          {platformCopy.shell.headerContext}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ThemeCycleButton />
        <PlatformUserMenu user={user} onLogout={logout} />
      </div>
    </header>
  );
});

interface PlatformUserMenuProps {
  user: ReturnType<typeof usePlatformAuth>["user"];
  onLogout: () => void | Promise<void>;
}

const PlatformUserMenu = memo(function PlatformUserMenu({
  user,
  onLogout,
}: PlatformUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {getUserInitials(user)}
          </div>
          <div className="hidden flex-col items-start text-left md:flex">
            <span className="text-sm font-medium">{getUserFullName(user)}</span>
            <span className="text-xs text-muted-foreground">
              {user
                ? (platformCopy.roles[user.platformRole] ?? user.platformRole)
                : platformCopy.shell.guestRole}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{getUserFullName(user)}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {user ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            <User className="mr-2 h-4 w-4" />
            {platformCopy.roles[user.platformRole] ?? user.platformRole}
            {!isPlatformOwner(user.platformRole)
              ? ` · ${platformCopy.shell.readOnlyHint}`
              : ""}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/login">{platformCopy.nav.erpLink}</Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {platformCopy.nav.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
