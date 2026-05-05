import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Shield, UserRound, Eye, Clock } from "lucide-react";
import { ROLE_LABELS } from "@shared/constants/roles";
import { formatDateTime } from "@shared/utils/dateUtils";
import type { UserListItem, UserStatusType } from "../../domain";
import { UserStatusBadge } from "../config/userStatusConfig";
import { UserActions } from "./UserActions";

interface UserCardProps {
  user: UserListItem;
  onView: (id: string) => void;
  onStatusChange?: (id: string, status: UserStatusType) => void;
}

export function UserCard({ user, onView, onStatusChange }: UserCardProps) {
  const displayName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <Card
      className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
      onClick={() => onView(user.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-lg leading-none">{displayName}</h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            <UserActions
              userId={user.id}
              userName={displayName}
              status={user.status}
              onStatusChange={onStatusChange}
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
        <div className="flex w-full items-center justify-between gap-2">
          <UserStatusBadge status={user.status} size="sm" showIcon />
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-primary hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onView(user.id);
            }}
          >
            Ver más
            <Eye className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
