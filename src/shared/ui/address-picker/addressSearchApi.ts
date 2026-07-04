import {
  apiClient,
  mapCursorPaginatedResponse,
  type ApiCursorPaginatedResponse,
} from "@shared/api";
import { mapAddressSearchPage, type AddressSearchListItemRaw } from "./addressSearchMappers";
import type { AddressSearchPage, AddressSearchParams } from "./types";

const SEARCH_PATH = "/addresses/search";

function buildSearchQuery(params: AddressSearchParams): string {
  const q = new URLSearchParams();
  if (params.q?.trim()) {
    q.set("q", params.q.trim());
  }
  if (params.ownerTypes?.length) {
    q.set("owner_types", params.ownerTypes.join(","));
  }
  if (params.addressType) {
    q.set("address_type", params.addressType);
  }
  if (params.onlyGeolocated === true) {
    q.set("only_geolocated", "true");
  }
  if (params.limit != null) {
    q.set("limit", String(params.limit));
  }
  if (params.cursor) {
    q.set("cursor", params.cursor);
  }
  const query = q.toString();
  return query ? `${SEARCH_PATH}?${query}` : SEARCH_PATH;
}

export async function searchAddresses(
  params: AddressSearchParams,
): Promise<AddressSearchPage> {
  const url = buildSearchQuery(params);
  const raw = await apiClient.get<
    ApiCursorPaginatedResponse<AddressSearchListItemRaw>
  >(url);
  const mapped = mapCursorPaginatedResponse(raw);
  return mapAddressSearchPage(mapped.data, mapped.pagination);
}
