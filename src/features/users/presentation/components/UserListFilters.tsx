import { useState } from "react";
import { ROLE_OPTIONS } from "@shared/constants/roles";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { USER_STATUS_LABELS, UserStatus } from "../../domain";
import { usersCopy } from "../copy/usersCopy";

const filterCopy = usersCopy.list.filter;

export interface UserListFiltersProps {
  status: string;
  role: string;
  createdFrom: string;
  createdTo: string;
  lastLoginFrom: string;
  lastLoginTo: string;
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onCreatedFromChange: (value: string) => void;
  onCreatedToChange: (value: string) => void;
  onLastLoginFromChange: (value: string) => void;
  onLastLoginToChange: (value: string) => void;
}

/**
 * Recortes del padrón de usuarios (estado / rol / alta / último acceso).
 * El lookup vive en el search; cupo e invitaciones no son recortes.
 */
export function UserListFilters({
  status,
  role,
  createdFrom,
  createdTo,
  lastLoginFrom,
  lastLoginTo,
  activePanelFilterCount,
  onStatusChange,
  onRoleChange,
  onCreatedFromChange,
  onCreatedToChange,
  onLastLoginFromChange,
  onLastLoginToChange,
}: UserListFiltersProps) {
  const [userCollapsedWhileActive, setUserCollapsedWhileActive] = useState(false);
  const [userExpandedWhileIdle, setUserExpandedWhileIdle] = useState(false);

  const hasActiveFilters = activePanelFilterCount > 0;
  const open = hasActiveFilters
    ? !userCollapsedWhileActive
    : userExpandedWhileIdle;

  const handleOpenChange = (next: boolean) => {
    if (hasActiveFilters) {
      setUserCollapsedWhileActive(!next);
      return;
    }
    setUserExpandedWhileIdle(next);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className="contents"
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filterCopy.showFilters}
          {activePanelFilterCount > 0 ? (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
              {activePanelFilterCount}
            </Badge>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="order-last w-full basis-full">
        <Card className="bg-muted/30">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="users-filter-status">{filterCopy.statusLabel}</Label>
              <Select value={status || "all"} onValueChange={onStatusChange}>
                <SelectTrigger
                  id="users-filter-status"
                  className="w-full"
                  aria-label={filterCopy.statusLabel}
                >
                  <SelectValue placeholder={filterCopy.statusLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{filterCopy.statusAll}</SelectItem>
                  <SelectItem value={UserStatus.ACTIVE}>
                    {USER_STATUS_LABELS[UserStatus.ACTIVE]}
                  </SelectItem>
                  <SelectItem value={UserStatus.INACTIVE}>
                    {USER_STATUS_LABELS[UserStatus.INACTIVE]}
                  </SelectItem>
                  <SelectItem value={UserStatus.SUSPENDED}>
                    {USER_STATUS_LABELS[UserStatus.SUSPENDED]}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="users-filter-role">{filterCopy.roleLabel}</Label>
              <Select value={role || "all"} onValueChange={onRoleChange}>
                <SelectTrigger
                  id="users-filter-role"
                  className="w-full"
                  aria-label={filterCopy.roleLabel}
                >
                  <SelectValue placeholder={filterCopy.roleLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{filterCopy.roleAll}</SelectItem>
                  {ROLE_OPTIONS.map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <p className="text-sm font-medium leading-none">
                {filterCopy.createdHeading}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="users-created-from">{filterCopy.from}</Label>
                  <Input
                    id="users-created-from"
                    type="date"
                    value={createdFrom}
                    max={createdTo || undefined}
                    onChange={(event) => onCreatedFromChange(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="users-created-to">{filterCopy.to}</Label>
                  <Input
                    id="users-created-to"
                    type="date"
                    value={createdTo}
                    min={createdFrom || undefined}
                    onChange={(event) => onCreatedToChange(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <p className="text-sm font-medium leading-none">
                {filterCopy.lastLoginHeading}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="users-login-from">{filterCopy.from}</Label>
                  <Input
                    id="users-login-from"
                    type="date"
                    value={lastLoginFrom}
                    max={lastLoginTo || undefined}
                    onChange={(event) => onLastLoginFromChange(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="users-login-to">{filterCopy.to}</Label>
                  <Input
                    id="users-login-to"
                    type="date"
                    value={lastLoginTo}
                    min={lastLoginFrom || undefined}
                    onChange={(event) => onLastLoginToChange(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
