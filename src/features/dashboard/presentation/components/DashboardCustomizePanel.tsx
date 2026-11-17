/**
 * Panel Personalizar — zonas fijas (solo lectura) + extras debajo (v2).
 */

import { useMemo, useState } from "react";
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
  | "fixedZoneLabels"
  | "resetToRoleDefault"
  | "applyLayoutDraft"
>;

interface DashboardCustomizePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layoutApi: LayoutApi;
  /** Reservado (settings de rol); Restablecer siempre visible en v2. */
  showUserResetActions?: boolean;
}

type DraftPref = { id: WidgetId; visible: boolean };

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
        <p className="text-xs text-muted-foreground">
          {dashboardCopy.customize.analysisHint}
        </p>
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

function CustomizeDraftBody({
  customizableWidgets,
  fixedZoneLabels,
  resetToRoleDefault,
  applyLayoutDraft,
  onClose,
}: {
  customizableWidgets: DashboardWidgetPref[];
  fixedZoneLabels: string[];
  resetToRoleDefault: () => void;
  applyLayoutDraft: ReturnType<typeof useDashboardLayout>["applyLayoutDraft"];
  onClose: () => void;
}) {
  const initialIds = customizableWidgets.map((w) => w.id);
  const [localIds, setLocalIds] = useState<WidgetId[]>(initialIds);
  const [draftVisible, setDraftVisible] = useState<DraftPref[]>(() =>
    customizableWidgets.map((w) => ({ id: w.id, visible: w.visible })),
  );
  const [dirty, setDirty] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const displayIds =
    localIds.length === initialIds.length &&
    localIds.every((id) => initialIds.includes(id))
      ? localIds
      : initialIds;

  const visibleById = useMemo(
    () => new Map(draftVisible.map((d) => [d.id, d.visible])),
    [draftVisible],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayIds.indexOf(active.id as WidgetId);
    const newIndex = displayIds.indexOf(over.id as WidgetId);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(displayIds, oldIndex, newIndex) as WidgetId[];
    setLocalIds(next);
    setDirty(true);
  }

  function handleSave() {
    if (dirty) {
      applyLayoutDraft({
        orderedIds: displayIds,
        visibility: draftVisible,
      });
    }
    onClose();
  }

  function handleReset() {
    resetToRoleDefault();
    onClose();
  }

  return (
    <>
      <div className="flex-1 space-y-6 overflow-y-auto py-4">
        {fixedZoneLabels.length > 0 ? (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              {dashboardCopy.customize.alwaysVisible}
            </h3>
            <ul className="space-y-1.5">
              {fixedZoneLabels.map((label) => (
                <li
                  key={label}
                  className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                >
                  {label}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            {dashboardCopy.customize.addBelow}
          </h3>
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
                  const visible = visibleById.get(id) ?? false;
                  return (
                    <SortableWidgetRow
                      key={id}
                      id={id}
                      title={getWidgetTitle(id)}
                      visible={visible}
                      onVisibleChange={(v) => {
                        setDraftVisible((prev) =>
                          prev.map((p) =>
                            p.id === id ? { ...p, visible: v } : p,
                          ),
                        );
                        setDirty(true);
                      }}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      </div>

      <SheetFooter className="flex-col gap-2 sm:flex-col">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleReset}
        >
          {dashboardCopy.customize.reset}
        </Button>
        <div className="flex w-full gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            {dashboardCopy.customize.cancel}
          </Button>
          <Button type="button" className="flex-1" onClick={handleSave}>
            {dashboardCopy.customize.save}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

export function DashboardCustomizePanel({
  open,
  onOpenChange,
  layoutApi,
}: DashboardCustomizePanelProps) {
  const {
    customizableWidgets,
    fixedZoneLabels,
    resetToRoleDefault,
    applyLayoutDraft,
  } = layoutApi;

  const draftKey = customizableWidgets
    .map((w) => `${w.id}:${w.visible ? 1 : 0}:${w.order}`)
    .join("|");

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

        {open ? (
          <CustomizeDraftBody
            key={draftKey}
            customizableWidgets={customizableWidgets}
            fixedZoneLabels={fixedZoneLabels}
            resetToRoleDefault={resetToRoleDefault}
            applyLayoutDraft={applyLayoutDraft}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
