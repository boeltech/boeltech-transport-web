import type { Trip } from "@features/trips/domain";
import { utcIsoToLocalInput } from "@shared/utils/dateUtils";

import type { TripWizardFormValues } from "./components/validation";

export function mapTripToWizardFormValues(trip: Trip): TripWizardFormValues {
  const mappedStops = (trip.stops || []).map((stop) => ({
    id: stop.id,
    sequenceOrder: stop.sequenceOrder,
    stopType: (Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType]) as (
      | "origin"
      | "pickup"
      | "delivery"
      | "waypoint"
      | "destination"
    )[],
    clientId: stop.clientId ?? "",
    clientAddressId: stop.clientAddressId ?? stop.addressId ?? "",
    addressId: stop.addressId ?? "",
    locationName: stop.locationName || "",
    satCountryCode: stop.satCountryCode ?? "MEX",
    satStateCode: stop.satEstadoCode || "",
    satMunicipalityCode: stop.satMunicipioCode || "",
    postalCode: stop.postalCode || "",
    satLocalityCode: stop.satLocalidadCode || undefined,
    satNeighborhoodCode: stop.satColoniaCode || undefined,
    neighborhoodName: stop.colonia || undefined,
    cityName: stop.city || undefined,
    street: stop.street || undefined,
    exteriorNumber: stop.exteriorNumber || undefined,
    interiorNumber: stop.interiorNumber || undefined,
    reference: stop.reference || undefined,
    rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario || undefined,
    nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario || undefined,
    deliveryRfcRemitenteDestinatario: stop.deliveryRfcRemitenteDestinatario ?? "",
    deliveryNombreRemitenteDestinatario:
      stop.deliveryNombreRemitenteDestinatario ?? "",
    remitentePartnerId: stop.remitentePartnerId ?? "",
    destinatarioPartnerId: stop.destinatarioPartnerId ?? "",
    distanceFromPreviousKm: stop.distanceFromPreviousKm ?? undefined,
    distanceSource: stop.distanceSource ?? undefined,
    distanceProvider: stop.distanceProvider ?? undefined,
    distanceConfidence: stop.distanceConfidence ?? undefined,
    distanceComputedAt: stop.distanceComputedAt
      ? stop.distanceComputedAt.toISOString()
      : undefined,
    contactName: stop.contactName || undefined,
    contactPhone: stop.contactPhone || undefined,
    notes: stop.notes || undefined,
    latitude: stop.latitude || undefined,
    longitude: stop.longitude || undefined,
    estimatedArrival: stop.estimatedArrival
      ? utcIsoToLocalInput(stop.estimatedArrival.toISOString())
      : undefined,
  }));

  const mappedCargos = (trip.cargos || []).map((cargo) => ({
    id: cargo.id,
    clientId: cargo.clientId,
    description: cargo.description,
    weight: cargo.weight ?? undefined,
    units: cargo.units ?? undefined,
    weightInKg: cargo.weightInKg ?? undefined,
    declaredValue: cargo.declaredValue ?? undefined,
    isInsured:
      (cargo.declaredValue ?? 0) > 0 ||
      !!cargo.aseguraCarga ||
      !!cargo.polizaCarga,
    aseguraCarga: cargo.aseguraCarga ?? undefined,
    polizaCarga: cargo.polizaCarga ?? undefined,
    movements: (cargo.movements || []).map((m) => ({
      stopIndex: m.stopIndex,
      movementType: m.movementType,
      weight: m.weight ?? undefined,
      units: m.units ?? undefined,
      notes: m.notes ?? undefined,
    })),
    notes: cargo.notes ?? undefined,
    specialInstructions: cargo.specialInstructions ?? undefined,
    satProductCode: cargo.satProductCode ?? undefined,
    satProductDescription: cargo.satProductDescription ?? undefined,
    satUnitCode: cargo.satUnitCode ?? undefined,
    satUnitName: cargo.satUnitName ?? undefined,
    currency: cargo.currency ?? "MXN",
    hazardousMaterial: cargo.hazardousMaterial ?? false,
    requiresHazmat: cargo.hazardousMaterial ?? false,
    hazardousMaterialCode: cargo.hazardousMaterialCode ?? undefined,
    packagingType: cargo.packagingType ?? undefined,
    packagingDescription: cargo.packagingDescription ?? undefined,
    sectorRequirements: {},
    sectorCofepris: cargo.sectorCofepris ?? undefined,
    nombreIngredienteActivo: cargo.nombreIngredienteActivo ?? undefined,
    nomQuimico: cargo.nomQuimico ?? undefined,
    denominacionGenericaProd: cargo.denominacionGenericaProd ?? undefined,
    denominacionDistintivaProd: cargo.denominacionDistintivaProd ?? undefined,
    fabricante: cargo.fabricante ?? undefined,
    fechaCaducidad: cargo.fechaCaducidad ?? undefined,
    loteMedicamento: cargo.loteMedicamento ?? undefined,
    formaFarmaceutica: cargo.formaFarmaceutica ?? undefined,
    condicionesEspTransp: cargo.condicionesEspTransp ?? undefined,
    registroSanitarioFolioAutorizacion:
      cargo.registroSanitarioFolioAutorizacion ?? undefined,
    permisoImportacion: cargo.permisoImportacion ?? undefined,
    folioImpoVucem: cargo.folioImpoVucem ?? undefined,
    numCas: cargo.numCas ?? undefined,
    razonSocialEmpImp: cargo.razonSocialEmpImp ?? undefined,
    numRegSanPlagCofepris: cargo.numRegSanPlagCofepris ?? undefined,
    datosFabricante: cargo.datosFabricante ?? undefined,
    datosFormulador: cargo.datosFormulador ?? undefined,
    datosMaquilador: cargo.datosMaquilador ?? undefined,
    usoAutorizado: cargo.usoAutorizado ?? undefined,
  }));

  const mappedExpenses = (trip.expenses || []).map((expense) => ({
    id: expense.id,
    category: expense.category as TripWizardFormValues["expenses"][number]["category"],
    description: expense.description,
    amount: expense.amount,
    currency: "MXN" as const,
    expenseDate: expense.expenseDate
      ? utcIsoToLocalInput(expense.expenseDate.toISOString())
      : undefined,
    location: expense.location || undefined,
    vendorName: expense.vendorName || undefined,
    notes: expense.notes || undefined,
    isEstimated: true,
  }));

  const mappedInternalStaff = (trip.internalStaff || []).map((member) => ({
    employeeId: member.employeeId,
    internalRole: member.internalRole ?? "helper",
    isPaymentResponsible: member.isPaymentResponsible ?? false,
    paymentNotes: member.paymentNotes ?? undefined,
  }));

  return {
    vehicleId: trip.vehicleId,
    driverId: trip.driverId,
    clientId: trip.clientId || "",
    originBranchId: trip.originBranchId ?? "",
    cfdiDocumentIntent: trip.cfdiDocumentIntent ?? "ingreso",
    scheduledDeparture: utcIsoToLocalInput(trip.scheduledDeparture.toISOString()),
    scheduledArrival: trip.scheduledArrival
      ? utcIsoToLocalInput(trip.scheduledArrival.toISOString())
      : "",
    startMileage: trip.mileage.start ?? undefined,
    stops: mappedStops,
    cargos: mappedCargos,
    expenses: mappedExpenses,
    internalStaff: mappedInternalStaff,
    baseRate: trip.costs.baseRate ?? undefined,
    notes: trip.notes || "",
  } satisfies TripWizardFormValues;
}
