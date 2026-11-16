import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useListQueueFromState } from "@shared/utils/listQueueFrom";
import {
  Ban,
  History,
  KeyRound,
  Mail,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Skeleton } from "@shared/ui/skeleton";
import { formatTime } from "@shared/utils/dateUtils";
import type { UserManagementEvent } from "../../domain";
import { userActivityPageCopy } from "../copy/userActivityPageCopy";
import {
  describeUserActivityEvent,
  type UserActivityCategory,
  type UserActivitySegment,
} from "../helpers/userActivityCopy";
import { groupUserActivityByDay } from "../helpers/userActivityGrouping";

/**
 * Feed/bitácora cronológica (no listado Operate).
 *
 * Excepción al padrón §7 `EntityListTable` / filas de grupo: la unidad de lectura
 * es una frase narrativa por evento, agrupada por día civil como encabezado de
 * sección. Paralelo: historial de Approvals (`ApprovalHistorySheet`).
 */

const CATEGORY_ICONS: Record<UserActivityCategory, LucideIcon> = {
  alta: UserPlus,
  rol: ShieldCheck,
  baja: Ban,
  invitacion: Mail,
  contrasena: KeyRound,
  otro: History,
};

interface UserActivityFeedProps {
  readonly events: readonly UserManagementEvent[];
  /** Nombres por id para no mostrar identificadores en la frase. */
  readonly subjectNames?: ReadonlyMap<string, string>;
  /** `false` en la tarjeta del detalle: el sujeto es la cuenta que ya se está viendo. */
  readonly includeSubject?: boolean;
  /** Enlaza los nombres a la ficha del usuario. */
  readonly linkPeople?: boolean;
}

function PersonSegment({
  segment,
  linkPeople,
}: {
  segment: Extract<UserActivitySegment, { kind: "person" }>;
  linkPeople: boolean;
}) {
  const fromState = useListQueueFromState();
  if (linkPeople && segment.userId) {
    return (
      <Link
        to={`/users/${segment.userId}`}
        state={fromState}
        className="font-medium text-primary hover:underline"
      >
        {segment.text}
      </Link>
    );
  }
  return <span className="font-medium">{segment.text}</span>;
}

function UserActivityRow({
  event,
  subjectNames,
  includeSubject,
  linkPeople,
}: {
  event: UserManagementEvent;
  subjectNames?: ReadonlyMap<string, string>;
  includeSubject: boolean;
  linkPeople: boolean;
}) {
  const description = describeUserActivityEvent(event, {
    includeSubject,
    subjectName: event.subjectUserId
      ? subjectNames?.get(event.subjectUserId)
      : null,
  });
  const Icon = CATEGORY_ICONS[description.category];

  return (
    <li className="flex items-start gap-3 py-2.5">
      <time
        dateTime={event.createdAt}
        className="w-16 shrink-0 pt-1 text-xs tabular-nums text-muted-foreground"
      >
        {formatTime(event.createdAt)}
      </time>
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          description.emphasis
            ? "bg-warning-soft text-warning-soft-foreground"
            : "bg-muted text-muted-foreground",
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm leading-snug">
          {description.sentence.map((segment, index) =>
            segment.kind === "person" ? (
              <PersonSegment
                key={index}
                segment={segment}
                linkPeople={linkPeople}
              />
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </p>
        {description.detail ? (
          <p className="text-xs leading-snug text-muted-foreground">
            {description.detail}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function FeedDaySkeleton({ rows }: { rows: number }) {
  return (
    <section className="space-y-1">
      <div className="flex items-baseline gap-2 border-b border-border pb-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-3 w-28" />
      </div>
      <ul className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <li key={index} className="flex items-start gap-3 py-2.5">
            <Skeleton className="mt-1 h-3 w-12 shrink-0" />
            <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5 pt-1">
              <Skeleton className="h-3.5 w-full max-w-md" />
              <Skeleton className="h-3 w-40 max-w-full" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Historial de usuarios agrupado por día, con una frase legible por evento. */
export function UserActivityFeed({
  events,
  subjectNames,
  includeSubject = true,
  linkPeople = true,
}: UserActivityFeedProps) {
  const groups = useMemo(() => groupUserActivityByDay(events), [events]);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key || "undated"} className="space-y-1">
          <div className="flex items-baseline gap-2 border-b border-border pb-2">
            {/* Sentence-case: sin `uppercase` CSS (P7 / D5). */}
            <h3 className="text-sm font-medium text-foreground">
              {group.label}
            </h3>
            <span className="text-xs text-muted-foreground">
              {userActivityPageCopy.groups.count(group.events.length)}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {group.events.map((event) => (
              <UserActivityRow
                key={event.id}
                event={event}
                subjectNames={subjectNames}
                includeSubject={includeSubject}
                linkPeople={linkPeople}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Placeholder del feed durante la primera carga (misma forma: día + filas). */
export function UserActivityFeedSkeleton({ rows = 6 }: { rows?: number }) {
  const firstGroup = Math.max(2, Math.ceil(rows / 2));
  const secondGroup = Math.max(2, rows - firstGroup);

  return (
    <div className="space-y-8" aria-busy="true" aria-hidden="true">
      <FeedDaySkeleton rows={firstGroup} />
      <FeedDaySkeleton rows={secondGroup} />
    </div>
  );
}
