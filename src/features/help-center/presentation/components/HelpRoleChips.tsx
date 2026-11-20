import { Check } from "lucide-react";
import {
  getAllRoles,
  ROLE_LABELS,
  ROLE_OPTIONS,
  type UserRole,
  isValidRole,
} from "@shared/constants/roles";
import { cn } from "@shared/lib/utils/cn";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const copy = helpCenterCopy.detail;

interface HelpRoleChipsProps {
  roles: string[];
  currentRole?: string | null;
  className?: string;
}

const ALL_ROLE_SET = new Set(getAllRoles());

function orderedArticleRoles(roles: string[]): UserRole[] {
  const set = new Set(
    roles.filter((r): r is UserRole => isValidRole(r)),
  );
  return ROLE_OPTIONS.map((o) => o.value).filter((r) => set.has(r));
}

/**
 * D2 — chips «Para quién». Solo lectura; resalta el rol del usuario autenticado.
 */
export function HelpRoleChips({
  roles,
  currentRole,
  className,
}: HelpRoleChipsProps) {
  if (roles.length === 0) return null;

  const unique = new Set(roles.filter((r) => isValidRole(r)));
  const coversAll =
    unique.size === ALL_ROLE_SET.size &&
    [...ALL_ROLE_SET].every((r) => unique.has(r));

  if (coversAll) {
    return (
      <p
        className={cn("text-sm text-muted-foreground", className)}
        data-help-roles=""
      >
        {copy.rolesAll}
      </p>
    );
  }

  const ordered = orderedArticleRoles(roles);
  if (ordered.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-xs",
        className,
      )}
      aria-label={copy.rolesLabel}
      data-help-roles=""
    >
      <span className="mr-0.5 font-medium text-muted-foreground">
        {copy.rolesLabel}
      </span>
      {ordered.map((role) => {
        const isMe = currentRole === role;
        const label = ROLE_LABELS[role];
        return (
          <span
            key={role}
            title={isMe ? copy.yourRoleTitle : undefined}
            data-help-role={role}
            data-help-role-me={isMe ? "true" : undefined}
            className={cn(
              "inline-flex h-[22px] items-center gap-1 rounded-full border px-2 font-medium",
              isMe
                ? "border-primary-200 bg-primary-50 text-primary-700"
                : "border-border bg-card text-foreground",
            )}
          >
            {isMe ? (
              <Check className="size-3 shrink-0" aria-hidden />
            ) : null}
            {label}
          </span>
        );
      })}
    </div>
  );
}
