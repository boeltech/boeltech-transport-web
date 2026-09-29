import { useState } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
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
import { ChevronDown, SlidersHorizontal } from "lucide-react";

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
 * El periodo vive en el riel; no es recorte ni suma al badge.
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
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
