/**
 * CargoStep - Paso 3 del Wizard
 * Cargas: Mercancías a transportar con soporte para Carta Porte 3.1
 *
 * Modelo Carga → Movimientos (pickup/delivery):
 * - Cada parada con operación de carga (pickup) es un contenedor visual.
 * - Al agregar una carga se crea automáticamente un movimiento "pickup".
 * - El usuario puede asignar opcionalmente puntos de entrega (delivery)
 *   con soporte de entregas parciales (dividir peso/unidades).
 * - Validación: todas las paradas pickup deben tener al menos una carga.
 *
 * Campos Carta Porte 3.1:
 * - satProductCode: Clave del producto SAT (c_ClaveProdServCP)
 * - satUnitCode: Clave de unidad SAT (c_ClaveUnidad)
 * - weightInKg: Peso en kg (obligatorio para CP)
 * - hazardousMaterial: Bandera de material peligroso
 * - hazardousMaterialCode: Clave del material peligroso
 * - packagingType: Tipo de embalaje
 *
 * Validación de capacidad:
 * - Se valida que el peso total de las cargas no exceda la capacidad del vehículo
 * - Se muestra un indicador visual de capacidad utilizada
 * - Se alerta si se excede la capacidad para sugerir cambiar de vehículo
 *
 * Ubicación: src/pages/trips/create/components/CargoStep.tsx
 */

import { useState, useMemo } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { Textarea } from "@shared/ui/text-area";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
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
  Package,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  MapPin,
  Navigation,
  Flag,
  AlertTriangle,
  Truck,
  ChevronsUpDown,
  Check,
  AlertCircle,
  ChevronDown,
  Scale,
  Box,
  FileText,
  Gauge,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type {
  TripWizardFormValues,
  TripCargoFormValues,
  CargoMovementFormValues,
} from "../validation";
import { StopType } from "@features/trips";
import { useVehicle } from "@features/vehicles/application";

// ============================================================================
// TYPES
// ============================================================================

interface CargoStepProps {
  form: UseFormReturn<TripWizardFormValues, any, any>;
  cargosFieldArray: UseFieldArrayReturn<TripWizardFormValues, "cargos">;
  clients: Array<{ id: string; legalName: string }>;
  isLoadingClients: boolean;
}

interface PickupStopInfo {
  index: number;
  address: string;
  city: string;
  state?: string;
  clientId?: string;
  clientName?: string;
  locationName?: string;
  category: "origin" | "waypoint" | "destination";
}

interface DeliveryStopInfo {
  index: number;
  address: string;
  city: string;
  locationName?: string;
  clientId?: string;
  clientName?: string;
  category: "origin" | "waypoint" | "destination";
}

interface SatProduct {
  code: string;
  description: string;
  requiresHazmat?: boolean;
}

interface SatUnit {
  code: string;
  name: string;
  symbol?: string;
}

interface HazardousMaterial {
  code: string;
  description: string;
}

interface PackagingType {
  code: string;
  description: string;
}

// ============================================================================
// CATÁLOGOS SAT (Datos estáticos temporales - Top productos de transporte)
// Estos se migrarán a una API de búsqueda en BD posteriormente
// ============================================================================

const SAT_PRODUCTS: SatProduct[] = [
  // Productos generales de transporte
  { code: "78101800", description: "Transporte de carga por carretera" },
  {
    code: "78101801",
    description: "Servicios de transporte de carga a granel",
  },
  {
    code: "78101802",
    description: "Servicios de transporte de carga en contenedor",
  },
  {
    code: "78101803",
    description: "Servicios de transporte de carga refrigerada",
  },
  { code: "78101804", description: "Servicios de transporte de automóviles" },
  {
    code: "78101806",
    description: "Servicios de transporte de productos peligrosos",
    requiresHazmat: true,
  },

  // Alimentos y bebidas
  { code: "50000000", description: "Alimentos, bebidas y tabaco" },
  { code: "50101500", description: "Frutas frescas" },
  { code: "50101700", description: "Verduras frescas" },
  { code: "50112000", description: "Carnes frescas" },
  { code: "50131600", description: "Productos lácteos" },
  { code: "50202300", description: "Bebidas no alcohólicas" },
  { code: "50202200", description: "Bebidas alcohólicas" },

  // Materiales de construcción
  { code: "30101500", description: "Materiales de construcción" },
  { code: "30111600", description: "Cemento y cal" },
  { code: "30111700", description: "Concreto y mortero" },
  { code: "30121500", description: "Ladrillos y bloques" },
  { code: "30131500", description: "Varillas y perfiles de acero" },
  { code: "30141500", description: "Madera aserrada" },

  // Productos químicos
  {
    code: "12141900",
    description: "Productos químicos industriales",
    requiresHazmat: true,
  },
  {
    code: "12142100",
    description: "Solventes industriales",
    requiresHazmat: true,
  },
  {
    code: "15101500",
    description: "Combustibles y lubricantes",
    requiresHazmat: true,
  },
  { code: "15111500", description: "Aceites lubricantes" },

  // Maquinaria y equipo
  { code: "20101500", description: "Equipo minero y de perforación" },
  { code: "23101500", description: "Maquinaria industrial" },
  { code: "23151500", description: "Maquinaria para construcción" },
  { code: "24101500", description: "Maquinaria para manejo de materiales" },
  { code: "25101500", description: "Vehículos de motor" },

  // Electrónica y tecnología
  { code: "43201500", description: "Computadoras y accesorios" },
  { code: "43211500", description: "Equipos de comunicación" },
  { code: "52161500", description: "Electrodomésticos" },

  // Textiles
  { code: "11121600", description: "Textiles y telas" },
  { code: "53101500", description: "Ropa y accesorios" },
  { code: "53102500", description: "Calzado" },

  // Papel y empaques
  { code: "14111500", description: "Papel y cartón" },
  { code: "24112400", description: "Empaques y contenedores" },

  // Productos farmacéuticos
  { code: "51101500", description: "Medicamentos" },
  { code: "51102700", description: "Productos médicos" },

  // Productos agrícolas
  { code: "10101500", description: "Plantas y semillas" },
  { code: "10121500", description: "Animales vivos" },
  { code: "10151500", description: "Productos agrícolas" },
  { code: "10171500", description: "Fertilizantes", requiresHazmat: true },

  // Muebles
  { code: "56101500", description: "Muebles de oficina" },
  { code: "56111500", description: "Muebles del hogar" },

  // Otros
  { code: "31162800", description: "Piezas metálicas" },
  { code: "31211500", description: "Pinturas y recubrimientos" },
  { code: "40101700", description: "Equipos de calefacción y aire" },
  { code: "41111500", description: "Equipo de laboratorio" },
  { code: "44121500", description: "Material de oficina" },
  { code: "60101200", description: "Libros y publicaciones" },
];

const SAT_UNITS: SatUnit[] = [
  // Peso
  { code: "KGM", name: "Kilogramo", symbol: "kg" },
  { code: "GRM", name: "Gramo", symbol: "g" },
  { code: "TNE", name: "Tonelada métrica", symbol: "t" },
  { code: "LBR", name: "Libra", symbol: "lb" },

  // Volumen
  { code: "LTR", name: "Litro", symbol: "L" },
  { code: "MLT", name: "Mililitro", symbol: "mL" },
  { code: "MTQ", name: "Metro cúbico", symbol: "m³" },
  { code: "GLL", name: "Galón", symbol: "gal" },

  // Longitud
  { code: "MTR", name: "Metro", symbol: "m" },
  { code: "CMT", name: "Centímetro", symbol: "cm" },
  { code: "FOT", name: "Pie", symbol: "ft" },

  // Unidades contables
  { code: "H87", name: "Pieza", symbol: "pza" },
  { code: "EA", name: "Elemento", symbol: "ea" },
  { code: "XBX", name: "Caja", symbol: "caja" },
  { code: "XPK", name: "Paquete", symbol: "paq" },
  { code: "XUN", name: "Unidad", symbol: "u" },
  { code: "SET", name: "Conjunto", symbol: "set" },
  { code: "XKI", name: "Kit", symbol: "kit" },
  { code: "DZN", name: "Docena", symbol: "doz" },
  { code: "GRS", name: "Gruesa (144)", symbol: "grs" },
  { code: "MIL", name: "Millar", symbol: "mil" },

  // Contenedores
  { code: "XPL", name: "Pallet", symbol: "tarima" },
  { code: "XTB", name: "Tina/Cubeta", symbol: "cubeta" },
  { code: "XSA", name: "Saco", symbol: "saco" },
  { code: "XBA", name: "Barril", symbol: "barril" },
  { code: "XCT", name: "Cartón", symbol: "cartón" },
  { code: "XBG", name: "Bolsa", symbol: "bolsa" },
  { code: "XRO", name: "Rollo", symbol: "rollo" },
  { code: "XCY", name: "Cilindro", symbol: "cilindro" },

  // Área
  { code: "MTK", name: "Metro cuadrado", symbol: "m²" },
];

const HAZARDOUS_MATERIALS: HazardousMaterial[] = [
  // Clase 1: Explosivos
  { code: "0004", description: "Picrato de amonio" },
  { code: "0072", description: "Ciclonita" },

  // Clase 2: Gases
  { code: "1001", description: "Acetileno disuelto" },
  { code: "1002", description: "Aire comprimido" },
  { code: "1011", description: "Butano" },
  { code: "1017", description: "Cloro" },
  { code: "1049", description: "Hidrógeno comprimido" },
  { code: "1075", description: "Gas LP (propano/butano)" },
  { code: "1978", description: "Propano" },

  // Clase 3: Líquidos inflamables
  { code: "1114", description: "Benceno" },
  { code: "1170", description: "Etanol (alcohol etílico)" },
  { code: "1202", description: "Diésel" },
  { code: "1203", description: "Gasolina" },
  { code: "1230", description: "Metanol" },
  { code: "1263", description: "Pintura o productos de pintura" },
  { code: "1267", description: "Petróleo crudo" },
  { code: "1294", description: "Tolueno" },
  { code: "1300", description: "Aguarrás" },
  { code: "1863", description: "Combustible para avión" },
  { code: "1993", description: "Líquido inflamable n.e.p." },

  // Clase 4: Sólidos inflamables
  { code: "1325", description: "Sólido inflamable orgánico n.e.p." },
  { code: "1350", description: "Azufre" },
  { code: "2304", description: "Naftaleno fundido" },

  // Clase 5: Sustancias comburentes
  { code: "1942", description: "Nitrato de amonio" },
  { code: "2014", description: "Peróxido de hidrógeno" },
  { code: "2067", description: "Fertilizantes a base de nitrato amónico" },

  // Clase 6: Sustancias tóxicas
  { code: "1593", description: "Diclorometano" },
  { code: "1851", description: "Medicamentos líquidos tóxicos" },
  { code: "2810", description: "Líquido orgánico tóxico n.e.p." },

  // Clase 8: Sustancias corrosivas
  { code: "1789", description: "Ácido clorhídrico" },
  { code: "1805", description: "Ácido fosfórico" },
  { code: "1823", description: "Hidróxido de sodio sólido" },
  { code: "1824", description: "Hidróxido de sodio en solución" },
  { code: "1830", description: "Ácido sulfúrico" },
  { code: "2031", description: "Ácido nítrico" },
  { code: "2672", description: "Amoníaco en solución" },
  { code: "2796", description: "Ácido de batería" },

  // Clase 9: Sustancias peligrosas diversas
  {
    code: "3077",
    description: "Sustancia sólida peligrosa para el medio ambiente",
  },
  {
    code: "3082",
    description: "Sustancia líquida peligrosa para el medio ambiente",
  },
  { code: "3480", description: "Baterías de litio" },
  { code: "3481", description: "Baterías de litio contenidas en equipo" },
];

const PACKAGING_TYPES: PackagingType[] = [
  // Tambores/Bidones
  { code: "1A1", description: "Tambor de acero, tapa no desmontable" },
  { code: "1A2", description: "Tambor de acero, tapa desmontable" },
  { code: "1B1", description: "Tambor de aluminio, tapa no desmontable" },
  { code: "1B2", description: "Tambor de aluminio, tapa desmontable" },
  { code: "1H1", description: "Tambor de plástico, tapa no desmontable" },
  { code: "1H2", description: "Tambor de plástico, tapa desmontable" },

  // Barriles
  { code: "2C1", description: "Barril de madera, con tapa" },
  { code: "2C2", description: "Barril de madera, tapa desmontable" },

  // Bidones/Jerricanes
  { code: "3A1", description: "Jerricán de acero, tapa no desmontable" },
  { code: "3A2", description: "Jerricán de acero, tapa desmontable" },
  { code: "3H1", description: "Jerricán de plástico, tapa no desmontable" },
  { code: "3H2", description: "Jerricán de plástico, tapa desmontable" },

  // Cajas
  { code: "4A", description: "Caja de acero" },
  { code: "4B", description: "Caja de aluminio" },
  { code: "4C1", description: "Caja de madera natural, ordinaria" },
  { code: "4C2", description: "Caja de madera natural, paredes estancas" },
  { code: "4D", description: "Caja de contrachapado" },
  { code: "4G", description: "Caja de cartón" },
  { code: "4H1", description: "Caja de plástico expandido" },
  { code: "4H2", description: "Caja de plástico rígido" },

  // Sacos
  { code: "5H1", description: "Saco de película de plástico" },
  { code: "5H2", description: "Saco de plástico tejido, sin forro" },
  { code: "5H3", description: "Saco de plástico tejido, estanco" },
  { code: "5L1", description: "Saco de textil, sin forro" },
  { code: "5L2", description: "Saco de textil, estanco" },
  { code: "5M1", description: "Saco de papel multipliegos" },
  {
    code: "5M2",
    description: "Saco de papel multipliegos, resistente al agua",
  },

  // Embalajes compuestos
  { code: "6HA1", description: "Recipiente de plástico en tambor de acero" },
  { code: "6HG1", description: "Recipiente de plástico en caja de cartón" },
  { code: "6HH1", description: "Recipiente de plástico en caja de plástico" },

  // Otros
  { code: "0", description: "Sin embalaje/a granel" },
];

const CURRENCY_OPTIONS = [
  { value: "MXN", label: "MXN - Peso Mexicano" },
  { value: "USD", label: "USD - Dólar Americano" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CargoStep({
  form,
  cargosFieldArray,
  clients,
  isLoadingClients,
}: CargoStepProps) {
  const { fields, append, remove, update } = cargosFieldArray;
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newCargo, setNewCargo] = useState<Partial<TripCargoFormValues>>({});

  // Estado para entregas parciales en el dialog
  const [deliveryAssignments, setDeliveryAssignments] = useState<
    CargoMovementFormValues[]
  >([]);

  // Estado para el combobox de productos SAT
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Estado para sección colapsable de material peligroso
  const [hazmatSectionOpen, setHazmatSectionOpen] = useState(false);

  // ============================================
  // Obtener vehículo seleccionado para validar capacidad
  // ============================================

  const vehicleId = form.watch("vehicleId");
  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(vehicleId);

  // Capacidad del vehículo en kg (loadCapacity viene en toneladas)
  const vehicleCapacityKg = useMemo(() => {
    if (!vehicle?.data.capacities?.loadCapacity) return null;
    return vehicle.data.capacities.loadCapacity * 1000; // Convertir toneladas a kg
  }, [vehicle]);

  // ============================================
  // Lectura de paradas desde el form (RouteStep)
  // ============================================

  const stops = form.watch("stops");

  /** Paradas con operación de carga (pickup) */
  const pickupStops: PickupStopInfo[] = useMemo(() => {
    if (!stops || stops.length === 0) return [];

    return stops
      .map((stop, index) => {
        if (!stop.stopType.includes(StopType.PICKUP)) return null;

        const hasOrigin = stop.stopType.includes(StopType.ORIGIN);
        const hasDestination = stop.stopType.includes(StopType.DESTINATION);

        let category: "origin" | "waypoint" | "destination" = "waypoint";
        if (hasOrigin) category = "origin";
        else if (hasDestination) category = "destination";

        const client = stop.clientId
          ? clients.find((c) => c.id === stop.clientId)
          : undefined;

        return {
          index,
          address: stop.address,
          city: stop.city,
          state: stop.state,
          clientId: stop.clientId,
          clientName: client?.legalName,
          locationName: stop.locationName,
          category,
        } satisfies PickupStopInfo;
      })
      .filter((s): s is PickupStopInfo => s !== null);
  }, [stops, clients]);

  /** Paradas con operación de descarga (delivery) */
  const deliveryStops: DeliveryStopInfo[] = useMemo(() => {
    if (!stops || stops.length === 0) return [];

    return stops
      .map((stop, index) => {
        if (!stop.stopType.includes(StopType.DELIVERY)) return null;

        const hasOrigin = stop.stopType.includes(StopType.ORIGIN);
        const hasDestination = stop.stopType.includes(StopType.DESTINATION);

        let category: "origin" | "waypoint" | "destination" = "waypoint";
        if (hasDestination) category = "destination";
        else if (hasOrigin) category = "origin";

        const client = stop.clientId
          ? clients.find((c) => c.id === stop.clientId)
          : undefined;

        return {
          index,
          address: stop.address,
          city: stop.city,
          locationName: stop.locationName,
          clientId: stop.clientId,
          clientName: client?.legalName,
          category,
        } satisfies DeliveryStopInfo;
      })
      .filter((s): s is DeliveryStopInfo => s !== null);
  }, [stops, clients]);

  /** Cargas cuyo primer movimiento pickup coincide con la parada */
  const getCargosForStop = (
    stopIndex: number,
  ): { cargo: (typeof fields)[number]; fieldIndex: number }[] => {
    return fields
      .map((cargo, fieldIndex) => ({ cargo, fieldIndex }))
      .filter(({ cargo }) => {
        const pickupMovement = cargo.movements?.find(
          (m) => m.movementType === "pickup",
        );
        return pickupMovement?.stopIndex === stopIndex;
      });
  };

  /** Paradas pickup sin cargas registradas */
  const stopsWithoutCargos: PickupStopInfo[] = useMemo(() => {
    return pickupStops.filter(
      (stop) => getCargosForStop(stop.index).length === 0,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupStops, fields]);

  /** Delivery stops después del pickup actual */
  const getAvailableDeliveryStops = (
    pickupStopIndex: number,
  ): DeliveryStopInfo[] => {
    return deliveryStops.filter((s) => s.index > pickupStopIndex);
  };

  // Filtrar productos por búsqueda
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery) return SAT_PRODUCTS.slice(0, 20);
    const query = productSearchQuery.toLowerCase();
    return SAT_PRODUCTS.filter(
      (p) =>
        p.code.includes(query) || p.description.toLowerCase().includes(query),
    ).slice(0, 20);
  }, [productSearchQuery]);

  // ============================================
  // Handlers
  // ============================================

  const handleOpenAddDialog = (pickupStop: PickupStopInfo) => {
    setEditingIndex(null);
    const clientId = pickupStop.clientId || "";
    setNewCargo({
      clientId,
      description: "",
      weight: undefined,
      volume: undefined,
      units: undefined,
      declaredValue: undefined,
      rate: 0,
      currency: "MXN",
      movements: [{ stopIndex: pickupStop.index, movementType: "pickup" }],
      notes: "",
      specialInstructions: "",
      // Campos Carta Porte
      satProductCode: "",
      satUnitCode: "H87", // Default: Pieza
      satUnitName: "Pieza",
      weightInKg: undefined,
      dimensions: "",
      hazardousMaterial: false,
      hazardousMaterialCode: "",
      packagingType: "",
      packagingDescription: "",
    });
    setDeliveryAssignments([]);
    setHazmatSectionOpen(false);
    setProductSearchQuery("");
    setIsCargoDialogOpen(true);
  };

  const handleOpenEditDialog = (fieldIndex: number) => {
    setEditingIndex(fieldIndex);
    const cargo = fields[fieldIndex];
    setNewCargo({ ...cargo });
    const existingDeliveries = (cargo.movements || []).filter(
      (m) => m.movementType === "delivery",
    );
    setDeliveryAssignments(existingDeliveries);
    setHazmatSectionOpen(!!cargo.hazardousMaterial);
    setProductSearchQuery("");
    setIsCargoDialogOpen(true);
  };

  const handleAddDeliveryAssignment = () => {
    setDeliveryAssignments((prev) => [
      ...prev,
      { stopIndex: -1, movementType: "delivery" as const },
    ]);
  };

  const handleUpdateDeliveryAssignment = (
    index: number,
    field: keyof CargoMovementFormValues,
    value: string | number,
  ) => {
    setDeliveryAssignments((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  };

  const handleRemoveDeliveryAssignment = (index: number) => {
    setDeliveryAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectProduct = (product: SatProduct) => {
    setNewCargo({
      ...newCargo,
      satProductCode: product.code,
      // Auto-llenar descripción con el nombre del catálogo (el usuario puede editarla)
      description: product.description,
      // Si el producto requiere material peligroso, abrir la sección
      hazardousMaterial: product.requiresHazmat || newCargo.hazardousMaterial,
    });
    if (product.requiresHazmat) {
      setHazmatSectionOpen(true);
    }
    setProductSearchOpen(false);
    setProductSearchQuery("");
  };

  const handleSelectUnit = (unit: SatUnit) => {
    setNewCargo({
      ...newCargo,
      satUnitCode: unit.code,
      satUnitName: unit.name,
    });
  };

  const handleHazmatChange = (checked: boolean) => {
    setNewCargo({
      ...newCargo,
      hazardousMaterial: checked,
      // Limpiar campos si se desmarca
      hazardousMaterialCode: checked ? newCargo.hazardousMaterialCode : "",
      packagingType: checked ? newCargo.packagingType : "",
      packagingDescription: checked ? newCargo.packagingDescription : "",
    });
    setHazmatSectionOpen(checked);
  };

  const handleSaveCargo = () => {
    if (
      !newCargo.clientId ||
      !newCargo.description ||
      newCargo.rate === undefined ||
      !newCargo.movements ||
      newCargo.movements.length === 0
    ) {
      return;
    }

    const pickupMovement = newCargo.movements.find(
      (m) => m.movementType === "pickup",
    );
    if (!pickupMovement) return;

    const validDeliveries: CargoMovementFormValues[] = deliveryAssignments
      .filter((d) => d.stopIndex >= 0)
      .map((d) => ({
        stopIndex: d.stopIndex,
        movementType: "delivery" as const,
        weight: d.weight,
        units: d.units,
        notes: d.notes,
      }));

    const allMovements: CargoMovementFormValues[] = [
      pickupMovement,
      ...validDeliveries,
    ];

    const cargoData: TripCargoFormValues = {
      id: newCargo.id,
      clientId: newCargo.clientId,
      description: newCargo.description,
      weight: newCargo.weight,
      volume: newCargo.volume,
      units: newCargo.units,
      declaredValue: newCargo.declaredValue,
      rate: newCargo.rate || 0,
      currency: newCargo.currency || "MXN",
      movements: allMovements,
      notes: newCargo.notes,
      specialInstructions: newCargo.specialInstructions,
      // Campos Carta Porte
      satProductCode: newCargo.satProductCode,
      satUnitCode: newCargo.satUnitCode,
      satUnitName: newCargo.satUnitName,
      weightInKg: newCargo.weightInKg,
      dimensions: newCargo.dimensions,
      hazardousMaterial: newCargo.hazardousMaterial,
      hazardousMaterialCode: newCargo.hazardousMaterial
        ? newCargo.hazardousMaterialCode
        : undefined,
      packagingType: newCargo.hazardousMaterial
        ? newCargo.packagingType
        : undefined,
      packagingDescription: newCargo.hazardousMaterial
        ? newCargo.packagingDescription
        : undefined,
    };

    if (editingIndex !== null) {
      update(editingIndex, cargoData);
    } else {
      append(cargoData);
    }

    setNewCargo({});
    setDeliveryAssignments([]);
    setEditingIndex(null);
    setIsCargoDialogOpen(false);
  };

  // ============================================
  // UI Helpers
  // ============================================

  const getClientName = (clientId: string): string => {
    const client = clients.find((c) => c.id === clientId);
    return client?.legalName || "Sin cliente";
  };

  const getStopLabel = (stopIndex: number): string => {
    const stop = stops?.[stopIndex];
    if (!stop) return `Parada #${stopIndex + 1}`;
    return `#${stopIndex + 1} ${stop.locationName || stop.address}`;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getSelectedProductDescription = (): string => {
    if (!newCargo.satProductCode) return "";
    const product = SAT_PRODUCTS.find(
      (p) => p.code === newCargo.satProductCode,
    );
    return product
      ? `${product.code} - ${product.description}`
      : newCargo.satProductCode;
  };

  const getUnitSymbol = (code: string): string => {
    const unit = SAT_UNITS.find((u) => u.code === code);
    return unit?.symbol || code;
  };

  const totalRevenue = fields.reduce(
    (sum, cargo) => sum + (cargo.rate || 0),
    0,
  );

  const totalWeight = fields.reduce(
    (sum, cargo) => sum + (cargo.weightInKg || cargo.weight || 0),
    0,
  );

  // ============================================
  // Cálculos de capacidad del vehículo
  // ============================================

  const capacityPercentage = useMemo(() => {
    if (!vehicleCapacityKg || vehicleCapacityKg === 0) return 0;
    return Math.min((totalWeight / vehicleCapacityKg) * 100, 100);
  }, [totalWeight, vehicleCapacityKg]);

  const isOverCapacity = vehicleCapacityKg
    ? totalWeight > vehicleCapacityKg
    : false;
  const isNearCapacity = vehicleCapacityKg
    ? capacityPercentage >= 90 && !isOverCapacity
    : false;
  const isModerateCapacity = vehicleCapacityKg
    ? capacityPercentage >= 70 && capacityPercentage < 90
    : false;

  const getCapacityColor = (): string => {
    if (isOverCapacity) return "text-red-600";
    if (isNearCapacity) return "text-orange-600";
    if (isModerateCapacity) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = (): string => {
    if (isOverCapacity) return "bg-red-500";
    if (isNearCapacity) return "bg-orange-500";
    if (isModerateCapacity) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatWeight = (weightKg: number): string => {
    if (weightKg >= 1000) {
      return `${(weightKg / 1000).toLocaleString("es-MX", { maximumFractionDigits: 2 })} t`;
    }
    return `${weightKg.toLocaleString("es-MX")} kg`;
  };

  const totalCargos = fields.length;
  const hasNoPickupStops = pickupStops.length === 0;
  const hasHazmatCargo = fields.some((c) => c.hazardousMaterial);

  // Dialog helpers
  const currentPickupStop = pickupStops.find((s) => {
    const pm = newCargo.movements?.find((m) => m.movementType === "pickup");
    return pm && s.index === pm.stopIndex;
  });
  const stopHasClient = !!currentPickupStop?.clientId;

  const availableDeliveryForDialog = currentPickupStop
    ? getAvailableDeliveryStops(currentPickupStop.index)
    : [];

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Alerta: no hay paradas con carga */}
      {hasNoPickupStops && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  No hay paradas con operación de carga
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Regrese al paso de Ruta y asegúrese de que al menos una parada
                  tenga la operación de &quot;Carga&quot; (pickup) para poder
                  registrar mercancías.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: paradas sin cargas */}
      {stopsWithoutCargos.length > 0 && !hasNoPickupStops && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  {stopsWithoutCargos.length === 1
                    ? "1 parada de carga sin mercancías registradas"
                    : `${stopsWithoutCargos.length} paradas de carga sin mercancías registradas`}
                </p>
                <ul className="text-xs text-orange-700 mt-1 space-y-0.5">
                  {stopsWithoutCargos.map((stop) => (
                    <li key={stop.index}>
                      • Parada #{stop.index + 1}:{" "}
                      {stop.locationName || stop.address} ({stop.city})
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-orange-700 mt-2">
                  Todas las paradas de carga deben tener al menos una mercancía
                  para continuar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ INDICADOR DE CAPACIDAD DEL VEHÍCULO ============ */}
      {vehicleCapacityKg && vehicleCapacityKg > 0 && (
        <Card
          className={cn(
            "transition-colors",
            isOverCapacity && "border-red-300 bg-red-50/50",
            isNearCapacity && "border-orange-300 bg-orange-50/50",
          )}
        >
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Header con icono de camión */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-lg",
                      isOverCapacity && "bg-red-100 text-red-600",
                      isNearCapacity && "bg-orange-100 text-orange-600",
                      isModerateCapacity && "bg-yellow-100 text-yellow-600",
                      !isOverCapacity &&
                        !isNearCapacity &&
                        !isModerateCapacity &&
                        "bg-green-100 text-green-600",
                    )}
                  >
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      Capacidad del Vehículo
                      {vehicle && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({vehicle.data.unitNumber} - {vehicle.data.brand}{" "}
                          {vehicle.data.model})
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Capacidad máxima: {formatWeight(vehicleCapacityKg)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-2xl font-bold", getCapacityColor())}>
                    {capacityPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">utilizado</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="space-y-2">
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      getProgressColor(),
                    )}
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  />
                  {/* Indicador de exceso */}
                  {isOverCapacity && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        ¡EXCEDIDO!
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Cargado:{" "}
                    <span className={cn("font-medium", getCapacityColor())}>
                      {formatWeight(totalWeight)}
                    </span>
                  </span>
                  <span>
                    Disponible:{" "}
                    <span className="font-medium">
                      {isOverCapacity
                        ? `−${formatWeight(totalWeight - vehicleCapacityKg)} (excedido)`
                        : formatWeight(vehicleCapacityKg - totalWeight)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Desglose por carga (solo si hay cargas) */}
              {fields.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Desglose de cargas:
                  </p>
                  <div className="space-y-1">
                    {fields.map((cargo, idx) => {
                      const cargoWeight = cargo.weightInKg || cargo.weight || 0;
                      const cargoPercentage =
                        vehicleCapacityKg > 0
                          ? (cargoWeight / vehicleCapacityKg) * 100
                          : 0;
                      return (
                        <div
                          key={cargo.id || idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="truncate max-w-[60%] text-muted-foreground">
                            {cargo.description || `Carga ${idx + 1}`}
                          </span>
                          <span className="font-medium">
                            {formatWeight(cargoWeight)} (
                            {cargoPercentage.toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: Sobrepeso del vehículo */}
      {isOverCapacity && (
        <Card className="border-red-300 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  ¡Capacidad del vehículo excedida!
                </p>
                <p className="text-xs text-red-700 mt-1">
                  El peso total de las cargas ({formatWeight(totalWeight)})
                  excede la capacidad del vehículo (
                  {formatWeight(vehicleCapacityKg!)}). Exceso:{" "}
                  <strong>
                    {formatWeight(totalWeight - vehicleCapacityKg!)}
                  </strong>
                </p>
                <p className="text-xs text-red-700 mt-2">
                  Opciones: Reduzca el peso de las cargas o seleccione un
                  vehículo con mayor capacidad en el Paso 1 (Información).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: Vehículo sin capacidad definida */}
      {vehicleId &&
        !isLoadingVehicle &&
        (!vehicleCapacityKg || vehicleCapacityKg === 0) && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Vehículo sin capacidad de carga definida
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    El vehículo seleccionado no tiene registrada su capacidad de
                    carga. No se podrá validar si las cargas exceden la
                    capacidad del vehículo.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Puede continuar, pero se recomienda actualizar la capacidad
                    del vehículo en el módulo de Vehículos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Encabezado con resumen */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" /> Cargas del Viaje
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalCargos} carga{totalCargos !== 1 ? "s" : ""} en{" "}
            {pickupStops.length} punto
            {pickupStops.length !== 1 ? "s" : ""} de carga
            {totalWeight > 0 && ` • ${formatWeight(totalWeight)} total`}
          </p>
        </div>
        <div className="text-right space-y-1">
          {totalCargos > 0 && (
            <>
              <p className="text-xs text-muted-foreground">Ingreso Total</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(totalRevenue, "MXN")}
              </p>
            </>
          )}
          {hasHazmatCargo && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Contiene material peligroso</span>
            </div>
          )}
        </div>
      </div>

      {/* ============ PARADAS COMO CONTENEDORES ============ */}
      {pickupStops.map((pickupStop) => {
        const stopCargos = getCargosForStop(pickupStop.index);
        const StopIcon =
          pickupStop.category === "origin"
            ? Navigation
            : pickupStop.category === "destination"
              ? Flag
              : MapPin;
        const stopTotal = stopCargos.reduce(
          (sum, { cargo }) => sum + (cargo.rate || 0),
          0,
        );
        const hasMissing = stopCargos.length === 0;

        return (
          <Card
            key={pickupStop.index}
            className={cn(
              pickupStop.category === "origin" && "border-green-200",
              pickupStop.category === "destination" && "border-red-200",
              hasMissing && "border-orange-300",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0",
                      pickupStop.category === "origin" &&
                        "bg-green-100 text-green-700",
                      pickupStop.category === "destination" &&
                        "bg-red-100 text-red-700",
                      pickupStop.category === "waypoint" &&
                        "bg-gray-100 text-gray-700",
                    )}
                  >
                    <StopIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">
                        Parada #{pickupStop.index + 1}
                      </CardTitle>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded",
                          pickupStop.category === "origin" &&
                            "bg-green-100 text-green-700",
                          pickupStop.category === "destination" &&
                            "bg-red-100 text-red-700",
                          pickupStop.category === "waypoint" &&
                            "bg-gray-100 text-gray-700",
                        )}
                      >
                        {pickupStop.category === "origin"
                          ? "Origen"
                          : pickupStop.category === "destination"
                            ? "Destino"
                            : "Escala"}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                        Carga
                      </span>
                      {hasMissing && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                          Sin mercancías
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {pickupStop.locationName || pickupStop.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pickupStop.city}
                      {pickupStop.state && `, ${pickupStop.state}`}
                      {pickupStop.clientName && (
                        <span className="ml-1">
                          · Cliente:{" "}
                          <span className="font-medium">
                            {pickupStop.clientName}
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {stopCargos.length > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(stopTotal, "MXN")}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {stopCargos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border border-dashed border-orange-300 rounded-lg bg-orange-50/30">
                  <Package className="h-8 w-8 mx-auto mb-1 opacity-40" />
                  <p className="text-sm">Sin cargas registradas</p>
                  <p className="text-xs mt-0.5">
                    Debe registrar al menos una carga en esta parada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stopCargos.map(({ cargo, fieldIndex }) => {
                    const deliveries = (cargo.movements || []).filter(
                      (m) => m.movementType === "delivery",
                    );

                    return (
                      <div
                        key={cargo.id || fieldIndex}
                        className={cn(
                          "flex items-start gap-3 p-3 border rounded-lg bg-muted/30",
                          cargo.hazardousMaterial &&
                            "border-orange-300 bg-orange-50/30",
                        )}
                      >
                        <Package
                          className={cn(
                            "h-4 w-4 mt-0.5 flex-shrink-0",
                            cargo.hazardousMaterial
                              ? "text-orange-600"
                              : "text-muted-foreground",
                          )}
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-medium truncate">
                              {cargo.description}
                            </h4>
                            <span className="text-sm font-semibold text-primary flex-shrink-0">
                              {formatCurrency(cargo.rate, cargo.currency)}
                            </span>
                          </div>

                          {/* Badges de info */}
                          <div className="flex flex-wrap gap-1.5">
                            {cargo.satProductCode && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">
                                <FileText className="h-3 w-3" />
                                {cargo.satProductCode}
                              </span>
                            )}
                            {cargo.hazardousMaterial && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-orange-100 text-orange-700 border border-orange-200">
                                <AlertTriangle className="h-3 w-3" />
                                Mat. Peligroso
                              </span>
                            )}
                          </div>

                          {cargo.clientId !== pickupStop.clientId && (
                            <p className="text-xs text-muted-foreground">
                              Cliente: {getClientName(cargo.clientId)}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {cargo.weightInKg && (
                              <span className="flex items-center gap-1">
                                <Scale className="h-3 w-3" />
                                {cargo.weightInKg} kg
                              </span>
                            )}
                            {!cargo.weightInKg && cargo.weight && (
                              <span>Peso: {cargo.weight} kg</span>
                            )}
                            {cargo.units && (
                              <span className="flex items-center gap-1">
                                <Box className="h-3 w-3" />
                                {cargo.units} {cargo.satUnitName || "uds"}
                              </span>
                            )}
                            {cargo.volume && (
                              <span>Vol: {cargo.volume} m³</span>
                            )}
                            {cargo.dimensions && (
                              <span>Dim: {cargo.dimensions}</span>
                            )}
                          </div>

                          {/* Entregas asignadas */}
                          {deliveries.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {deliveries.map((del, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 text-xs rounded bg-orange-50 text-orange-700 border border-orange-200"
                                >
                                  <Truck className="h-3 w-3" />
                                  Entrega: {getStopLabel(del.stopIndex)}
                                  {del.weight != null && ` · ${del.weight} kg`}
                                  {del.units != null && ` · ${del.units} uds`}
                                </span>
                              ))}
                            </div>
                          )}

                          {cargo.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {cargo.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEditDialog(fieldIndex)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => remove(fieldIndex)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => handleOpenAddDialog(pickupStop)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Carga
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {/* Total general */}
      {totalCargos > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Ingreso Total Estimado:</span>
                {totalWeight > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    ({totalWeight.toLocaleString()} kg)
                  </span>
                )}
              </div>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalRevenue, "MXN")}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ DIALOG AGREGAR/EDITAR CARGA ============ */}
      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Editar Carga" : "Agregar Carga"}
            </DialogTitle>
            {currentPickupStop && (
              <p className="text-sm text-muted-foreground">
                Parada #{currentPickupStop.index + 1}:{" "}
                {currentPickupStop.locationName || currentPickupStop.address}
                {currentPickupStop.clientName &&
                  ` · ${currentPickupStop.clientName}`}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* ========== SECCIÓN: CLIENTE ========== */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Cliente
              </h4>

              <div className="space-y-2">
                <Label>Cliente *</Label>
                {stopHasClient ? (
                  <>
                    <Input
                      value={getClientName(newCargo.clientId || "")}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cliente asociado a la parada de carga
                    </p>
                  </>
                ) : (
                  <Select
                    value={newCargo.clientId || ""}
                    onValueChange={(value) =>
                      setNewCargo({ ...newCargo, clientId: value })
                    }
                    disabled={isLoadingClients}
                  >
                    <SelectTrigger>
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
                )}
              </div>
            </div>

            {/* ========== SECCIÓN: CLASIFICACIÓN SAT Y DESCRIPCIÓN ========== */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Clasificación SAT (Carta Porte)
              </h4>

              {/* Producto SAT - Combobox con búsqueda */}
              <div className="space-y-2">
                <Label>Clave de Producto SAT *</Label>
                <Popover
                  open={productSearchOpen}
                  onOpenChange={setProductSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productSearchOpen}
                      className="w-full justify-between font-normal"
                    >
                      {newCargo.satProductCode ? (
                        <span className="truncate">
                          {getSelectedProductDescription()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Buscar producto SAT...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar por código o descripción..."
                        value={productSearchQuery}
                        onValueChange={setProductSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No se encontraron productos</CommandEmpty>
                        <CommandGroup>
                          {filteredProducts.map((product) => (
                            <CommandItem
                              key={product.code}
                              value={`${product.code} ${product.description}`}
                              onSelect={() => handleSelectProduct(product)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newCargo.satProductCode === product.code
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <div className="flex-1">
                                <span className="font-mono text-xs bg-muted px-1 rounded mr-2">
                                  {product.code}
                                </span>
                                <span className="text-sm">
                                  {product.description}
                                </span>
                              </div>
                              {product.requiresHazmat && (
                                <AlertTriangle className="h-4 w-4 text-orange-500 ml-2" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Catálogo c_ClaveProdServCP del SAT. Busque por código o
                  descripción.
                </p>
              </div>

              {/* Descripción - Se auto-llena con el producto SAT pero es editable */}
              <div className="space-y-2">
                <Label>Descripción de la Mercancía *</Label>
                <Input
                  placeholder="Se auto-llena al seleccionar un producto SAT..."
                  value={newCargo.description || ""}
                  onChange={(e) =>
                    setNewCargo({ ...newCargo, description: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Se completa automáticamente con el producto SAT. Puede
                  editarla para mayor detalle.
                </p>
              </div>

              {/* Unidad SAT */}
              <div className="space-y-2">
                <Label>Unidad de Medida SAT *</Label>
                <Select
                  value={newCargo.satUnitCode || ""}
                  onValueChange={(value) => {
                    const unit = SAT_UNITS.find((u) => u.code === value);
                    if (unit) handleSelectUnit(unit);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAT_UNITS.map((unit) => (
                      <SelectItem key={unit.code} value={unit.code}>
                        <span className="font-mono text-xs bg-muted px-1 rounded mr-2">
                          {unit.code}
                        </span>
                        {unit.name}
                        {unit.symbol && (
                          <span className="text-muted-foreground ml-1">
                            ({unit.symbol})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ========== SECCIÓN: CANTIDAD Y PESO ========== */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Cantidad y Peso
              </h4>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cantidad *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0"
                      min="1"
                      className={cn(
                        "flex-1",
                        (!newCargo.units || newCargo.units <= 0) &&
                          "border-orange-300 focus-visible:ring-orange-500",
                      )}
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
                    <span className="flex items-center text-sm text-muted-foreground min-w-[60px]">
                      {newCargo.satUnitName || "unidades"}
                    </span>
                  </div>
                  {(!newCargo.units || newCargo.units <= 0) && (
                    <p className="text-xs text-orange-600">
                      Ingrese la cantidad
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Peso Total (kg) *
                    <span className="text-xs text-muted-foreground font-normal">
                      (Carta Porte)
                    </span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className={cn(
                      (!newCargo.weightInKg || newCargo.weightInKg <= 0) &&
                        "border-orange-300 focus-visible:ring-orange-500",
                    )}
                    value={newCargo.weightInKg ?? ""}
                    onChange={(e) =>
                      setNewCargo({
                        ...newCargo,
                        weightInKg: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                        weight: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  {(!newCargo.weightInKg || newCargo.weightInKg <= 0) && (
                    <p className="text-xs text-orange-600">Ingrese el peso</p>
                  )}
                </div>
              </div>

              {/* Advertencia de capacidad en el dialog */}
              {vehicleCapacityKg &&
                newCargo.weightInKg &&
                newCargo.weightInKg > 0 &&
                (() => {
                  // Calcular peso actual sin la carga que se está editando
                  const currentWeightWithoutEditing =
                    editingIndex !== null
                      ? totalWeight -
                        (fields[editingIndex]?.weightInKg ||
                          fields[editingIndex]?.weight ||
                          0)
                      : totalWeight;
                  const projectedWeight =
                    currentWeightWithoutEditing + newCargo.weightInKg;
                  const wouldExceed = projectedWeight > vehicleCapacityKg;
                  const projectedPercentage =
                    (projectedWeight / vehicleCapacityKg) * 100;

                  return wouldExceed ? (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-red-700">
                        <p className="font-medium">
                          ¡Esta carga excederá la capacidad del vehículo!
                        </p>
                        <p className="mt-1">
                          Peso proyectado: {formatWeight(projectedWeight)} /{" "}
                          {formatWeight(vehicleCapacityKg)}(
                          {projectedPercentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ) : projectedPercentage >= 90 ? (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <Gauge className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-orange-700">
                        <p className="font-medium">Capacidad casi al límite</p>
                        <p className="mt-1">
                          Peso proyectado: {formatWeight(projectedWeight)} /{" "}
                          {formatWeight(vehicleCapacityKg)}(
                          {projectedPercentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Volumen (m³)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
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
                  <Label>Dimensiones (cm)</Label>
                  <Input
                    placeholder="Largo/Alto/Ancho ej: 100/50/30"
                    value={newCargo.dimensions || ""}
                    onChange={(e) =>
                      setNewCargo({ ...newCargo, dimensions: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* ========== SECCIÓN: VALOR Y TARIFA ========== */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor y Tarifa
              </h4>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Valor Declarado</Label>
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

                <div className="space-y-2">
                  <Label>Tarifa del Servicio *</Label>
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
                  <Label>Moneda</Label>
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
            </div>

            {/* ========== SECCIÓN: MATERIAL PELIGROSO ========== */}
            <div className="space-y-4 border-t pt-4">
              <Collapsible
                open={hazmatSectionOpen}
                onOpenChange={setHazmatSectionOpen}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="hazmat-checkbox"
                      checked={newCargo.hazardousMaterial || false}
                      onCheckedChange={handleHazmatChange}
                    />
                    <Label
                      htmlFor="hazmat-checkbox"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Esta mercancía es material peligroso
                    </Label>
                  </div>
                  {newCargo.hazardousMaterial && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            hazmatSectionOpen && "rotate-180",
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>

                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50 space-y-4">
                    <p className="text-sm text-orange-800">
                      Complete la información de material peligroso según el
                      catálogo del SAT.
                    </p>

                    {/* Código de material peligroso */}
                    <div className="space-y-2">
                      <Label>Clave Material Peligroso *</Label>
                      <Select
                        value={newCargo.hazardousMaterialCode || ""}
                        onValueChange={(value) =>
                          setNewCargo({
                            ...newCargo,
                            hazardousMaterialCode: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar material peligroso" />
                        </SelectTrigger>
                        <SelectContent>
                          {HAZARDOUS_MATERIALS.map((mat) => (
                            <SelectItem key={mat.code} value={mat.code}>
                              <span className="font-mono text-xs bg-orange-100 px-1 rounded mr-2">
                                {mat.code}
                              </span>
                              {mat.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Tipo de embalaje */}
                    <div className="space-y-2">
                      <Label>Tipo de Embalaje *</Label>
                      <Select
                        value={newCargo.packagingType || ""}
                        onValueChange={(value) =>
                          setNewCargo({ ...newCargo, packagingType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo de embalaje" />
                        </SelectTrigger>
                        <SelectContent>
                          {PACKAGING_TYPES.map((pkg) => (
                            <SelectItem key={pkg.code} value={pkg.code}>
                              <span className="font-mono text-xs bg-muted px-1 rounded mr-2">
                                {pkg.code}
                              </span>
                              {pkg.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Descripción del embalaje */}
                    <div className="space-y-2">
                      <Label>Descripción del Embalaje</Label>
                      <Input
                        placeholder="Ej: Bidones de 20L, Tanque de 1000L..."
                        value={newCargo.packagingDescription || ""}
                        onChange={(e) =>
                          setNewCargo({
                            ...newCargo,
                            packagingDescription: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* ========== SECCIÓN: ENTREGAS (DELIVERY ASSIGNMENTS) ========== */}
            {availableDeliveryForDialog.length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Puntos de Entrega
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDeliveryAssignment}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar Entrega
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Opcional: asigne en qué paradas se entregará esta carga. Para
                  entregas parciales, especifique peso o unidades por punto.
                </p>

                {deliveryAssignments.length === 0 ? (
                  <div className="text-center py-3 border border-dashed rounded-lg text-xs text-muted-foreground">
                    Sin entregas asignadas. Puede asignarlas después.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deliveryAssignments.map((delivery, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 border rounded-lg bg-orange-50/30"
                      >
                        <div className="flex-1 space-y-2">
                          <Select
                            value={
                              delivery.stopIndex >= 0
                                ? String(delivery.stopIndex)
                                : ""
                            }
                            onValueChange={(val) =>
                              handleUpdateDeliveryAssignment(
                                idx,
                                "stopIndex",
                                Number(val),
                              )
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Seleccionar parada..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDeliveryForDialog.map((s) => (
                                <SelectItem
                                  key={s.index}
                                  value={String(s.index)}
                                >
                                  #{s.index + 1} {s.locationName || s.address} (
                                  {s.city})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Peso (kg)"
                              className="h-8 text-xs"
                              value={delivery.weight ?? ""}
                              onChange={(e) =>
                                handleUpdateDeliveryAssignment(
                                  idx,
                                  "weight",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : (undefined as any),
                                )
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Unidades"
                              className="h-8 text-xs"
                              value={delivery.units ?? ""}
                              onChange={(e) =>
                                handleUpdateDeliveryAssignment(
                                  idx,
                                  "units",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : (undefined as any),
                                )
                              }
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleRemoveDeliveryAssignment(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========== SECCIÓN: NOTAS ========== */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Notas Adicionales
              </h4>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones sobre la carga..."
                  value={newCargo.notes || ""}
                  onChange={(e) =>
                    setNewCargo({ ...newCargo, notes: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Instrucciones Especiales</Label>
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
              disabled={
                !newCargo.clientId ||
                !newCargo.satProductCode ||
                !newCargo.description ||
                !newCargo.satUnitCode ||
                !newCargo.units ||
                newCargo.units <= 0 ||
                !newCargo.weightInKg ||
                newCargo.weightInKg <= 0 ||
                !newCargo.movements ||
                newCargo.movements.length === 0 ||
                (newCargo.hazardousMaterial && !newCargo.hazardousMaterialCode)
              }
            >
              {editingIndex !== null ? "Guardar Cambios" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
