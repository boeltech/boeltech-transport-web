import { compensationApi, type ListCorridorsParams } from "../../infrastructure/compensationApi";
import type { RouteCorridorTariff } from "../../domain/entities";

export const CORRIDOR_FETCH_PAGE_SIZE = 100;

export async function fetchAllCorridorTariffs(
  params: Omit<ListCorridorsParams, "page" | "pageSize"> = {},
): Promise<RouteCorridorTariff[]> {
  const items: RouteCorridorTariff[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await compensationApi.listCorridors({
      ...params,
      page,
      pageSize: CORRIDOR_FETCH_PAGE_SIZE,
    });
    items.push(...result.data);
    totalPages = result.pagination.totalPages;
    page += 1;
  }

  return items;
}
