import { ListingFilterPanel } from "@shared/ui/listing";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import {
  USER_ACTIVITY_ACTION_GROUPS,
  userActivityPageCopy,
} from "../copy/userActivityPageCopy";

const filterCopy = userActivityPageCopy.filters;
const ALL_OPTION = "__all__";

export interface UserActivityDirectoryOption {
  value: string;
  label: string;
}

export interface UserActivityFiltersProps {
  action: string;
  subjectUserId: string;
  actorUserId: string;
  directory: readonly UserActivityDirectoryOption[];
  activePanelFilterCount: number;
  onActionChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onActorChange: (value: string) => void;
}

/**
 * Recortes de la bitácora (tipo / persona / actor).
 * Shell canónico: `ListingFilterPanel`. El periodo vive en el riel;
 * no es recorte ni suma al badge.
 */
export function UserActivityFilters({
  action,
  subjectUserId,
  actorUserId,
  directory,
  activePanelFilterCount,
  onActionChange,
  onSubjectChange,
  onActorChange,
}: UserActivityFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={filterCopy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="user-activity-action">{filterCopy.actionLabel}</Label>
        <Select
          value={action || ALL_OPTION}
          onValueChange={(value) =>
            onActionChange(value === ALL_OPTION ? "" : value)
          }
        >
          <SelectTrigger
            id="user-activity-action"
            className="w-full"
            aria-label={filterCopy.actionLabel}
          >
            <SelectValue placeholder={filterCopy.actionLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>{filterCopy.actionAll}</SelectItem>
            {USER_ACTIVITY_ACTION_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-activity-subject">{filterCopy.personLabel}</Label>
        <Select
          value={subjectUserId || ALL_OPTION}
          onValueChange={(value) =>
            onSubjectChange(value === ALL_OPTION ? "" : value)
          }
        >
          <SelectTrigger
            id="user-activity-subject"
            className="w-full"
            aria-label={filterCopy.personLabel}
          >
            <SelectValue placeholder={filterCopy.personLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>{filterCopy.personAll}</SelectItem>
            {directory.map((entry) => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user-activity-actor">{filterCopy.actorLabel}</Label>
        <Select
          value={actorUserId || ALL_OPTION}
          onValueChange={(value) =>
            onActorChange(value === ALL_OPTION ? "" : value)
          }
        >
          <SelectTrigger
            id="user-activity-actor"
            className="w-full"
            aria-label={filterCopy.actorLabel}
          >
            <SelectValue placeholder={filterCopy.actorLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OPTION}>{filterCopy.actorAll}</SelectItem>
            {directory.map((entry) => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ListingFilterPanel>
  );
}
