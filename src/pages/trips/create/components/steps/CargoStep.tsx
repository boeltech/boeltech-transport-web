/**
 * CargoStep - Paso 3 del Wizard
 * Cargas: Mercancías a transportar
 */

import { useState } from "react";
import type { UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Loader2,
} from "lucide-react";
import type { TripWizardFormValues, TripCargoFormValues } from "../types";

interface CargoStepProps {
  cargosFieldArray: UseFieldArrayReturn<TripWizardFormValues, "cargos">;
  clients: Array<{ id: string; legalName: string }>;
  isLoadingClients: boolean;
}

const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN - Peso Mexicano" },
  { value: "USD", label: "USD - Dólar Americano" },
];

const defaultNewCargo: Partial<TripCargoFormValues> = {
  clientId: "",
  description: "",
  productType: "",
  weight: undefined,
  volume: undefined,
  units: undefined,
  declaredValue: undefined,
  rate: 0,
  currency: "MXN",
  notes: "",
  specialInstructions: "",
};

export function CargoStep({
  cargosFieldArray,
  clients,
  isLoadingClients,
}: CargoStepProps) {
  const { fields, append, remove, update } = cargosFieldArray;
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newCargo, setNewCargo] =
    useState<Partial<TripCargoFormValues>>(defaultNewCargo);

  const handleOpenAddDialog = () => {
    setEditingIndex(null);
    setNewCargo(defaultNewCargo);
    setIsCargoDialogOpen(true);
  };

  const handleOpenEditDialog = (index: number) => {
    setEditingIndex(index);
    setNewCargo(fields[index]);
    setIsCargoDialogOpen(true);
  };

  const handleSaveCargo = () => {
    if (
      newCargo.clientId &&
      newCargo.description &&
      newCargo.rate !== undefined
    ) {
      const cargoData: TripCargoFormValues = {
        clientId: newCargo.clientId,
        description: newCargo.description,
        productType: newCargo.productType,
        weight: newCargo.weight,
        volume: newCargo.volume,
        units: newCargo.units,
        declaredValue: newCargo.declaredValue,
        rate: newCargo.rate || 0,
        currency: newCargo.currency || "MXN",
        pickupStopIndex: newCargo.pickupStopIndex,
        deliveryStopIndex: newCargo.deliveryStopIndex,
        notes: newCargo.notes,
        specialInstructions: newCargo.specialInstructions,
      };

      if (editingIndex !== null) {
        update(editingIndex, cargoData);
      } else {
        append(cargoData);
      }

      setNewCargo(defaultNewCargo);
      setEditingIndex(null);
      setIsCargoDialogOpen(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.legalName || "Cliente no encontrado";
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const totalRevenue = fields.reduce(
    (sum, cargo) => sum + (cargo.rate || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Resumen de cargas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" /> Cargas del Viaje
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {fields.length} carga{fields.length !== 1 ? "s" : ""} registrada
              {fields.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenAddDialog}
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar Carga
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay cargas registradas</p>
              <p className="text-sm">
                Agregue las mercancías que se transportarán en este viaje
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((cargo, index) => (
                <div
                  key={cargo.id}
                  className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{cargo.description}</h4>
                      <span className="text-lg font-semibold text-primary">
                        {formatCurrency(cargo.rate, cargo.currency)}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Cliente: {getClientName(cargo.clientId)}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {cargo.productType && (
                        <span>Tipo: {cargo.productType}</span>
                      )}
                      {cargo.weight && <span>Peso: {cargo.weight} kg</span>}
                      {cargo.volume && <span>Volumen: {cargo.volume} m³</span>}
                      {cargo.units && <span>Unidades: {cargo.units}</span>}
                      {cargo.declaredValue && (
                        <span>
                          Valor declarado:{" "}
                          {formatCurrency(cargo.declaredValue, cargo.currency)}
                        </span>
                      )}
                    </div>

                    {cargo.notes && (
                      <p className="text-xs text-muted-foreground italic">
                        {cargo.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditDialog(index)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between p-4 border-t mt-4">
                <span className="font-medium">Ingreso Total Estimado:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalRevenue, "MXN")}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar/editar carga */}
      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Editar Carga" : "Agregar Carga"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente *</label>
              <Select
                value={newCargo.clientId}
                onValueChange={(value) =>
                  setNewCargo({ ...newCargo, clientId: value })
                }
                disabled={isLoadingClients}
              >
                <SelectTrigger>
                  {isLoadingClients ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descripción de la Carga *
              </label>
              <Input
                placeholder="Ej: Electrodomésticos, Materiales de construcción..."
                value={newCargo.description || ""}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, description: e.target.value })
                }
              />
            </div>

            {/* Tipo de producto */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Producto</label>
              <Input
                placeholder="Ej: Electrónica, Perecederos, Químicos..."
                value={newCargo.productType || ""}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, productType: e.target.value })
                }
              />
            </div>

            {/* Dimensiones */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Peso (kg)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newCargo.weight ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      weight: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Volumen (m³)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newCargo.volume ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      volume: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidades</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newCargo.units ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      units: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Declarado</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newCargo.declaredValue ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      declaredValue: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            {/* Tarifa */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="h-4 w-4" /> Tarifa *
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newCargo.rate ?? ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      rate: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Moneda</label>
                <Select
                  value={newCargo.currency || "MXN"}
                  onValueChange={(value) =>
                    setNewCargo({ ...newCargo, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                placeholder="Observaciones sobre la carga..."
                value={newCargo.notes || ""}
                onChange={(e) =>
                  setNewCargo({ ...newCargo, notes: e.target.value })
                }
              />
            </div>

            {/* Instrucciones especiales */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Instrucciones Especiales
              </label>
              <Textarea
                placeholder="Manejo especial, temperatura, fragilidad..."
                value={newCargo.specialInstructions || ""}
                onChange={(e) =>
                  setNewCargo({
                    ...newCargo,
                    specialInstructions: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCargoDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveCargo}
              disabled={!newCargo.clientId || !newCargo.description}
            >
              {editingIndex !== null ? "Guardar Cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
