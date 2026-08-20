/**
 * Selects de remolque(s) condicionales a ConfigVehicular S/R (ADR-0077 D3–D6).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Link } from "react-router-dom";
import { AlertTriangle, Container, Plus } from "lucide-react";
import { configVehicularLikelyRequiresRemolques } from "@boeltech/cfdi-domain";
import {
  CreateTrailerSheet,
  useAssignableTrailers,
  type AssignableTrailerItem,
} from "@features/trailers";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { wizardCopy } from "../../../copy";
import type { TripWizardFormValues } from "./validation";

const copy = wizardCopy.basicInfo;

const NONE = "__none__";

function TrailerSelectOptions({
  available,
  blocked,
  includeEmpty,
}: {
  available: AssignableTrailerItem[];
  blocked: AssignableTrailerItem[];
  includeEmpty?: boolean;
}) {
  if (available.length === 0 && blocked.length === 0 && !includeEmpty) {
    return (
      <SelectItem value="no-trailers" disabled>
        {copy.state.noTrailers}
      </SelectItem>
    );
  }

  return (
    <>
      {includeEmpty ? (
        <SelectItem value={NONE}>Sin segundo remolque</SelectItem>
      ) : null}
      {available.length > 0 ? (
        <SelectGroup>
          <SelectLabel>{copy.state.available}</SelectLabel>
          {available.map((trailer) => (
            <SelectItem key={trailer.id} value={trailer.id}>
              {copy.format.trailerOption(
                trailer.licensePlate,
                trailer.satSubTipoRemCode,
              )}
            </SelectItem>
          ))}
        </SelectGroup>
      ) : includeEmpty ? null : (
        <SelectItem value="no-trailers" disabled>
          {copy.state.noTrailers}
        </SelectItem>
      )}
      {blocked.length > 0 ? (
        <>
          {available.length > 0 || includeEmpty ? <SelectSeparator /> : null}
          <SelectGroup>
            <SelectLabel className="flex items-center gap-1.5 text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              {copy.state.notAssignable}
            </SelectLabel>
            {blocked.map((trailer) => (
              <SelectItem
                key={trailer.id}
                value={trailer.id}
                disabled
                className="opacity-60"
              >
                <span className="flex items-center gap-2">
                  {copy.format.trailerOption(
                    trailer.licensePlate,
                    trailer.satSubTipoRemCode,
                  )}
                  {trailer.blockReason ? (
                    <Badge variant="outline" className="text-[10px]">
                      {trailer.blockReason}
                    </Badge>
                  ) : null}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </>
      ) : null}
    </>
  );
}

export interface TripTrailerAssignmentFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  vehicles: AssignableVehicleItem[];
  idPrefix?: string;
}

export function TripTrailerAssignmentFields({
  form,
  vehicles,
  idPrefix = "",
}: TripTrailerAssignmentFieldsProps) {
  const { control, watch, setValue, getValues } = form;
  const selectedVehicleId = watch("vehicleId");
  const trailers = watch("trailers") ?? [];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTargetPosition, setSheetTargetPosition] = useState<1 | 2>(1);
  const [showSecondSelect, setShowSecondSelect] = useState(false);

  const { data: assignableTrailers = [], isLoading } = useAssignableTrailers({
    refetchOnMount: "always",
  });
  const keepAssignableTrailerIds = useRef(
    new Set(
      (getValues("trailers") ?? []).map((item) => item.trailerId),
    ),
  ).current;

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId],
  );

  const configCode = (
    selectedVehicle?.satConfigAutotransporteCode ?? ""
  ).trim();
  const requiresTrailers =
    !!configCode && configVehicularLikelyRequiresRemolques(configCode);

  useEffect(() => {
    setValue("satConfigAutotransporteCode", configCode, {
      shouldDirty: false,
      shouldValidate: true,
    });
    if (!requiresTrailers) {
      const current = getValues("trailers") ?? [];
      if (current.length > 0) {
        setValue("trailers", [], { shouldDirty: true, shouldValidate: true });
      }
      setShowSecondSelect(false);
    }
  }, [configCode, requiresTrailers, setValue, getValues]);

  useEffect(() => {
    if ((trailers ?? []).some((t) => t.position === 2)) {
      setShowSecondSelect(true);
    }
  }, [trailers]);

  if (!requiresTrailers) {
    return null;
  }

  const firstTrailerId = trailers.find((t) => t.position === 1)?.trailerId;
  const secondTrailerId = trailers.find((t) => t.position === 2)?.trailerId;

  const listsFor = (position: 1 | 2) => {
    const otherId =
      position === 1
        ? trailers.find((t) => t.position === 2)?.trailerId
        : trailers.find((t) => t.position === 1)?.trailerId;
    const inScope = assignableTrailers.filter((t) => t.id !== otherId);
    const available: AssignableTrailerItem[] = [];
    const blocked: AssignableTrailerItem[] = [];
    for (const trailer of inScope) {
      if (trailer.canBeAssigned || keepAssignableTrailerIds.has(trailer.id)) {
        available.push(trailer);
      } else {
        blocked.push(trailer);
      }
    }
    return { available, blocked };
  };

  const setTrailerAt = (position: 1 | 2, trailerId: string | undefined) => {
    const rest = (getValues("trailers") ?? []).filter(
      (t) => t.position !== position,
    );
    const next =
      trailerId && trailerId !== NONE
        ? [...rest, { trailerId, position }].sort(
            (a, b) => a.position - b.position,
          )
        : rest;
    setValue("trailers", next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Remolques (Config S/R)</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setSheetTargetPosition(showSecondSelect && firstTrailerId ? 2 : 1);
            setSheetOpen(true);
          }}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Alta rápida
        </Button>
      </div>

      <Controller
        control={control}
        name="trailers"
        render={({ fieldState }) => (
          <FormFieldShell
            fieldId={`${idPrefix}trailer-1`}
            label="Remolque 1"
            required
            errorMessage={fieldState.error?.message}
          >
            <Select
              value={firstTrailerId ?? ""}
              onValueChange={(value) => setTrailerAt(1, value)}
              disabled={isLoading}
            >
              <SelectTrigger
                id={`${idPrefix}trailer-1`}
                error={Boolean(fieldState.error)}
                {...getFieldErrorAriaProps(
                  `${idPrefix}trailer-1`,
                  fieldState.error?.message,
                )}
              >
                <Container className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Selecciona remolque" />
              </SelectTrigger>
              <SelectContent>
                <TrailerSelectOptions {...listsFor(1)} />
              </SelectContent>
            </Select>
          </FormFieldShell>
        )}
      />

      {showSecondSelect ? (
        <FormFieldShell
          fieldId={`${idPrefix}trailer-2`}
          label="Remolque 2 (opcional)"
        >
          <Select
            value={secondTrailerId ?? NONE}
            onValueChange={(value) => {
              if (value === NONE) {
                setTrailerAt(2, undefined);
                setShowSecondSelect(false);
                return;
              }
              setTrailerAt(2, value);
            }}
            disabled={isLoading}
          >
            <SelectTrigger id={`${idPrefix}trailer-2`}>
              <Container className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Segundo remolque" />
            </SelectTrigger>
            <SelectContent>
              <TrailerSelectOptions {...listsFor(2)} includeEmpty />
            </SelectContent>
          </Select>
        </FormFieldShell>
      ) : (
        <Button
          type="button"
          variant="link"
          className="h-auto px-0"
          disabled={!firstTrailerId}
          onClick={() => setShowSecondSelect(true)}
        >
          Añadir segundo remolque
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Maestro:{" "}
        <Link to="/trailers" className="underline underline-offset-2">
          Flota → Remolques
        </Link>
      </p>

      <CreateTrailerSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreated={(created) => {
          setTrailerAt(sheetTargetPosition, created.id);
          if (sheetTargetPosition === 2) setShowSecondSelect(true);
        }}
      />
    </div>
  );
}
