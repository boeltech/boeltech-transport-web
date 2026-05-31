import { AlertCircle, Building2 } from "lucide-react";

import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Switch } from "@shared/ui/switch";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { ADDRESS_TYPE_LABELS } from "@features/clients/domain/entities";

import type { StopFormData } from "../stopDialogAddressMapper";

export interface StopFormSheetClientOption {
  id: string;
  legalName: string;
  tradeName?: string | null;
}

export interface StopFormSheetClientAddressOption {
  id: string;
  locationName?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  addressType: keyof typeof ADDRESS_TYPE_LABELS;
  geolocationPending?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface StopFormSheetAddressOriginSectionProps {
  useClientAddressPrefill: boolean;
  onClientAddressPrefillToggle: (checked: boolean) => void;
  displayStop: StopFormData;
  clients: StopFormSheetClientOption[];
  clientAddresses: StopFormSheetClientAddressOption[];
  onClientChange: (clientId: string) => void;
  onAddressSelect: (addressId: string) => void;
}

export function StopFormSheetAddressOriginSection({
  useClientAddressPrefill,
  onClientAddressPrefillToggle,
  displayStop,
  clients,
  clientAddresses,
  onClientChange,
  onAddressSelect,
}: StopFormSheetAddressOriginSectionProps) {
  return (
    <FormSectionCard
      title="Origen de la dirección"
      icon={<Building2 className="h-4 w-4" />}
      description="Reutiliza una dirección del cliente o captura una nueva. Si modificas un domicilio precargado, al guardar podrás actualizar el catálogo del cliente o usarlo solo en esta parada."
      contentClassName="space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="useClientAddressPrefill" className="cursor-pointer text-sm">
          Precargar dirección desde cliente
        </Label>
        <Switch
          id="useClientAddressPrefill"
          checked={useClientAddressPrefill}
          onCheckedChange={onClientAddressPrefillToggle}
        />
      </div>

      {useClientAddressPrefill ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="stop-client">Cliente</Label>
            <Select
              value={displayStop.clientId || "no-client"}
              onValueChange={onClientChange}
            >
              <SelectTrigger id="stop-client">
                <SelectValue placeholder="Seleccionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-client">Sin cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.legalName}
                    {client.tradeName ? ` (${client.tradeName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {displayStop.clientId && clientAddresses.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="stop-client-address">Dirección del cliente</Label>
              <Select
                value={displayStop.clientAddressId || "manual-entry"}
                onValueChange={onAddressSelect}
              >
                <SelectTrigger id="stop-client-address">
                  <SelectValue placeholder="Seleccionar dirección..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual-entry">Ingresar manualmente</SelectItem>
                  {clientAddresses.map((address) => {
                    const geoPending =
                      address.geolocationPending ||
                      address.latitude == null ||
                      address.longitude == null;
                    return (
                      <SelectItem key={address.id} value={address.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {address.locationName || address.address || "Sin dirección"}
                            {geoPending ? " · Geo pendiente" : ""}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {address.city}
                            {address.state ? `, ${address.state}` : ""} -{" "}
                            {ADDRESS_TYPE_LABELS[address.addressType]}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {displayStop.clientId && clientAddresses.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Este cliente no tiene direcciones registradas — captura manualmente.
            </p>
          ) : null}
        </div>
      ) : null}
    </FormSectionCard>
  );
}
