/**
 * Master-detail para el directorio de ubicaciones del tenant.
 */

import { useMemo, useRef, useState } from "react";
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
import { ClientAddressDetailView } from "@features/clients/presentation/components/ClientAddressDetailView";
import { ClientAddressListRow } from "@features/clients/presentation/components/ClientAddressListItem";
import {
  ClientAddressForm,
  type ClientAddressFormRef,
} from "@features/clients/presentation/components/ClientAddressForm";
import type { ClientAddress, ClientAddressListItem } from "@features/clients/domain";
import {
  useCreateTenantLocation,
  useDeleteTenantLocation,
  useTenantLocation,
  useTenantLocations,
  useUpdateTenantLocation,
} from "../../application/hooks/useTenantLocations";
import { tenantLocationsCopy } from "../copy/tenantLocationsCopy";
import {
  defaultTenantLocationFormValues,
  TENANT_LOCATION_TYPES,
  tenantLocationFormDataToCreateDto,
  tenantLocationFormDataToUpdateDto,
  validateTenantLocationFormComplete,
  type TenantLocationFormData,
} from "../validation/tenantLocationSchema";
import {
  defaultClientAddressFormValues,
  type ClientAddressFormData,
} from "@features/clients/presentation/validation/clientAddressSchema";

type Mode = "view" | "edit" | "create";

function sortLocations(list: ClientAddressListItem[]): ClientAddressListItem[] {
  return [...list].sort((a, b) =>
    (a.locationName || a.postalCode || a.id).localeCompare(
      b.locationName || b.postalCode || b.id,
    ),
  );
}

function addressToFormData(address: ClientAddress): ClientAddressFormData {
  return {
    ...defaultClientAddressFormValues,
    id: address.id,
    addressType: address.addressType === "other" ? "other" : "warehouse",
    isPrimary: false,
    locationName: address.locationName ?? "",
    street: address.street ?? "",
    exteriorNumber: address.exteriorNumber ?? "",
    interiorNumber: address.interiorNumber ?? null,
    reference: address.reference ?? null,
    postalCode: address.postalCode ?? "",
    satCountryCode: address.satCountryCode ?? "MEX",
    satStateCode: address.satStateCode ?? "",
    satMunicipalityCode: address.satMunicipalityCode ?? "",
    satLocalityCode: address.satLocalityCode ?? null,
    localityName: address.localityName ?? null,
    satNeighborhoodCode: address.satNeighborhoodCode ?? null,
    neighborhoodName: address.neighborhoodName ?? null,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    rfcRemitenteDestinatario: address.rfcRemitenteDestinatario ?? "",
    nombreRemitenteDestinatario: address.nombreRemitenteDestinatario ?? "",
    contactName: address.contactName ?? "",
    contactPhone: address.contactPhone ?? "",
    contactEmail: address.contactEmail ?? "",
    businessHours: address.businessHours ?? "",
    notes: address.notes ?? "",
    specialInstructions: address.specialInstructions ?? "",
  };
}

export function TenantLocationMasterDetail() {
  const { data: locations = [], isLoading } = useTenantLocations();
  const createMutation = useCreateTenantLocation();
  const updateMutation = useUpdateTenantLocation();
  const deleteMutation = useDeleteTenantLocation();

  const sorted = useMemo(() => sortLocations(locations), [locations]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("view");
  const [pendingDelete, setPendingDelete] = useState<ClientAddressListItem | null>(
    null,
  );
  const [formData, setFormData] = useState<ClientAddressFormData | null>(null);
  const formRef = useRef<ClientAddressFormRef>(null);

  /**
   * Selección efectiva en modo vista: si `selectedId` no existe en la lista
   * (p. ej. tras borrar) o es null, se muestra la primera ubicación — sin
   * `useEffect` (evita react-hooks/set-state-in-effect).
   * Misma convención que ClientAddressMasterDetail.
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

  const detailQuery = useTenantLocation(detailFetchId);
  const selectedListItem =
    sorted.find((a) => a.id === detailFetchId) ?? null;

  const handleCreate = () => {
    setSelectedId(null);
    setFormData(null);
    setMode("create");
  };

  const handleCancelForm = () => {
    setMode("view");
    setFormData(null);
    if (selectedId === null && sorted.length > 0) {
      setSelectedId(sorted[0].id);
    }
  };

  const handleSubmitForm = async () => {
    const valid = await formRef.current?.triggerValidation();
    if (!valid || !formData) return;

    const asTenant: TenantLocationFormData = {
      ...defaultTenantLocationFormValues,
      ...formData,
      addressType: formData.addressType === "other" ? "other" : "warehouse",
      isPrimary: false,
    };

    const validation = await validateTenantLocationFormComplete(
      asTenant,
      mode === "create" ? "create" : "update",
    );
    if (!validation.ok) {
      formRef.current?.applySatFieldErrors(validation.fieldErrors);
      return;
    }

    if (mode === "create") {
      const created = await createMutation.mutateAsync(
        tenantLocationFormDataToCreateDto(asTenant),
      );
      setSelectedId(created.id);
      setFormData(null);
      setMode("view");
      return;
    }

    const locationId = selectedId ?? resolvedViewId;
    if (!locationId) return;
    await updateMutation.mutateAsync({
      id: locationId,
      data: tenantLocationFormDataToUpdateDto(asTenant),
    });
    setFormData(null);
    setMode("view");
  };

  const handleSave = () => {};

  const handleEdit = () => {
    setSelectedId((prev) => prev ?? resolvedViewId);
    setMode("edit");
    setFormData(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const deletedId = pendingDelete.id;
    await deleteMutation.mutateAsync(deletedId);
    setPendingDelete(null);
    if (selectedId === deletedId || selectedId === null) {
      setSelectedId(null);
      setMode("view");
    }
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {tenantLocationsCopy.list.title} ({sorted.length})
        </h2>
        <Button type="button" size="sm" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {tenantLocationsCopy.list.add}
        </Button>
      </div>

      <div className="grid min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
        <div className="space-y-2 rounded-lg border bg-muted/20 p-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-10 w-10 text-muted-foreground" />}
              title={tenantLocationsCopy.list.emptyTitle}
              description={tenantLocationsCopy.list.emptyDescription}
              cta={{
                label: tenantLocationsCopy.list.add,
                onClick: handleCreate,
              }}
            />
          ) : (
            sorted.map((item) => (
              <ClientAddressListRow
                key={item.id}
                address={item}
                selected={item.id === listHighlightId && mode !== "create"}
                onClick={() => {
                  setSelectedId(item.id);
                  setMode("view");
                  setFormData(null);
                }}
              />
            ))
          )}
        </div>

        <div className="rounded-lg border bg-card p-4">
          {mode === "create" ? (
            <div className="space-y-4">
              <h3 className="font-medium">{tenantLocationsCopy.form.createTitle}</h3>
              <ClientAddressForm
                ref={formRef}
                formContext="additional"
                hidePrimarySwitch
                infoMessage={tenantLocationsCopy.form.hint}
                defaultValues={{
                  ...defaultTenantLocationFormValues,
                  isPrimary: false,
                }}
                addressTypeOptions={TENANT_LOCATION_TYPES}
                onChange={(data) => setFormData(data)}
                onSubmit={handleSave}
                disabled={isPending}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelForm}
                >
                  {tenantLocationsCopy.form.cancel}
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSubmitForm()}
                  disabled={isPending}
                >
                  {tenantLocationsCopy.form.save}
                </Button>
              </div>
            </div>
          ) : mode === "edit" && (selectedId ?? resolvedViewId) ? (
            <div className="space-y-4">
              <h3 className="font-medium">{tenantLocationsCopy.form.editTitle}</h3>
              <ClientAddressForm
                ref={formRef}
                key={selectedId ?? resolvedViewId ?? "edit"}
                formContext="additional"
                hidePrimarySwitch
                infoMessage={tenantLocationsCopy.form.hint}
                defaultValues={
                  detailQuery.data
                    ? addressToFormData(detailQuery.data)
                    : defaultTenantLocationFormValues
                }
                addressTypeOptions={TENANT_LOCATION_TYPES}
                onChange={(data) => setFormData(data)}
                onSubmit={handleSave}
                disabled={isPending}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelForm}
                >
                  {tenantLocationsCopy.form.cancel}
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSubmitForm()}
                  disabled={isPending}
                >
                  {tenantLocationsCopy.form.save}
                </Button>
              </div>
            </div>
          ) : selectedListItem && detailQuery.data ? (
            <ClientAddressDetailView
              address={detailQuery.data}
              onEdit={handleEdit}
              onDelete={() => setPendingDelete(selectedListItem)}
              isPending={isPending}
            />
          ) : selectedListItem ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <EmptyState
              icon={<MapPin className="h-10 w-10 text-muted-foreground" />}
              title={tenantLocationsCopy.list.emptyTitle}
              description={tenantLocationsCopy.list.emptyDescription}
            />
          )}
        </div>
      </div>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tenantLocationsCopy.delete.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {tenantLocationsCopy.delete.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tenantLocationsCopy.delete.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>
              {tenantLocationsCopy.delete.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
