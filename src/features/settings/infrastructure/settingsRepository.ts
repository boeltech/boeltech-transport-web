/**
 * Settings Repository Implementation
 * Clean Architecture - Infrastructure Layer
 *
 * Implementa la interfaz ISettingsRepository usando HTTP/REST.
 *
 * Ubicación: src/features/settings/infrastructure/settingsRepository.ts
 */

import { apiClient } from "@shared/api";
import type {
  CompanySettings,
  BillingSettings,
  NotificationSettings,
  ISettingsRepository,
  UpdateCompanySettingsDTO,
  UpdateBillingSettingsDTO,
  UploadCertificateDTO,
  UpdateNotificationSettingsDTO,
  SettingsResult,
  UploadLogoResult,
  TestPacConnectionPayload,
  TestPacConnectionResult,
} from "../domain";
import {
  mapCompanySettings,
  mapEmbeddedCompanyAddress,
  mapBillingSettings,
  mapNotificationSettings,
  toApiUpdateCompanySettings,
  toApiUpdateBillingSettings,
  toApiUpdateNotificationSettings,
  toApiTestPacConnection,
  mapTestPacConnection,
  type ApiCompanySettingsResponse,
  type ApiBillingSettingsResponse,
  type ApiNotificationSettingsResponse,
  type ApiTestPacConnectionResponse,
} from "./mappers";
import {
  fetchTenantAddresses,
  pickTenantFiscalAddress,
} from "./tenantFiscalAddressApi";

// ============================================================================
// CONSTANTS
// ============================================================================

const SETTINGS_ENDPOINT = "/settings";

// ============================================================================
// SETTINGS REPOSITORY IMPLEMENTATION
// ============================================================================

export class SettingsRepository implements ISettingsRepository {
  // ─────────────────────────────────────────────────────────────────────────
  // Company Settings
  // ─────────────────────────────────────────────────────────────────────────

  async getCompanySettings(): Promise<CompanySettings> {
    const response = await apiClient.get<{ data: ApiCompanySettingsResponse }>(
      `${SETTINGS_ENDPOINT}/company`,
    );
    const api = response.data;

    let fiscal = mapEmbeddedCompanyAddress(api);
    if (!fiscal) {
      try {
        const list = await fetchTenantAddresses(api.tenant_id);
        fiscal = pickTenantFiscalAddress(list);
      } catch {
        fiscal = null;
      }
    }

    return mapCompanySettings(api, fiscal);
  }

  async updateCompanySettings(
    data: UpdateCompanySettingsDTO,
  ): Promise<SettingsResult<CompanySettings>> {
    const apiData = toApiUpdateCompanySettings(data);
    const putResponse = await apiClient.put<{
      data: ApiCompanySettingsResponse;
      message?: string;
    }>(`${SETTINGS_ENDPOINT}/company`, apiData);

    const fresh = await this.getCompanySettings();
    return {
      data: fresh,
      message: putResponse.message,
    };
  }

  async uploadLogo(file: File): Promise<UploadLogoResult> {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await apiClient.post<{
      data: { logo_url: string };
      message?: string;
    }>(`${SETTINGS_ENDPOINT}/company/logo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      logoUrl: response.data.logo_url,
      message: response.message,
    };
  }

  async deleteLogo(): Promise<void> {
    await apiClient.delete(`${SETTINGS_ENDPOINT}/company/logo`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Billing Settings
  // ─────────────────────────────────────────────────────────────────────────

  async getBillingSettings(): Promise<BillingSettings> {
    const response = await apiClient.get<{ data: ApiBillingSettingsResponse }>(
      `${SETTINGS_ENDPOINT}/billing`,
    );
    return mapBillingSettings(response.data);
  }

  async updateBillingSettings(
    data: UpdateBillingSettingsDTO,
  ): Promise<SettingsResult<BillingSettings>> {
    const apiData = toApiUpdateBillingSettings(data);
    const response = await apiClient.put<{
      data: ApiBillingSettingsResponse;
      message?: string;
    }>(`${SETTINGS_ENDPOINT}/billing`, apiData);

    return {
      data: mapBillingSettings(response.data),
      message: response.message,
    };
  }

  async uploadCertificate(
    data: UploadCertificateDTO,
  ): Promise<SettingsResult<BillingSettings>> {
    const formData = new FormData();
    formData.append("certificate", data.certificate);
    formData.append("private_key", data.privateKey);
    formData.append("password", data.password);

    const response = await apiClient.post<{
      data: ApiBillingSettingsResponse;
      message?: string;
    }>(`${SETTINGS_ENDPOINT}/billing/certificate`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      data: mapBillingSettings(response.data),
      message: response.message,
    };
  }

  async testPacConnection(
    payload?: TestPacConnectionPayload,
  ): Promise<TestPacConnectionResult> {
    const body = payload ? toApiTestPacConnection(payload) : {};
    const response = await apiClient.post<{
      data: ApiTestPacConnectionResponse;
    }>(`${SETTINGS_ENDPOINT}/billing/test-connection`, body);

    return mapTestPacConnection(response.data);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Notification Settings
  // ─────────────────────────────────────────────────────────────────────────

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get<{
      data: ApiNotificationSettingsResponse;
    }>(`${SETTINGS_ENDPOINT}/notifications`);
    return mapNotificationSettings(response.data);
  }

  async updateNotificationSettings(
    data: UpdateNotificationSettingsDTO,
  ): Promise<SettingsResult<NotificationSettings>> {
    const apiData = toApiUpdateNotificationSettings(data);
    const response = await apiClient.put<{
      data: ApiNotificationSettingsResponse;
      message?: string;
    }>(`${SETTINGS_ENDPOINT}/notifications`, apiData);

    return {
      data: mapNotificationSettings(response.data),
      message: response.message,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const settingsRepository = new SettingsRepository();
