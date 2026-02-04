/**
 * CostsStep - Paso 4 del Wizard
 * Costos: Gastos estimados del viaje
 */

import { useState } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
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
  Receipt,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Fuel,
  CircleDollarSign,
  Wallet,
  Bed,
  Package,
  ParkingCircle,
  Wrench,
  Shield,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import type { TripWizardFormValues, TripExpenseFormValues } from "../types";

interface CostsStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expensesFieldArray: UseFieldArrayReturn<
    TripWizardFormValues,
    "expenses",
    any
  >;
}

const EXPENSE_CATEGORIES = [
  { value: "fuel", label: "Combustible", icon: Fuel },
  { value: "tolls", label: "Casetas/Peajes", icon: CircleDollarSign },
  { value: "driver_allowance", label: "Viáticos del Operador", icon: Wallet },
  { value: "lodging", label: "Hospedaje", icon: Bed },
  {
    value: "loading_unloading",
    label: "Maniobras Carga/Descarga",
    icon: Package,
  },
  { value: "parking", label: "Pensión/Estacionamiento", icon: ParkingCircle },
  { value: "maintenance", label: "Mantenimiento en Ruta", icon: Wrench },
  { value: "insurance", label: "Seguros", icon: Shield },
  { value: "permits", label: "Permisos y Trámites", icon: FileText },
  { value: "other", label: "Otros Gastos", icon: MoreHorizontal },
];

const defaultNewExpense: Partial<TripExpenseFormValues> = {
  category: "fuel",
  description: "",
  amount: 0,
  currency: "MXN",
  location: "",
  vendorName: "",
  notes: "",
  isEstimated: true,
};

export function CostsStep({ form, expensesFieldArray }: CostsStepProps) {
  const { fields, append, remove, update } = expensesFieldArray;
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newExpense, setNewExpense] =
    useState<Partial<TripExpenseFormValues>>(defaultNewExpense);

  const handleOpenAddDialog = () => {
    setEditingIndex(null);
    setNewExpense(defaultNewExpense);
    setIsExpenseDialogOpen(true);
  };

  const handleOpenEditDialog = (index: number) => {
    setEditingIndex(index);
    setNewExpense(fields[index]);
    setIsExpenseDialogOpen(true);
  };

  const handleSaveExpense = () => {
    if (
      newExpense.category &&
      newExpense.description &&
      newExpense.amount !== undefined
    ) {
      const expenseData: TripExpenseFormValues = {
        category: newExpense.category as TripExpenseFormValues["category"],
        description: newExpense.description,
        amount: newExpense.amount || 0,
        currency: newExpense.currency || "MXN",
        expenseDate: newExpense.expenseDate,
        location: newExpense.location,
        vendorName: newExpense.vendorName,
        notes: newExpense.notes,
        isEstimated: newExpense.isEstimated ?? true,
      };

      if (editingIndex !== null) {
        update(editingIndex, expenseData);
      } else {
        append(expenseData);
      }

      setNewExpense(defaultNewExpense);
      setEditingIndex(null);
      setIsExpenseDialogOpen(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.value === category) ||
      EXPENSE_CATEGORIES[9]
    );
  };

  const formatCurrency = (amount: number, currency: string = "MXN") => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const totalExpenses = fields.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0,
  );

  // Agrupar gastos por categoría
  const expensesByCategory = fields.reduce(
    (acc, expense) => {
      const cat = expense.category;
      if (!acc[cat]) {
        acc[cat] = { total: 0, count: 0 };
      }
      acc[cat].total += expense.amount || 0;
      acc[cat].count += 1;
      return acc;
    },
    {} as Record<string, { total: number; count: number }>,
  );

  return (
    <div className="space-y-6">
      {/* Tarifa Base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Tarifa Base del Viaje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="baseRate"
            render={({ field }) => (
              <FormItem className="sm:w-1/3">
                <FormLabel>Tarifa Base ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Gastos Estimados */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" /> Gastos Estimados
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {fields.length} gasto{fields.length !== 1 ? "s" : ""} registrado
              {fields.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenAddDialog}
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar Gasto
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay gastos registrados</p>
              <p className="text-sm">
                Agregue los gastos estimados para este viaje
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lista de gastos */}
              <div className="space-y-2">
                {fields.map((expense, index) => {
                  const categoryInfo = getCategoryInfo(expense.category);
                  const CategoryIcon = categoryInfo.icon;

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="p-2 rounded-full bg-muted">
                        <CategoryIcon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-muted">
                            {categoryInfo.label}
                          </span>
                          {expense.isEstimated && (
                            <span className="text-xs text-muted-foreground">
                              (Estimado)
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {expense.description}
                        </p>
                        {expense.vendorName && (
                          <p className="text-xs text-muted-foreground">
                            {expense.vendorName}
                          </p>
                        )}
                      </div>

                      <span className="font-semibold">
                        {formatCurrency(expense.amount, expense.currency)}
                      </span>

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
                  );
                })}
              </div>

              {/* Resumen por categoría */}
              {Object.keys(expensesByCategory).length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">
                    Resumen por Categoría
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(expensesByCategory).map(([cat, data]) => {
                      const categoryInfo = getCategoryInfo(cat);
                      const CategoryIcon = categoryInfo.icon;
                      return (
                        <div
                          key={cat}
                          className="flex items-center justify-between p-2 rounded bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {categoryInfo.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({data.count})
                            </span>
                          </div>
                          <span className="font-medium">
                            {formatCurrency(data.total)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between p-4 border-t mt-4 bg-muted/50 rounded-lg">
                <span className="font-medium">Total Gastos Estimados:</span>
                <span className="text-xl font-bold text-destructive">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar/editar gasto */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Editar Gasto" : "Agregar Gasto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Categoría */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría *</label>
              <Select
                value={newExpense.category}
                onValueChange={(value) =>
                  setNewExpense({
                    ...newExpense,
                    category: value as TripExpenseFormValues["category"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción *</label>
              <Input
                placeholder="Ej: Carga de diesel, Caseta México-Querétaro..."
                value={newExpense.description || ""}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, description: e.target.value })
                }
              />
            </div>

            {/* Monto */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Monto *</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newExpense.amount ?? ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      amount: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Moneda</label>
                <Select
                  value={newExpense.currency || "MXN"}
                  onValueChange={(value) =>
                    setNewExpense({ ...newExpense, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Proveedor y Ubicación */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Proveedor</label>
                <Input
                  placeholder="Nombre del proveedor"
                  value={newExpense.vendorName || ""}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, vendorName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ubicación</label>
                <Input
                  placeholder="Lugar del gasto"
                  value={newExpense.location || ""}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, location: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={newExpense.notes || ""}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsExpenseDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveExpense}
              disabled={!newExpense.category || !newExpense.description}
            >
              {editingIndex !== null ? "Guardar Cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
