import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  userQueryKeys,
  type UserManagementActivityFilters,
} from "../../domain";
import { usersApi } from "../../infrastructure";
import { useUsers } from "./useUsers";

interface UseUserManagementActivityParams {
  readonly page: number;
  readonly limit: number;
  readonly filters: UserManagementActivityFilters;
}

/**
 * Historial global de gestión de usuarios (`GET /users/activity`).
 * `keepPreviousData` evita que la lista se vacíe al paginar o cambiar filtros.
 */
export const useUserManagementActivity = ({
  page,
  limit,
  filters,
}: UseUserManagementActivityParams) =>
  useQuery({
    queryKey: userQueryKeys.managementActivity(page, limit, filters),
    queryFn: () => usersApi.getManagementActivity({ page, limit, filters }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

/**
 * Tamaño del directorio que se trae para resolver nombres y poblar los filtros
 * de persona. Un tenant con más usuarios verá los no resueltos como cuenta
 * eliminada; el API no expone el nombre del sujeto en el evento.
 */
const USER_DIRECTORY_LIMIT = 100;

export interface UserDirectoryEntry {
  readonly id: string;
  readonly label: string;
}

export interface UserDirectory {
  readonly entries: readonly UserDirectoryEntry[];
  readonly namesById: ReadonlyMap<string, string>;
  readonly isLoading: boolean;
}

/** Directorio de usuarios del tenant para mostrar nombres en vez de identificadores. */
export const useUserDirectory = (options?: { enabled?: boolean }): UserDirectory => {
  const { data, isLoading } = useUsers(
    {
      page: 1,
      limit: USER_DIRECTORY_LIMIT,
      sort: { field: "first_name", direction: "asc" },
    },
    { enabled: options?.enabled ?? true },
  );

  const entries = useMemo<UserDirectoryEntry[]>(
    () =>
      (data?.data ?? []).map((user) => ({
        id: user.id,
        label: `${user.firstName} ${user.lastName}`.trim() || user.email,
      })),
    [data],
  );

  const namesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry.label])),
    [entries],
  );

  return { entries, namesById, isLoading };
};
