import { apiClient, type ApiSingleResponse } from "@shared/api";
import type {
  ClientContact,
  CreateClientContactDTO,
  UpdateClientContactDTO,
  IClientContactRepository,
  ClientContactApiResponse,
} from "../domain";
import {
  mapClientContact,
  mapClientContactList,
  toApiCreateClientContact,
  toApiUpdateClientContact,
} from "./clientContactMappers";

function getBaseUrl(clientId: string): string {
  return `/clients/${clientId}/contacts`;
}

class ClientContactRepository implements IClientContactRepository {
  async findByClientId(clientId: string): Promise<ClientContact[]> {
    const response = await apiClient.get<
      ApiSingleResponse<ClientContactApiResponse[]>
    >(getBaseUrl(clientId));
    return mapClientContactList(response);
  }

  async findById(
    clientId: string,
    contactId: string,
  ): Promise<ClientContact | null> {
    try {
      const response = await apiClient.get<
        ApiSingleResponse<ClientContactApiResponse>
      >(`${getBaseUrl(clientId)}/${contactId}`);
      return mapClientContact(response);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "status" in error &&
        (error as { status: number }).status === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  async create(
    clientId: string,
    data: CreateClientContactDTO,
  ): Promise<ClientContact> {
    const response = await apiClient.post<
      ApiSingleResponse<ClientContactApiResponse>
    >(getBaseUrl(clientId), toApiCreateClientContact(data));
    return mapClientContact(response);
  }

  async update(
    clientId: string,
    contactId: string,
    data: UpdateClientContactDTO,
  ): Promise<ClientContact> {
    const response = await apiClient.put<
      ApiSingleResponse<ClientContactApiResponse>
    >(`${getBaseUrl(clientId)}/${contactId}`, toApiUpdateClientContact(data));
    return mapClientContact(response);
  }

  async setPrimary(clientId: string, contactId: string): Promise<void> {
    await apiClient.patch(`${getBaseUrl(clientId)}/${contactId}/primary`);
  }

  async delete(clientId: string, contactId: string): Promise<void> {
    await apiClient.delete(`${getBaseUrl(clientId)}/${contactId}`);
  }
}

export const clientContactRepository = new ClientContactRepository();
