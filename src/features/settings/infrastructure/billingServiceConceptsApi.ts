import { apiClient, mapSingleResponse, type ApiSingleResponse } from "@shared/api";
import type {
  BillingServiceConcept,
  CreateBillingServiceConceptPayload,
  UpdateBillingServiceConceptPayload,
} from "../domain/billingServiceConcept.types";

const BASE = "/settings/billing/service-concepts";

interface ApiBillingServiceConceptCamel {
  id: string;
  name: string;
  description: string | null;
  claveProdServ: string;
  claveUnidad: string;
  unidad: string;
  defaultUnitPrice: number | null;
  objectImp: string;
  ivaAplica: boolean;
  retencionAplica: boolean;
  isActive: boolean;
  sortOrder: number;
}

function mapConcept(raw: ApiBillingServiceConceptCamel): BillingServiceConcept {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    claveProdServ: raw.claveProdServ,
    claveUnidad: raw.claveUnidad,
    unidad: raw.unidad,
    defaultUnitPrice: raw.defaultUnitPrice,
    objectImp: (raw.objectImp ?? "02") as BillingServiceConcept["objectImp"],
    ivaAplica: raw.ivaAplica,
    retencionAplica: raw.retencionAplica,
    isActive: raw.isActive,
    sortOrder: raw.sortOrder,
  };
}

function toApiPayload(
  payload: CreateBillingServiceConceptPayload | UpdateBillingServiceConceptPayload,
) {
  return {
    name: payload.name,
    description: payload.description,
    clave_prod_serv: payload.claveProdServ,
    clave_unidad: payload.claveUnidad,
    unidad: payload.unidad,
    default_unit_price: payload.defaultUnitPrice,
    object_imp: payload.objectImp,
    iva_aplica: payload.ivaAplica,
    retencion_aplica: payload.retencionAplica,
    sort_order: payload.sortOrder,
    is_active: "isActive" in payload ? payload.isActive : undefined,
  };
}

export async function fetchBillingServiceConcepts(params?: {
  search?: string;
  isActive?: boolean;
}): Promise<BillingServiceConcept[]> {
  const response = await apiClient.get<
    ApiSingleResponse<ApiBillingServiceConceptCamel[]>
  >(BASE, {
    params: {
      search: params?.search,
      is_active: params?.isActive,
    },
  });
  const { data } = mapSingleResponse(response);
  return data.map(mapConcept);
}

export async function createBillingServiceConcept(
  payload: CreateBillingServiceConceptPayload,
): Promise<BillingServiceConcept> {
  const response = await apiClient.post<
    ApiSingleResponse<ApiBillingServiceConceptCamel>
  >(BASE, toApiPayload(payload));
  return mapConcept(mapSingleResponse(response).data);
}

export async function updateBillingServiceConcept(
  id: string,
  payload: UpdateBillingServiceConceptPayload,
): Promise<BillingServiceConcept> {
  const response = await apiClient.put<
    ApiSingleResponse<ApiBillingServiceConceptCamel>
  >(`${BASE}/${id}`, toApiPayload(payload));
  return mapConcept(mapSingleResponse(response).data);
}

export async function deleteBillingServiceConcept(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}
