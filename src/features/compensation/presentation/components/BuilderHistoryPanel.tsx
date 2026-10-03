import { Link } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDateTime } from "@shared/utils/dateUtils";
import {
  useTemplateActivity,
  useTemplateVersions,
} from "../../application/hooks";
import { compensationTemplateBuildPath } from "../../application/compensationRoutes";
import type { CompensationTemplate } from "../../domain/entities";
import {
  COMPENSATION_TEMPLATE_EVENT_ACTION_LABELS,
  COMPENSATION_TEMPLATE_STATUS_LABELS,
} from "../../domain/enums";
import { CompensationTemplateStatusBadge } from "../config/compensationStatusConfig";
import { compensationCopy } from "../copy/compensationCopy";

const copy = compensationCopy.builder;

interface BuilderHistoryPanelProps {
  template: CompensationTemplate;
}

function actorLabel(event: {
  actorFirstName?: string | null;
  actorLastName?: string | null;
  actorEmail?: string | null;
}): string | null {
  const name = [event.actorFirstName, event.actorLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (name) return name;
  return event.actorEmail ?? null;
}

export function BuilderHistoryPanel({ template }: BuilderHistoryPanelProps) {
  const { data: versions, isLoading: versionsLoading } = useTemplateVersions(
    template.id,
  );
  const { data: activity, isLoading: activityLoading } = useTemplateActivity(
    template.id,
    { pageSize: 20 },
  );

  return (
    <div className="space-y-6 text-sm">
      <section className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {copy.historyVersionsTitle}
        </h3>
        {versionsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !versions || versions.length === 0 ? (
          <p className="text-muted-foreground">{copy.historyEmptyVersions}</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((version) => {
              const isCurrent = version.id === template.id;
              return (
                <li
                  key={version.id}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {copy.versionBadge(version.version)}
                      </span>
                      <CompensationTemplateStatusBadge status={version.status} />
                      {isCurrent ? (
                        <Badge variant="secondary" tone="soft">
                          {copy.historyCurrentBadge}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {COMPENSATION_TEMPLATE_STATUS_LABELS[version.status]}
                    </p>
                  </div>
                  {!isCurrent ? (
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link to={compensationTemplateBuildPath(version.id)}>
                        {copy.historyOpenVersion}
                      </Link>
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {copy.historyActivityTitle}
        </h3>
        {activityLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !activity?.data.length ? (
          <p className="text-muted-foreground">{copy.historyEmptyActivity}</p>
        ) : (
          <ul className="space-y-2">
            {activity.data.map((event) => {
              const who = actorLabel(event);
              return (
                <li
                  key={event.id}
                  className="rounded-md border px-3 py-2 text-xs"
                >
                  <p className="font-medium text-foreground">
                    {COMPENSATION_TEMPLATE_EVENT_ACTION_LABELS[event.action] ??
                      event.action}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                    {who ? ` · ${who}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
