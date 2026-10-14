import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  NOTIFICATION_READ_STATUS,
  NOTIFICATION_SEVERITIES,
  NOTIFICATION_SOURCES,
  type ListNotificationsFilters,
  type NotificationReadStatus,
  type NotificationSeverity,
  type NotificationSource,
} from "../../domain";
import {
  NOTIFICATION_SEVERITY_LABELS,
  NOTIFICATION_SOURCE_LABELS,
  notificationsCopy,
} from "../copy/notificationsCopy";

const copy = notificationsCopy.filter;

export interface NotificationFiltersProps {
  filters: ListNotificationsFilters;
  onChange: (next: ListNotificationsFilters) => void;
  /** Recortes del panel (estado ≠ all / fuente / severidad). */
  activePanelFilterCount: number;
}

/**
 * Recortes del inbox (estado / fuente / severidad).
 * Shell canónico: `ListingFilterPanel`.
 */
export function NotificationFilters({
  filters,
  onChange,
  activePanelFilterCount,
}: NotificationFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="lg:grid-cols-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="notifications-filter-status">{notificationsCopy.status}</Label>
        <Select
          value={filters.status ?? "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              status: value as NotificationReadStatus,
              page: 1,
            })
          }
        >
          <SelectTrigger
            id="notifications-filter-status"
            className="w-full"
            aria-label={notificationsCopy.status}
          >
            <SelectValue placeholder={notificationsCopy.status} />
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_READ_STATUS.map((status) => (
              <SelectItem key={status} value={status}>
                {status === "all"
                  ? notificationsCopy.all
                  : status === "unread"
                    ? notificationsCopy.unread
                    : notificationsCopy.read}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notifications-filter-source">{notificationsCopy.source}</Label>
        <Select
          value={filters.source ?? "__all__"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              source:
                value === "__all__" ? undefined : (value as NotificationSource),
              page: 1,
            })
          }
        >
          <SelectTrigger
            id="notifications-filter-source"
            className="w-full"
            aria-label={notificationsCopy.source}
          >
            <SelectValue placeholder={notificationsCopy.source} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{notificationsCopy.all}</SelectItem>
            {NOTIFICATION_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {NOTIFICATION_SOURCE_LABELS[source]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notifications-filter-severity">
          {notificationsCopy.severity}
        </Label>
        <Select
          value={filters.severity ?? "__all__"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              severity:
                value === "__all__"
                  ? undefined
                  : (value as NotificationSeverity),
              page: 1,
            })
          }
        >
          <SelectTrigger
            id="notifications-filter-severity"
            className="w-full"
            aria-label={notificationsCopy.severity}
          >
            <SelectValue placeholder={notificationsCopy.severity} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{notificationsCopy.all}</SelectItem>
            {NOTIFICATION_SEVERITIES.map((severity) => (
              <SelectItem key={severity} value={severity}>
                {NOTIFICATION_SEVERITY_LABELS[severity]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ListingFilterPanel>
  );
}
