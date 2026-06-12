/**
 * Panel para personalizar orden y visibilidad de widgets del dashboard.
 */

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, LayoutDashboard } from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import { Button } from "@/shared/ui/button";
import { Switch } from "@shared/ui/switch";
import { Label } from "@/shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import type { DashboardWidgetPref, WidgetId } from "../../domain/layout";
import type { useDashboardLayout } from "../../application/hooks/useDashboardLayout";
import { getWidgetTitle } from "../widgets/registry";
import { dashboardCopy } from "../copy/dashboardCopy";

type LayoutApi = Pick<
  ReturnType<typeof useDashboardLayout>,
  | "customizableWidgets"
  | "setVisible"
  | "reorder"
  | "resetToRoleDefault"
  | "resetToSystemDefault"
>;

interface DashboardCustomizePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layoutApi: LayoutApi;
  /** Oculta acciones de reset de rol (p. ej. en settings de rol) */
  showUserResetActions?: boolean;
}

function SortableWidgetRow({
  id,
  title,
  visible,
  onVisibleChange,
}: {
  id: WidgetId;
  title: string;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3",
        isDragging && "opacity-80 shadow-md z-10",
      )}
    >
      <button
        type="button"
        className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Reordenar ${title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{title}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Label htmlFor={`widget-visible-${id}`} className="text-xs text-muted-foreground">
          {dashboardCopy.customize.visibleLabel}
        </Label>
        <Switch
          id={`widget-visible-${id}`}
          checked={visible}
          onCheckedChange={onVisibleChange}
        />
      </div>
    </div>
  );
}

export function DashboardCustomizePanel({
  open,
  onOpenChange,
  layoutApi,
  showUserResetActions = true,
}: DashboardCustomizePanelProps) {
  const {
    customizableWidgets,
    setVisible,
    reorder,
    resetToRoleDefault,
    resetToSystemDefault,
  } = layoutApi;

  const orderedIds = useMemo(
    () => customizableWidgets.map((w: DashboardWidgetPref) => w.id),
    [customizableWidgets],
  );

  const [localIds, setLocalIds] = useState<WidgetId[]>(orderedIds);

  useEffect(() => {
    setLocalIds(orderedIds);
  }, [orderedIds]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayIds =
    localIds.length === orderedIds.length &&
    localIds.every((id) => orderedIds.includes(id))
      ? localIds
      : orderedIds;

  const prefById = useMemo(
    () =>
      new Map<WidgetId, DashboardWidgetPref>(
        customizableWidgets.map((w: DashboardWidgetPref) => [w.id, w]),
      ),
    [customizableWidgets],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayIds.indexOf(active.id as WidgetId);
    const newIndex = displayIds.indexOf(over.id as WidgetId);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(displayIds, oldIndex, newIndex) as WidgetId[];
    setLocalIds(next);
    reorder(next);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            {dashboardCopy.customize.title}
          </SheetTitle>
          <SheetDescription>{dashboardCopy.customize.description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {displayIds.map((id: WidgetId) => {
                  const pref = prefById.get(id);
                  if (!pref) return null;
                  return (
                    <SortableWidgetRow
                      key={id}
                      id={id}
                      title={getWidgetTitle(id)}
                      visible={pref.visible}
                      onVisibleChange={(v) => setVisible(id, v)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          {showUserResetActions ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  resetToRoleDefault();
                  setLocalIds(orderedIds);
                }}
              >
                {dashboardCopy.customize.resetRole}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  resetToSystemDefault();
                  setLocalIds(orderedIds);
                }}
              >
                {dashboardCopy.customize.resetSystem}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                resetToSystemDefault();
                setLocalIds(orderedIds);
              }}
            >
              {dashboardCopy.customize.resetSystem}
            </Button>
          )}
          <Button
            type="button"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {dashboardCopy.customize.done}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
