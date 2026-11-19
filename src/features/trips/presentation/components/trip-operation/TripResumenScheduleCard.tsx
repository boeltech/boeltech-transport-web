import { useState } from "react";

import type { Trip } from "@features/trips/domain";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { EntityListTable, type EntityListColumnDef } from "@shared/ui/table";

import { operationCopy } from "../../copy";
import { TripScheduleInlineEditor } from "./TripScheduleInlineEditor";
import {
  buildScheduleComparisonRows,
  buildScheduleFooterText,
  type ScheduleComparisonRow,
} from "./buildScheduleComparisonRows";

const copy = operationCopy;

const COLUMNS: EntityListColumnDef<ScheduleComparisonRow>[] = [
  {
    id: "event",
    header: copy.scheduleTable.event,
    kind: "text",
    accessor: (row) => (
      <span className="font-semibold text-foreground">{row.event}</span>
    ),
  },
  {
    id: "scheduled",
    header: copy.scheduleTable.scheduled,
    kind: "text",
    accessor: (row) => row.scheduled,
  },
  {
    id: "actual",
    header: copy.scheduleTable.actual,
    kind: "text",
    accessor: (row) => row.actual,
  },
  {
    id: "difference",
    header: copy.scheduleTable.difference,
    kind: "text",
    accessor: (row) => row.difference,
  },
  {
    id: "mileageKm",
    header: copy.scheduleTable.mileageKm,
    kind: "number",
    accessor: (row) => row.mileageKm,
  },
];

export interface TripResumenScheduleCardProps {
  trip: Trip;
  canEdit: boolean;
}

export function TripResumenScheduleCard({
  trip,
  canEdit,
}: TripResumenScheduleCardProps) {
  const [editing, setEditing] = useState(false);
  const rows = buildScheduleComparisonRows(trip);
  const footer = buildScheduleFooterText(trip);
  const showEditor = canEdit && editing;

  return (
    <Card data-testid="trip-operation-schedule-card">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base">{copy.section.schedule}</CardTitle>
          <CardDescription>{copy.hint.schedule}</CardDescription>
        </div>
        {canEdit && !editing ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => setEditing(true)}
          >
            {copy.action.editSchedule}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {showEditor ? (
          <div className="space-y-3">
            <TripScheduleInlineEditor trip={trip} readOnly={false} />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              {copy.action.cancelSchedule}
            </Button>
          </div>
        ) : (
          <EntityListTable
            aria-label={copy.scheduleTable.ariaLabel}
            columns={COLUMNS}
            rows={rows}
            getRowId={(row) => row.id}
            density="compact"
            framed={false}
            footer={
              footer ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">{footer}</p>
              ) : undefined
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
