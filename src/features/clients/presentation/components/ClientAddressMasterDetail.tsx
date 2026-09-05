/**
 * ClientAddressMasterDetail
 * Clean Architecture - Presentation Layer
 *
 * Layout master-detail para gestionar las direcciones de un cliente.
 * Reemplaza al antiguo `<ClientAddressSection>` que usaba un Modal por
 * dirección (rompía el flujo de edición del detalle del cliente).
 *
 * Estructura:
 *   ┌─────────────────┬────────────────────────────────┐
 *   │ Lista master    │ Panel detail                   │
 *   │ (compacta,      │ (read-only o form inline)      │
 *   │  selectable)    │                                │
 *   └─────────────────┴────────────────────────────────┘
 *
 * Modos del panel detail (estado interno):
 *   - "view"   → ClientAddressDetailView con botones Editar / Eliminar
 *   - "edit"   → ClientAddressForm con botones Cancelar / Guardar
 *   - "create" → ClientAddressForm vacío (mismo flujo que edit)
 *   - "empty"  → cliente sin direcciones todavía
 *
 * El delete dispara un AlertDialog de confirmación. Las mutations
 * (create/update/delete) se guardan inmediatamente — esto es intencional
 * porque las direcciones son sub-recursos persistentes con CRUD propio.
 *
 * Ubicación: src/features/clients/presentation/components/ClientAddressMasterDetail.tsx
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Loader2, MapPin, Plus } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { EmptyState } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";
import { useMediaQuery } from "@shared/hooks";
import { isApiError } from "@shared/api/interceptors/error-handler";

import {
  useClientAddress,
  useClientAddresses,
  useCreateClientAddress,
  useDeleteClientAddress,
  useSetPrimaryClientAddress,
  useUpdateClientAddress,
} from "../../application";
import type { ClientAddressListItem as ClientAddressListItemEntity } from "../../domain";
import {
  ClientAddressForm,
  type ClientAddressFormRef,
} from "./ClientAddressForm";
import { ClientAddressListRow } from "./ClientAddressListItem";
import { ClientAddressDetailView } from "./ClientAddressDetailView";
import {
  clientAddressFormDataToCreateDto,
  clientAddressFormDataToUpdateDto,
  validateClientAddressFormComplete,
  type ClientAddressFormData,
} from "../validation/clientAddressSchema";
import { groupClientAddressesByPurpose } from "../config/clientAddressPurpose";
import { clientDetailCopy } from "../copy/clientDetailCopy";

const copy = clientDetailCopy.address;

// ============================================================================
// TYPES
// ============================================================================

export interface ClientAddressMasterDetailProps {
  clientId: string;
  /** RFC del cliente (para pre-llenar el remitente/destinatario en el form). */
  clientRfc?: string;
  /** Razón social del cliente (para pre-llenar el nombre del remitente). */
  clientName?: string;
  /**
   * Solo lectura: lista + detalle sin CRUD (pestaña de detalle de cliente).
   * En edición de cliente se omite o se pasa `false`.
   */
  readOnly?: boolean;
  className?: string;
}

type Mode = "view" | "edit" | "create";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Sort: principal primero, luego activas, luego por addressType.
 */
function sortAddresses(
  list: ClientAddressListItemEntity[],
): ClientAddressListItemEntity[] {
  return [...list].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.addressType.localeCompare(b.addressType);
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientAddressMasterDetail({
  clientId,
  clientRfc,
  clientName,
  readOnly = false,
  className,
}: ClientAddressMasterDetailProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const {
    data: addresses,
    isLoading,
    isError: isAddressesError,
    refetch: refetchAddresses,
  } = useClientAddresses(clientId);
  const sorted = useMemo(
    () => (addresses ? sortAddresses(addresses) : []),
    [addresses],
  );
  const grouped = useMemo(
    () => groupClientAddressesByPurpose(sorted),
    [sorted],
  );

  // ── Estado del master-detail ─────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [pendingDelete, setPendingDelete] =
    useState<ClientAddressListItemEntity | null>(null);

  const formRef = useRef<ClientAddressFormRef>(null);
  const effectiveMode: Mode = readOnly ? "view" : mode;

  /**
   * Selección efectiva en modo vista: si `selectedId` no existe en la lista
   * (p. ej. tras borrar) o es null, se muestra la primera dirección — sin
   * `useEffect` (evita react-hooks/set-state-in-effect).
   */
  const resolvedViewId = useMemo(() => {
    if (sorted.length === 0) return null;
    if (selectedId != null && sorted.some((a) => a.id === selectedId)) {
      return selectedId;
    }
    return sorted[0].id;
  }, [sorted, selectedId]);

  const detailFetchId = useMemo(() => {
    if (effectiveMode === "create") return undefined;
    if (effectiveMode === "edit") return selectedId ?? resolvedViewId ?? undefined;
    return resolvedViewId ?? undefined;
  }, [effectiveMode, selectedId, resolvedViewId]);

  const listHighlightId =
    effectiveMode === "edit" ? (selectedId ?? resolvedViewId) : resolvedViewId;

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useCreateClientAddress();
  const updateMutation = useUpdateClientAddress();
  const setPrimaryMutation = useSetPrimaryClientAddress();
  const deleteMutation = useDeleteClientAddress();
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    setPrimaryMutation.isPending ||
    deleteMutation.isPending;

  // ── Detalle full de la dirección seleccionada ────────────────────────────
  const {
    data: selectedAddressFull,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useClientAddress(clientId, detailFetchId);

  const showDetailUnavailable =
    !isLoadingDetail &&
    detailFetchId != null &&
    (isDetailError || selectedAddressFull == null);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMode("view");
  };

  const handleStartCreate = () => {
    if (readOnly) return;
    setSelectedId(null);
    setMode("create");
  };

  const handleStartEdit = () => {
    setSelectedId((prev) => prev ?? resolvedViewId);
    setMode("edit");
  };

  const handleCancelForm = () => {
    setMode("view");
    // Si veníamos de "create" sin selección previa, intentar auto-seleccionar
    if (selectedId === null && sorted.length > 0) {
      setSelectedId(sorted[0].id);
    }
  };

  const handleSubmitForm = async () => {
    if (isPending) return;

    const valid = await formRef.current?.triggerValidation();
    if (!valid) return;

    const values = formRef.current?.getValues();
    if (!values) return;

    const packageResult = await validateClientAddressFormComplete(values, {
      context: "additional",
      requireCoordinates: false,
      intent: mode === "edit" ? "update" : "create",
    });
    if (!packageResult.ok) {
      formRef.current?.applySatFieldErrors(packageResult.fieldErrors);
      return;
    }

    const applyApiFieldErrors = (error: Error) => {
      if (isApiError(error) && error.hasValidationErrors()) {
        formRef.current?.applyApiValidationErrors(
          error.validationErrors.map((entry) => ({
            field: entry.field,
            message: entry.message,
          })),
        );
      }
    };

    if (mode === "create") {
      createMutation.mutate(
        {
          clientId,
          data: clientAddressFormDataToCreateDto(values, {
            context: "additional",
          }),
        },
        {
          onSuccess: (created) => {
            setMode("view");
            // El backend debería retornar el id; si lo hace, seleccionar la nueva
            if (created && "id" in created && typeof created.id === "string") {
              setSelectedId(created.id);
            }
          },
          onError: applyApiFieldErrors,
        },
      );
    } else if (mode === "edit") {
      const addressId = selectedId ?? resolvedViewId;
      if (!addressId) return;
      updateMutation.mutate(
        {
          clientId,
          addressId,
          data: clientAddressFormDataToUpdateDto(values, {
            context: "additional",
          }),
        },
        {
          onSuccess: () => {
            setMode("view");
          },
          onError: applyApiFieldErrors,
        },
      );
    }
  };

  const handleSubmitFormRef = useRef(handleSubmitForm);
  const handleCancelFormRef = useRef(handleCancelForm);

  useEffect(() => {
    handleSubmitFormRef.current = handleSubmitForm;
    handleCancelFormRef.current = handleCancelForm;
  });

  // Atajos consistentes para formulario (guardar/cancelar).
  useEffect(() => {
    if (readOnly) return;
    if (effectiveMode !== "create" && effectiveMode !== "edit") return;
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSubmitFormRef.current();
      }
      if (event.key === "Escape" && !isMobile) {
        event.preventDefault();
        handleCancelFormRef.current();
      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [effectiveMode, isMobile, readOnly]);

  const handleSetPrimary = () => {
    const addressId = selectedId ?? resolvedViewId;
    if (!addressId) return;
    setPrimaryMutation.mutate({ clientId, addressId });
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(
      { clientId, addressId: pendingDelete.id },
      {
        onSuccess: () => setPendingDelete(null),
      },
    );
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  const showListError = !isLoading && isAddressesError;
  const showEmptyState =
    !isLoading &&
    !isAddressesError &&
    sorted.length === 0 &&
    effectiveMode !== "create";

  // Form defaults para modo "edit"
  const editFormDefaults = useMemo<
    Partial<ClientAddressFormData> | undefined
  >(() => {
    if (effectiveMode !== "edit" || !selectedAddressFull) return undefined;
    const a = selectedAddressFull;
    const additionalAddressTypes = [
      "billing",
      "shipping",
      "pickup",
      "warehouse",
      "office",
      "other",
    ] as const;
    const formAddressType = (
      additionalAddressTypes as readonly string[]
    ).includes(a.addressType)
      ? (a.addressType as ClientAddressFormData["addressType"])
      : "other";

    return {
      addressType: formAddressType,
      isPrimary: a.isPrimary,
      locationName: a.locationName ?? "",
      satCountryCode: a.satCountryCode ?? "MEX",
      satStateCode: a.satStateCode ?? "",
      satMunicipalityCode: a.satMunicipalityCode ?? "",
      satLocalityCode: a.satLocalityCode ?? null,
      localityName: a.localityName ?? null,
      satNeighborhoodCode: a.satNeighborhoodCode ?? null,
      neighborhoodName: a.neighborhoodName ?? null,
      postalCode: a.postalCode ?? "",
      street: a.street ?? "",
      exteriorNumber: a.exteriorNumber ?? "",
      interiorNumber:
        a.interiorNumber != null && a.interiorNumber !== ""
          ? a.interiorNumber
          : null,
      reference: a.reference != null && a.reference !== "" ? a.reference : null,
      rfcRemitenteDestinatario: a.rfcRemitenteDestinatario ?? "",
      nombreRemitenteDestinatario: a.nombreRemitenteDestinatario ?? "",
      latitude: a.latitude ?? null,
      longitude: a.longitude ?? null,
      contactName: a.contactName ?? "",
      contactPhone: a.contactPhone ?? "",
      contactEmail: a.contactEmail ?? "",
      businessHours: a.businessHours ?? "",
      notes: a.notes ?? "",
      specialInstructions: a.specialInstructions ?? "",
    };
  }, [effectiveMode, selectedAddressFull]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-4", className)}>
      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Header del bloque                                                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold">
            {copy.masterTitle}
            {sorted.length > 0 ? (
              <span className="ml-1 text-muted-foreground font-normal">
                ({sorted.length})
              </span>
            ) : null}
          </h3>
        </div>
        {!readOnly ? (
          <Button
            size="sm"
            onClick={handleStartCreate}
            disabled={isPending || effectiveMode === "create"}
          >
            <Plus className="mr-2 h-4 w-4" />
            {copy.newAddress}
          </Button>
        ) : null}
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Loading inicial                                                    */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-md border py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : showListError ? (
        <div className="rounded-md border">
          <EmptyState
            icon={<MapPin />}
            title={copy.listErrorTitle}
            description={copy.listErrorDescription}
            cta={{
              label: copy.listErrorRetry,
              onClick: () => {
                void refetchAddresses();
              },
            }}
            size="md"
          />
        </div>
      ) : showEmptyState ? (
        <div className="rounded-md border">
          <EmptyState
            icon={<MapPin />}
            title={copy.emptyTitle}
            description={
              readOnly ? copy.emptyDescriptionReadOnly : copy.emptyDescription
            }
            cta={
              readOnly
                ? undefined
                : {
                    label: copy.emptyCta,
                    icon: <Plus className="h-4 w-4" />,
                    onClick: handleStartCreate,
                  }
            }
            size="md"
          />
          <div className="border-t bg-muted/30 px-6 py-3">
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              <li>{copy.emptyHints.fiscal}</li>
              <li>{copy.emptyHints.trips}</li>
              <li>{copy.emptyHints.other}</li>
            </ul>
          </div>
        </div>
      ) : (
        // ────────────────────────────────────────────────────────────────────
        // Master-detail
        // ────────────────────────────────────────────────────────────────────
        <div className="grid gap-4 rounded-md border bg-muted/30 p-2 md:grid-cols-[280px_1fr] md:items-stretch md:gap-0">
          {/* ─── Master: lista compacta ──────────────────────────────────── */}
          <div className="flex flex-col gap-1.5 md:max-h-[640px] md:overflow-y-auto md:border-r md:p-2">
            {effectiveMode === "create" && !readOnly ? (
              <div className="rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
                <p className="font-medium">{copy.creatingHintTitle}</p>
                <p className="text-primary/70">{copy.creatingHintBody}</p>
              </div>
            ) : null}

            {(
              [
                ["fiscal", grouped.fiscal],
                ["forTrips", grouped.forTrips],
                ["other", grouped.other],
              ] as const
            ).map(([groupKey, groupItems]) =>
              groupItems.length === 0 ? null : (
                <div key={groupKey} className="space-y-1.5">
                  <p className="px-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {copy.groups[groupKey]}
                  </p>
                  {groupItems.map((address) => (
                    <ClientAddressListRow
                      key={address.id}
                      address={address}
                      selected={
                        listHighlightId === address.id &&
                        effectiveMode !== "create"
                      }
                      onClick={() => handleSelect(address.id)}
                    />
                  ))}
                </div>
              ),
            )}
          </div>

          {/* ─── Detail: vista o formulario (sin scroll interno; crece con la página) */}
          <div className="flex flex-col bg-background md:rounded-r-md md:p-5">
            {!readOnly && effectiveMode === "create" && !isMobile ? (
              <FormPanel
                title={copy.createTitle}
                description={copy.createDescription}
                isPending={isPending}
                onCancel={handleCancelForm}
                onSubmit={handleSubmitForm}
                submitLabel={copy.createSubmit}
              >
                <ClientAddressForm
                  ref={formRef}
                  formContext="additional"
                  clientId={clientId}
                  clientRfc={clientRfc}
                  clientName={clientName}
                  disabled={isPending}
                />
              </FormPanel>
            ) : !readOnly && effectiveMode === "edit" && (selectedId ?? resolvedViewId) && !isMobile ? (
              showDetailUnavailable ? (
                <EmptyState
                  icon={<MapPin />}
                  title={copy.detailErrorTitle}
                  description={copy.detailErrorDescription}
                  cta={{
                    label: copy.detailErrorRetry,
                    onClick: () => {
                      void refetchDetail();
                    },
                  }}
                  size="md"
                />
              ) : isLoadingDetail || !editFormDefaults ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <FormPanel
                  title={copy.editTitle}
                  description={copy.editDescription}
                  isPending={isPending}
                  onCancel={handleCancelForm}
                  onSubmit={handleSubmitForm}
                  submitLabel={copy.updateSubmit}
                >
                  <ClientAddressForm
                    key={selectedId ?? resolvedViewId ?? "edit"}
                    ref={formRef}
                    formContext="additional"
                    clientId={clientId}
                    excludeAddressId={selectedId ?? resolvedViewId}
                    defaultValues={editFormDefaults}
                    clientRfc={clientRfc}
                    clientName={clientName}
                    disabled={isPending}
                  />
                </FormPanel>
              )
            ) : effectiveMode === "view" && resolvedViewId ? (
              showDetailUnavailable ? (
                <EmptyState
                  icon={<MapPin />}
                  title={copy.detailErrorTitle}
                  description={copy.detailErrorDescription}
                  cta={{
                    label: copy.detailErrorRetry,
                    onClick: () => {
                      void refetchDetail();
                    },
                  }}
                  size="md"
                />
              ) : isLoadingDetail || !selectedAddressFull ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ClientAddressDetailView
                  address={selectedAddressFull}
                  readOnly={readOnly}
                  onSetPrimary={readOnly ? undefined : handleSetPrimary}
                  onEdit={readOnly ? undefined : handleStartEdit}
                  onDelete={
                    readOnly
                      ? undefined
                      : () => {
                          const target = sorted.find(
                            (a) => a.id === resolvedViewId,
                          );
                          if (target) setPendingDelete(target);
                        }
                  }
                  isPending={isPending}
                />
              )
            ) : !readOnly && (effectiveMode === "create" || effectiveMode === "edit") && isMobile ? (
              <div className="flex items-center justify-center rounded-md border border-dashed py-12 text-sm text-muted-foreground">
                {copy.mobileFormOpen}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                {copy.selectPrompt}
              </div>
            )}
          </div>
        </div>
      )}

      <Sheet
        open={
          !readOnly &&
          isMobile &&
          (effectiveMode === "create" || effectiveMode === "edit")
        }
        onOpenChange={(open) => {
          if (!open) handleCancelForm();
        }}
      >
        <SheetContent side="bottom" className="h-[92vh] overflow-hidden p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>
              {effectiveMode === "create" ? copy.createTitle : copy.editTitle}
            </SheetTitle>
            <SheetDescription>
              {copy.sheetDescription}
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(92vh-132px)] overflow-y-auto px-5 py-4">
            {effectiveMode === "create" ? (
              <ClientAddressForm
                ref={formRef}
                formContext="additional"
                clientId={clientId}
                clientRfc={clientRfc}
                clientName={clientName}
                disabled={isPending}
              />
            ) : showDetailUnavailable ? (
              <EmptyState
                icon={<MapPin />}
                title={copy.detailErrorTitle}
                description={copy.detailErrorDescription}
                cta={{
                  label: copy.detailErrorRetry,
                  onClick: () => {
                    void refetchDetail();
                  },
                }}
                size="md"
              />
            ) : isLoadingDetail || !editFormDefaults ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ClientAddressForm
                key={selectedId ?? resolvedViewId ?? "mobile-edit"}
                ref={formRef}
                formContext="additional"
                clientId={clientId}
                defaultValues={editFormDefaults}
                clientRfc={clientRfc}
                clientName={clientName}
                disabled={isPending}
              />
            )}
          </div>
          <SheetFooter className="border-t bg-background px-5 py-4">
            <Button variant="outline" onClick={handleCancelForm} disabled={isPending}>
              {copy.cancel}
            </Button>
            <Button onClick={handleSubmitForm} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {copy.saving}
                </>
              ) : effectiveMode === "create" ? (
                copy.createSubmit
              ) : (
                copy.updateSubmit
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* AlertDialog: confirmar eliminación                                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <AlertDialog
        open={!readOnly && pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteDescription(
                pendingDelete?.locationName ||
                  pendingDelete?.addressType ||
                  "",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {copy.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {copy.deleting}
                </>
              ) : (
                copy.deleteConfirm
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: panel del formulario (header + cuerpo + footer en flujo de página)
// ============================================================================

interface FormPanelProps {
  title: string;
  description?: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  children: ReactNode;
}

function FormPanel({
  title,
  description,
  isPending,
  onCancel,
  onSubmit,
  submitLabel,
  children,
}: FormPanelProps) {
  return (
    <div className="flex flex-col">
      <header className="mb-4 border-b pb-3">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="min-w-0">{children}</div>
      <footer className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          {copy.cancel}
        </Button>
        <Button onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {copy.saving}
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </footer>
    </div>
  );
}

export default ClientAddressMasterDetail;
