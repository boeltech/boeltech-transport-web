/**
 * UserCard
 *
 * Tarjeta de usuario para vista en grid.
 * Menú ⋯ vía EntityListCard (usable sin hover — D2).
 */

import { CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import {
  EntityListCard,
  entityListCardMenuTriggerClassName,
} from "@shared/ui/listing";
import { Shield, UserRound, Clock } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { ROLE_LABELS } from "@shared/constants/roles";
import { formatDateTime } from "@shared/utils/dateUtils";
import type { UserListItem, UserStatusType } from "../../domain";
import { UserStatus } from "../../domain";
import { UserStatusBadge } from "../config/userStatusConfig";
import { usersCopy } from "../copy/usersCopy";
import { UserActions } from "./UserActions";

interface UserCardProps {
  user: UserListItem;
  onView: (id: string) => void;
  onStatusChange?: (id: string, status: UserStatusType) => void;
  className?: string;
}

export function UserCard({
  user,
  onView,
  onStatusChange,
  className,
}: UserCardProps) {
  const displayName = `${user.firstName} ${user.lastName}`.trim();
  const isInactive = user.status !== UserStatus.ACTIVE;

  return (
    <EntityListCard
      className={cn(isInactive && "opacity-60", className)}
      onClick={() => onView(user.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-lg leading-none">
                {displayName}
              </h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <UserActions
              userId={user.id}
              userName={displayName}
              status={user.status}
              onStatusChange={onStatusChange}
              menuTriggerClassName={entityListCardMenuTriggerClassName}
              menuAriaLabel={usersCopy.list.card.actionsAria}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4 shrink-0" />
            <span className="truncate">{ROLE_LABELS[user.role] ?? user.role}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="truncate">{formatDateTime(user.lastLogin)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-3">
        <UserStatusBadge status={user.status} size="sm" showIcon />
      </CardFooter>
    </EntityListCard>
  );
}
