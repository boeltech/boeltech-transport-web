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

import { useMemo, useRef, useState, type ReactNode } from "react";
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
import { EmptyState } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";

import {
  useClientAddress,
  useClientAddresses,
  useCreateClientAddress,
  useDeleteClientAddress,
  useUpdateClientAddress,
} from "../../application";
import type { ClientAddressListItem as ClientAddressListItemEntity } from "../../domain";
import {
  ClientAddressForm,
  type ClientAddressFormRef,
} from "./ClientAddressForm";
import { ClientAddressListItem } from "./ClientAddressListItem";
import { ClientAddressDetailView } from "./ClientAddressDetailView";
import {
  clientAddressFormDataToCreateDto,
  clientAddressFormDataToUpdateDto,
  type ClientAddressFormData,
} from "../validation/clientAddressSchema";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientAddressMasterDetailProps {
  clientId: string;
  /** RFC del cliente (para pre-llenar el remitente/destinatario en el form). */
  clientRfc?: string;
  /** Razón social del cliente (para pre-llenar el nombre del remitente). */
  clientName?: string;
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
  className,
}: ClientAddressMasterDetailProps) {
  const { data: addresses, isLoading } = useClientAddresses(clientId);
  const sorted = useMemo(
    () => (addresses ? sortAddresses(addresses) : []),
    [addresses],
  );

  // ── Estado del master-detail ─────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [pendingDelete, setPendingDelete] =
    useState<ClientAddressListItemEntity | null>(null);

  // Estado del form (cuando mode === "edit" o "create")
  const formRef = useRef<ClientAddressFormRef>(null);
  const [formData, setFormData] = useState<ClientAddressFormData | null>(null);

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
    if (mode === "create") return undefined;
    if (mode === "edit") return selectedId ?? resolvedViewId ?? undefined;
    return resolvedViewId ?? undefined;
  }, [mode, selectedId, resolvedViewId]);

  const listHighlightId =
    mode === "edit" ? (selectedId ?? resolvedViewId) : resolvedViewId;

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useCreateClientAddress();
  const updateMutation = useUpdateClientAddress();
  const deleteMutation = useDeleteClientAddress();
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // ── Detalle full de la dirección seleccionada ────────────────────────────
  const { data: selectedAddressFull, isLoading: isLoadingDetail } =
    useClientAddress(clientId, detailFetchId);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMode("view");
    setFormData(null);
  };

  const handleStartCreate = () => {
    setSelectedId(null);
    setMode("create");
    setFormData(null);
  };

  const handleStartEdit = () => {
    setSelectedId((prev) => prev ?? resolvedViewId);
    setMode("edit");
    setFormData(null);
  };

  const handleCancelForm = () => {
    setMode("view");
    setFormData(null);
    // Si veníamos de "create" sin selección previa, intentar auto-seleccionar
    if (selectedId === null && sorted.length > 0) {
      setSelectedId(sorted[0].id);
    }
  };

  const handleFormChange = (data: ClientAddressFormData) => {
    setFormData(data);
  };

  const handleSubmitForm = async () => {
    const valid = await formRef.current?.triggerValidation();
    if (!valid || !formData) return;

    if (mode === "create") {
      createMutation.mutate(
        {
          clientId,
          data: clientAddressFormDataToCreateDto(formData, {
            context: "additional",
          }),
        },
        {
          onSuccess: (created) => {
            setMode("view");
            setFormData(null);
            // El backend debería retornar el id; si lo hace, seleccionar la nueva
            if (created && "id" in created && typeof created.id === "string") {
              setSelectedId(created.id);
            }
          },
        },
      );
    } else if (mode === "edit") {
      const addressId = selectedId ?? resolvedViewId;
      if (!addressId) return;
      updateMutation.mutate(
        {
          clientId,
          addressId,
          data: clientAddressFormDataToUpdateDto(formData, {
            context: "additional",
          }),
        },
        {
          onSuccess: () => {
            setMode("view");
            setFormData(null);
          },
        },
      );
    }
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
  const showEmptyState =
    !isLoading && sorted.length === 0 && mode !== "create";

  // Form defaults para modo "edit"
  const editFormDefaults = useMemo<
    Partial<ClientAddressFormData> | undefined
  >(() => {
    if (mode !== "edit" || !selectedAddressFull) return undefined;
    const a = selectedAddressFull;
    return {
      addressType: a.addressType,
      isPrimary: a.isPrimary,
      locationName: a.locationName ?? "",
      satCountryCode: a.satCountryCode ?? "MEX",
      satStateCode: a.satStateCode ?? "",
      satMunicipalityCode: a.satMunicipalityCode ?? "",
      satLocalityCode: a.satLocalityCode ?? null,
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
  }, [mode, selectedAddressFull]);

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
            Direcciones
            {sorted.length > 0 ? (
              <span className="ml-1 text-muted-foreground font-normal">
                ({sorted.length})
              </span>
            ) : null}
          </h3>
        </div>
        <Button
          size="sm"
          onClick={handleStartCreate}
          disabled={isPending || mode === "create"}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva dirección
        </Button>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* Loading inicial                                                    */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-md border py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : showEmptyState ? (
        <div className="rounded-md border">
          <EmptyState
            icon={<MapPin />}
            title="No hay direcciones registradas"
            description="Agrega al menos una dirección fiscal o de entrega para este cliente."
            cta={{
              label: "Agregar primera dirección",
              icon: <Plus className="h-4 w-4" />,
              onClick: handleStartCreate,
            }}
            size="md"
          />
        </div>
      ) : (
        // ────────────────────────────────────────────────────────────────────
        // Master-detail
        // ────────────────────────────────────────────────────────────────────
        <div className="grid gap-4 rounded-md border bg-muted/30 p-2 md:grid-cols-[280px_1fr] md:gap-0">
          {/* ─── Master: lista compacta ──────────────────────────────────── */}
          <div className="flex flex-col gap-1.5 md:max-h-[640px] md:overflow-y-auto md:border-r md:p-2">
            {mode === "create" ? (
              <div className="rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
                <p className="font-medium">Nueva dirección</p>
                <p className="text-primary/70">
                  Completa el formulario a la derecha para guardarla.
                </p>
              </div>
            ) : null}

            {sorted.map((address) => (
              <ClientAddressListItem
                key={address.id}
                address={address}
                selected={
                  listHighlightId === address.id && mode !== "create"
                }
                onClick={() => handleSelect(address.id)}
              />
            ))}
          </div>

          {/* ─── Detail: vista o formulario ──────────────────────────────── */}
          <div className="bg-background md:rounded-r-md md:p-5">
            {mode === "create" ? (
              <FormPanel
                title="Nueva dirección"
                description="Captura los datos. Se guardará al confirmar."
                isPending={isPending}
                onCancel={handleCancelForm}
                onSubmit={handleSubmitForm}
                submitLabel="Crear dirección"
              >
                <ClientAddressForm
                  ref={formRef}
                  formContext="additional"
                  clientRfc={clientRfc}
                  clientName={clientName}
                  onChange={handleFormChange}
                  disabled={isPending}
                />
              </FormPanel>
            ) : mode === "edit" && (selectedId ?? resolvedViewId) ? (
              isLoadingDetail || !editFormDefaults ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <FormPanel
                  title="Editar dirección"
                  description="Los cambios se guardan al confirmar."
                  isPending={isPending}
                  onCancel={handleCancelForm}
                  onSubmit={handleSubmitForm}
                  submitLabel="Guardar cambios"
                >
                  <ClientAddressForm
                    key={selectedId ?? resolvedViewId ?? "edit"}
                    ref={formRef}
                    formContext="additional"
                    defaultValues={editFormDefaults}
                    clientRfc={clientRfc}
                    clientName={clientName}
                    onChange={handleFormChange}
                    disabled={isPending}
                  />
                </FormPanel>
              )
            ) : mode === "view" && resolvedViewId ? (
              isLoadingDetail || !selectedAddressFull ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ClientAddressDetailView
                  address={selectedAddressFull}
                  onEdit={handleStartEdit}
                  onDelete={() => {
                    const target = sorted.find((a) => a.id === resolvedViewId);
                    if (target) setPendingDelete(target);
                  }}
                  isPending={isPending}
                />
              )
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Selecciona una dirección de la lista o crea una nueva.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* AlertDialog: confirmar eliminación                                  */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La dirección{" "}
              <strong>
                {pendingDelete?.locationName ||
                  pendingDelete?.addressType ||
                  ""}
              </strong>{" "}
              será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: panel del form (con header + footer + scroll)
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
    <div className="flex max-h-[640px] flex-col">
      <header className="border-b pb-3 mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="flex-1 overflow-y-auto pr-1">{children}</div>
      <footer className="mt-4 flex items-center justify-end gap-2 border-t pt-3">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
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
