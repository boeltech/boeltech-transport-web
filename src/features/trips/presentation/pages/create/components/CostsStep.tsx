/**
 * CostsStep - Paso 4 del Wizard
 * Costos: Gastos estimados del viaje con soporte para catálogos SAT (CFDI 4.0)
 *
 * Catálogos SAT integrados (campos esenciales):
 * - c_ClaveProdServ: Productos/servicios con auto-sugerencia por categoría
 * - c_FormaPago: Formas de pago (efectivo, transferencia, tarjeta)
 * - c_Moneda: Monedas con tipo de cambio condicional
 * - CFDI: UUID y folio (sección colapsable, solo si tiene factura)
 *
 * Ubicación: src/pages/trips/create/components/CostsStep.tsx
 */

import { useState, useMemo, useEffect } from "react";
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
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
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
  ChevronsUpDown,
  Check,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { TripWizardFormValues, TripExpenseFormValues } from "./validation";

// ============================================================================
// TYPES
// ============================================================================

interface CostsStepProps {
  form: UseFormReturn<TripWizardFormValues, unknown, undefined>;
  expensesFieldArray: UseFieldArrayReturn<TripWizardFormValues, "expenses">;
}

interface SatProduct {
  code: string;
  description: string;
  category: string;
  requiresIeps?: boolean;
}

// Extensión del tipo de formulario para incluir campos SAT
interface ExpenseFormState extends Partial<TripExpenseFormValues> {
  // Campos SAT adicionales
  satProductCode?: string;
  satProductDescription?: string;
  quantity?: number;
  unitPrice?: number;
  paymentMethod?: string;
  exchangeRate?: number;
  hasCfdi?: boolean;
  cfdiUuid?: string;
  cfdiFolio?: string;
  vendorRfc?: string;
}

// ============================================================================
// CATÁLOGOS SAT
// ============================================================================

const SAT_PRODUCTS: SatProduct[] = [
  // Combustibles
  {
    code: "15101514",
    description: "Gasolina regular (menor a 91 octanos)",
    category: "fuel",
    requiresIeps: true,
  },
  {
    code: "15101515",
    description: "Gasolina premium (91 octanos o más)",
    category: "fuel",
    requiresIeps: true,
  },
  {
    code: "15101505",
    description: "Combustible diesel",
    category: "fuel",
    requiresIeps: true,
  },
  {
    code: "15111510",
    description: "Gas licuado de petróleo (LP)",
    category: "fuel",
    requiresIeps: true,
  },
  // Peajes
  {
    code: "78141501",
    description: "Servicios de peaje por cruce carretero",
    category: "tolls",
  },
  { code: "78141500", description: "Servicios de peaje", category: "tolls" },
  // Hospedaje
  { code: "90111601", description: "Hoteles y moteles", category: "lodging" },
  { code: "90111602", description: "Albergues", category: "lodging" },
  // Estacionamiento
  {
    code: "78111801",
    description: "Estacionamiento de vehículos",
    category: "parking",
  },
  {
    code: "78111800",
    description: "Servicios de estacionamiento",
    category: "parking",
  },
  // Mantenimiento
  {
    code: "78181500",
    description: "Servicios de mantenimiento de vehículos",
    category: "maintenance",
  },
  {
    code: "78181501",
    description: "Servicio de cambio de aceite",
    category: "maintenance",
  },
  {
    code: "78181502",
    description: "Servicio de lavado de vehículos",
    category: "maintenance",
  },
  {
    code: "25172504",
    description: "Llantas para camiones",
    category: "maintenance",
  },
  // Maniobras
  {
    code: "78121603",
    description: "Servicios de carga y descarga",
    category: "loading_unloading",
  },
  {
    code: "78121600",
    description: "Servicios de manejo de carga",
    category: "loading_unloading",
  },
  // Alimentación (viáticos)
  {
    code: "90101501",
    description: "Servicios de cafetería",
    category: "driver_allowance",
  },
  {
    code: "90101500",
    description: "Servicios de restaurante",
    category: "driver_allowance",
  },
  // Seguros
  {
    code: "84131500",
    description: "Servicios de seguros para vehículos",
    category: "insurance",
  },
  {
    code: "84131501",
    description: "Seguros de responsabilidad civil",
    category: "insurance",
  },
  // Permisos
  {
    code: "80161500",
    description: "Servicios gubernamentales de transporte",
    category: "permits",
  },
  // Genérico
  {
    code: "01010101",
    description: "No existe en el catálogo",
    category: "other",
  },
];

const PAYMENT_METHODS = [
  { code: "01", description: "Efectivo" },
  { code: "03", description: "Transferencia electrónica" },
  { code: "04", description: "Tarjeta de crédito" },
  { code: "28", description: "Tarjeta de débito" },
  { code: "05", description: "Monedero electrónico" },
  { code: "99", description: "Por definir" },
] as const;

const CURRENCIES = [
  { code: "MXN", description: "Peso mexicano" },
  { code: "USD", description: "Dólar americano" },
  { code: "EUR", description: "Euro" },
] as const;

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

// ============================================================================
// HELPERS
// ============================================================================

const getProductsForCategory = (category: string): SatProduct[] => {
  return SAT_PRODUCTS.filter((p) => p.category === category);
};

const getDefaultProductForCategory = (
  category: string,
): SatProduct | undefined => {
  return SAT_PRODUCTS.find((p) => p.category === category);
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

const validateRfc = (rfc: string): boolean => {
  if (!rfc) return true; // Opcional
  const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
  return rfcPattern.test(rfc.trim());
};

const validateUuid = (uuid: string): boolean => {
  if (!uuid) return true; // Opcional
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(uuid.trim());
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultNewExpense: ExpenseFormState = {
  category: "fuel",
  description: "",
  amount: 0,
  currency: "MXN",
  location: "",
  vendorName: "",
  notes: "",
  isEstimated: true,
  // Campos SAT
  satProductCode: "",
  satProductDescription: "",
  quantity: undefined,
  unitPrice: undefined,
  paymentMethod: "01", // Efectivo por defecto
  exchangeRate: undefined,
  hasCfdi: false,
  cfdiUuid: "",
  cfdiFolio: "",
  vendorRfc: "",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CostsStep({ form, expensesFieldArray }: CostsStepProps) {
  const { fields, append, remove, update } = expensesFieldArray;
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newExpense, setNewExpense] =
    useState<ExpenseFormState>(defaultNewExpense);
  const [satProductOpen, setSatProductOpen] = useState(false);
  const [cfdiSectionOpen, setCfdiSectionOpen] = useState(false);

  // Productos filtrados por categoría seleccionada
  const filteredProducts = useMemo(() => {
    if (!newExpense.category) return SAT_PRODUCTS;
    const categoryProducts = getProductsForCategory(newExpense.category);
    return categoryProducts.length > 0 ? categoryProducts : SAT_PRODUCTS;
  }, [newExpense.category]);

  // Auto-seleccionar producto SAT cuando cambia la categoría
  useEffect(() => {
    if (newExpense.category && !newExpense.satProductCode) {
      const defaultProduct = getDefaultProductForCategory(newExpense.category);
      if (defaultProduct) {
        setNewExpense((prev) => ({
          ...prev,
          satProductCode: defaultProduct.code,
          satProductDescription: defaultProduct.description,
        }));
      }
    }
  }, [newExpense.category]);

  // Calcular monto automáticamente cuando cambian cantidad o precio unitario
  useEffect(() => {
    if (newExpense.quantity && newExpense.unitPrice) {
      const subtotal = newExpense.quantity * newExpense.unitPrice;
      setNewExpense((prev) => ({ ...prev, amount: subtotal }));
    }
  }, [newExpense.quantity, newExpense.unitPrice]);

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────

  const handleOpenAddDialog = () => {
    setEditingIndex(null);
    setNewExpense(defaultNewExpense);
    setCfdiSectionOpen(false);
    setIsExpenseDialogOpen(true);
  };

  const handleOpenEditDialog = (index: number) => {
    setEditingIndex(index);
    const expense = fields[index];
    setNewExpense({
      ...expense,
      // Mapear campos existentes a estado extendido
      satProductCode: (expense as ExpenseFormState).satProductCode || "",
      satProductDescription:
        (expense as ExpenseFormState).satProductDescription || "",
      quantity: (expense as ExpenseFormState).quantity,
      unitPrice: (expense as ExpenseFormState).unitPrice,
      paymentMethod: (expense as ExpenseFormState).paymentMethod || "01",
      exchangeRate: (expense as ExpenseFormState).exchangeRate,
      hasCfdi: !!(expense as ExpenseFormState).cfdiUuid,
      cfdiUuid: (expense as ExpenseFormState).cfdiUuid || "",
      cfdiFolio: (expense as ExpenseFormState).cfdiFolio || "",
      vendorRfc: (expense as ExpenseFormState).vendorRfc || "",
    });
    setCfdiSectionOpen(!!(expense as ExpenseFormState).cfdiUuid);
    setIsExpenseDialogOpen(true);
  };

  const handleCategoryChange = (category: string) => {
    const defaultProduct = getDefaultProductForCategory(category);
    setNewExpense({
      ...newExpense,
      category: category as TripExpenseFormValues["category"],
      satProductCode: defaultProduct?.code || "",
      satProductDescription: defaultProduct?.description || "",
    });
  };

  const handleSatProductSelect = (product: SatProduct) => {
    setNewExpense({
      ...newExpense,
      satProductCode: product.code,
      satProductDescription: product.description,
    });
    setSatProductOpen(false);
  };

  const handleSaveExpense = () => {
    // Validaciones
    if (!newExpense.category || !newExpense.description) return;
    if (newExpense.amount === undefined || newExpense.amount <= 0) return;

    // Validar RFC si se proporcionó
    if (newExpense.vendorRfc && !validateRfc(newExpense.vendorRfc)) {
      return; // El error se muestra en el UI
    }

    // Validar UUID si se proporcionó
    if (newExpense.cfdiUuid && !validateUuid(newExpense.cfdiUuid)) {
      return;
    }

    const expenseData = {
      category: newExpense.category as TripExpenseFormValues["category"],
      description: newExpense.description,
      amount: newExpense.amount || 0,
      currency: newExpense.currency || "MXN",
      expenseDate: newExpense.expenseDate,
      location: newExpense.location,
      vendorName: newExpense.vendorName,
      notes: newExpense.notes,
      isEstimated: newExpense.isEstimated ?? true,
      // Campos SAT extendidos
      satProductCode: newExpense.satProductCode,
      satProductDescription: newExpense.satProductDescription,
      quantity: newExpense.quantity,
      unitPrice: newExpense.unitPrice,
      paymentMethod: newExpense.paymentMethod,
      exchangeRate:
        newExpense.currency !== "MXN" ? newExpense.exchangeRate : undefined,
      cfdiUuid: newExpense.hasCfdi ? newExpense.cfdiUuid : undefined,
      cfdiFolio: newExpense.hasCfdi ? newExpense.cfdiFolio : undefined,
      vendorRfc: newExpense.vendorRfc,
    } as TripExpenseFormValues;

    if (editingIndex !== null) {
      update(editingIndex, expenseData);
    } else {
      append(expenseData);
    }

    setNewExpense(defaultNewExpense);
    setEditingIndex(null);
    setCfdiSectionOpen(false);
    setIsExpenseDialogOpen(false);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ──────────────────────────────────────────────────────────────────────────

  const totalExpenses = fields.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0,
  );

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

  const isFormValid = useMemo(() => {
    if (!newExpense.category || !newExpense.description) return false;
    if (!newExpense.amount || newExpense.amount <= 0) return false;
    if (newExpense.vendorRfc && !validateRfc(newExpense.vendorRfc))
      return false;
    if (newExpense.cfdiUuid && !validateUuid(newExpense.cfdiUuid)) return false;
    if (newExpense.currency !== "MXN" && !newExpense.exchangeRate) return false;
    return true;
  }, [newExpense]);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

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
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay gastos registrados</p>
              <p className="text-sm">Agrega los gastos estimados del viaje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Lista de gastos */}
              <div className="divide-y">
                {fields.map((expense, index) => {
                  const categoryInfo = getCategoryInfo(expense.category);
                  const CategoryIcon = categoryInfo.icon;
                  const expenseExt = expense as ExpenseFormState;

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div
                        className="p-2 rounded-lg bg-muted"
                        title={categoryInfo.label}
                      >
                        <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            {categoryInfo.label}
                          </span>
                          {expense.isEstimated && (
                            <span className="text-xs text-muted-foreground">
                              (Estimado)
                            </span>
                          )}
                          {expenseExt.cfdiUuid && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Check className="h-3 w-3" /> CFDI
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {expense.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {expense.vendorName && (
                            <span>{expense.vendorName}</span>
                          )}
                          {expenseExt.satProductCode && (
                            <span className="font-mono">
                              SAT: {expenseExt.satProductCode}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="font-semibold whitespace-nowrap">
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

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DIALOG: Agregar/Editar Gasto */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Editar Gasto" : "Agregar Gasto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* ─────────────────────────────────────────────────────────────── */}
            {/* SECCIÓN 1: Categoría y Producto SAT */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Categoría */}
              <div className="space-y-2">
                <Label>
                  Categoría <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={newExpense.category}
                  onValueChange={handleCategoryChange}
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

              {/* Producto SAT (Combobox) */}
              <div className="space-y-2">
                <Label>Producto SAT</Label>
                <Popover open={satProductOpen} onOpenChange={setSatProductOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={satProductOpen}
                      className="w-full justify-between font-normal"
                    >
                      {newExpense.satProductCode ? (
                        <span className="truncate">
                          <span className="font-mono text-xs mr-2">
                            {newExpense.satProductCode}
                          </span>
                          {newExpense.satProductDescription}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Seleccionar producto...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar producto SAT..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron productos.
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredProducts.map((product) => (
                            <CommandItem
                              key={product.code}
                              value={`${product.code} ${product.description}`}
                              onSelect={() => handleSatProductSelect(product)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newExpense.satProductCode === product.code
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span className="font-mono text-xs mr-2">
                                {product.code}
                              </span>
                              <span className="truncate">
                                {product.description}
                              </span>
                              {product.requiresIeps && (
                                <span className="ml-auto text-xs text-amber-600">
                                  IEPS
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Se sugieren productos según la categoría
                </p>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* SECCIÓN 2: Descripción */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label>
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ej: Carga de diesel en gasolinería Pemex km 45..."
                value={newExpense.description || ""}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, description: e.target.value })
                }
              />
            </div>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* SECCIÓN 3: Cantidad, Precio Unitario, Monto */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  placeholder="Ej: 150"
                  value={newExpense.quantity ?? ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      quantity: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Litros, días, etc.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Precio Unitario</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={newExpense.unitPrice ?? ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      unitPrice: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Monto Total <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={newExpense.amount ?? ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      amount: e.target.value ? Number(e.target.value) : 0,
                    })
                  }
                  className={cn(
                    newExpense.quantity && newExpense.unitPrice && "bg-muted",
                  )}
                />
                {newExpense.quantity && newExpense.unitPrice && (
                  <p className="text-xs text-muted-foreground">
                    Calculado: {newExpense.quantity} × ${newExpense.unitPrice}
                  </p>
                )}
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* SECCIÓN 4: Forma de Pago y Moneda */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Forma de Pago</Label>
                <Select
                  value={newExpense.paymentMethod || "01"}
                  onValueChange={(value) =>
                    setNewExpense({ ...newExpense, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((pm) => (
                      <SelectItem key={pm.code} value={pm.code}>
                        <span className="font-mono text-xs mr-2">
                          {pm.code}
                        </span>
                        {pm.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select
                  value={newExpense.currency || "MXN"}
                  onValueChange={(value) =>
                    setNewExpense({
                      ...newExpense,
                      currency: value,
                      exchangeRate:
                        value === "MXN" ? undefined : newExpense.exchangeRate,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} - {c.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de cambio (condicional) */}
              {newExpense.currency && newExpense.currency !== "MXN" && (
                <div className="space-y-2">
                  <Label>
                    Tipo de Cambio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ej: 17.50"
                    step="0.0001"
                    value={newExpense.exchangeRate ?? ""}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        exchangeRate: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  {!newExpense.exchangeRate && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Requerido para moneda extranjera
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* SECCIÓN 5: Proveedor */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre del Proveedor</Label>
                <Input
                  placeholder="Razón social o nombre comercial"
                  value={newExpense.vendorName || ""}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, vendorName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>RFC del Proveedor</Label>
                <Input
                  placeholder="XAXX010101000"
                  value={newExpense.vendorRfc || ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      vendorRfc: e.target.value.toUpperCase(),
                    })
                  }
                  className={cn(
                    newExpense.vendorRfc &&
                      !validateRfc(newExpense.vendorRfc) &&
                      "border-destructive",
                  )}
                />
                {newExpense.vendorRfc && !validateRfc(newExpense.vendorRfc) && (
                  <p className="text-xs text-destructive">
                    Formato de RFC inválido
                  </p>
                )}
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input
                placeholder="Lugar donde se realizó el gasto"
                value={newExpense.location || ""}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, location: e.target.value })
                }
              />
            </div>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* SECCIÓN 6: CFDI (Colapsable) */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <Collapsible
              open={cfdiSectionOpen}
              onOpenChange={setCfdiSectionOpen}
            >
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-between p-0 h-auto hover:bg-transparent"
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    Datos del CFDI (Factura)
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      cfdiSectionOpen && "rotate-180",
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasCfdi"
                    checked={newExpense.hasCfdi}
                    onCheckedChange={(checked) =>
                      setNewExpense({ ...newExpense, hasCfdi: !!checked })
                    }
                  />
                  <Label
                    htmlFor="hasCfdi"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Este gasto tiene factura electrónica (CFDI)
                  </Label>
                </div>

                {newExpense.hasCfdi && (
                  <div className="grid gap-4 sm:grid-cols-2 pl-6 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label>UUID del CFDI</Label>
                      <Input
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        value={newExpense.cfdiUuid || ""}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            cfdiUuid: e.target.value,
                          })
                        }
                        className={cn(
                          "font-mono text-sm",
                          newExpense.cfdiUuid &&
                            !validateUuid(newExpense.cfdiUuid) &&
                            "border-destructive",
                        )}
                      />
                      {newExpense.cfdiUuid &&
                        !validateUuid(newExpense.cfdiUuid) && (
                          <p className="text-xs text-destructive">
                            Formato de UUID inválido
                          </p>
                        )}
                    </div>

                    <div className="space-y-2">
                      <Label>Folio del Proveedor</Label>
                      <Input
                        placeholder="Ej: A-12345"
                        value={newExpense.cfdiFolio || ""}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            cfdiFolio: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* ─────────────────────────────────────────────────────────────── */}
            {/* SECCIÓN 7: Notas y Es Estimado */}
            {/* ─────────────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={newExpense.notes || ""}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, notes: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isEstimated"
                checked={newExpense.isEstimated}
                onCheckedChange={(checked) =>
                  setNewExpense({ ...newExpense, isEstimated: !!checked })
                }
              />
              <Label
                htmlFor="isEstimated"
                className="text-sm font-normal cursor-pointer"
              >
                Es un gasto estimado (aún no se ha realizado)
              </Label>
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
              disabled={!isFormValid}
            >
              {editingIndex !== null ? "Guardar Cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
