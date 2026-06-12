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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

interface NotificationFiltersProps {
  filters: ListNotificationsFilters;
  onChange: (next: ListNotificationsFilters) => void;
}

export function NotificationFilters({
  filters,
  onChange,
}: NotificationFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
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
        <SelectTrigger className="w-[140px]" aria-label={notificationsCopy.status}>
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
        <SelectTrigger className="w-[160px]" aria-label={notificationsCopy.source}>
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
        <SelectTrigger className="w-[160px]" aria-label={notificationsCopy.severity}>
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
  );
}
