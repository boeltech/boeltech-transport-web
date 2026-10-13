/**
 * Secciones del form de edición de vehículo (D7) + conteo de errores por rail.
 */

import type { FieldErrors } from "react-hook-form";
import type { LucideIcon } from "lucide-react";
import { FileText, Gauge, Settings, ShieldCheck, Truck } from "lucide-react";
import type { LongFormSectionItem } from "@shared/ui/form";
import type { CreateVehicleFormData } from "../validation";
import { vehiclesCopy } from "../copy";

const fc = vehiclesCopy.form;

export const VEHICLE_EDIT_SECTION_IDS = {
  identification: "vehicle-edit-identification",
  characteristics: "vehicle-edit-characteristics",
  capacities: "vehicle-edit-capacities",
  documentation: "vehicle-edit-documentation",
  cartaPorte: "vehicle-edit-carta-porte",
} as const;

export type VehicleEditSectionKey = keyof typeof VEHICLE_EDIT_SECTION_IDS;

export const VEHICLE_EDIT_SECTION_ORDER: VehicleEditSectionKey[] = [
  "identification",
  "characteristics",
  "capacities",
  "documentation",
  "cartaPorte",
];

const SECTION_ICONS: Record<VehicleEditSectionKey, LucideIcon> = {
  identification: Truck,
  characteristics: Settings,
  capacities: Gauge,
  documentation: ShieldCheck,
  cartaPorte: FileText,
};

export const VEHICLE_EDIT_SECTIONS: LongFormSectionItem[] =
  VEHICLE_EDIT_SECTION_ORDER.map((key) => ({
    id: VEHICLE_EDIT_SECTION_IDS[key],
    label: fc.section[key].nav,
    icon: SECTION_ICONS[key],
  }));

export const VEHICLE_EDIT_SECTION_FIELDS: Record<
  VehicleEditSectionKey,
  (keyof CreateVehicleFormData)[]
> = {
  identification: ["unitNumber", "licensePlate", "vin"],
  characteristics: [
    "brand",
    "model",
    "year",
    "type",
    "color",
    "branchId",
    "currentMileage",
  ],
  capacities: [
    "loadCapacity",
    "volumeCapacity",
    "fuelTankCapacity",
    "expectedFuelEfficiency",
  ],
  documentation: [
    "insuranceCompany",
    "insurancePolicy",
    "insuranceExpiry",
    "satTipoPermisoCode",
    "sctPermitNumber",
    "sctPermitExpiry",
  ],
  cartaPorte: [
    "satConfigAutotransporteCode",
    "pesoBrutoVehicular",
    "aseguraMedioAmbiente",
    "polizaMedioAmbiente",
    "aseguraCarga",
    "polizaCarga",
  ],
};

export function countVehicleEditSectionErrors(
  errors: FieldErrors<CreateVehicleFormData>,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of VEHICLE_EDIT_SECTION_ORDER) {
    const sectionId = VEHICLE_EDIT_SECTION_IDS[key];
    let n = 0;
    for (const field of VEHICLE_EDIT_SECTION_FIELDS[key]) {
      if (errors[field]) n += 1;
    }
    counts[sectionId] = n;
  }
  return counts;
}
