/**
 * Smoke — Platform SAT catalog import (ADR-0062 addendum / SDD platform-sat-catalog-import F3–F4).
 * Hub → wizard: descarga plantilla + validate con estimatedDeactivateCount; support RO.
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { CatalogType, CatalogTypeWithVersion } from "@features/catalogs/domain";
import type { PlatformUserJSON } from "@features/platform/domain/entities";
import { PlatformGlobalCatalogsPage } from "@features/platform/presentation/pages/PlatformGlobalCatalogsPage";
import { PlatformAuthProvider } from "@features/platform/presentation/providers/PlatformAuthProvider";
import {
  markPlatformFreshLoginSession,
  platformTokenStorage,
} from "@features/platform/infrastructure/platformTokenStorage";
import { platformCopy } from "@features/platform/presentation/copy/platformCopy";

const mockFindTypes = vi.fn();
const mockFindTypeByCode = vi.fn();
const mockGetStatistics = vi.fn();
const mockDownloadTemplate = vi.fn();
const mockValidateImport = vi.fn();
const mockImportCatalog = vi.fn();

vi.mock("@features/catalogs/infrastructure/catalogRepository", () => ({
  catalogRepository: {
    findTypes: (...args: unknown[]) => mockFindTypes(...args),
    findTypeByCode: (...args: unknown[]) => mockFindTypeByCode(...args),
    getStatistics: (...args: unknown[]) => mockGetStatistics(...args),
    downloadTemplate: (...args: unknown[]) => mockDownloadTemplate(...args),
    validateImport: (...args: unknown[]) => mockValidateImport(...args),
    importCatalog: (...args: unknown[]) => mockImportCatalog(...args),
  },
}));

vi.mock("@features/platform/infrastructure/platformApi", () => ({
  platformApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    getProfile: vi.fn(async () => ({
      id: "user-platform-catalogs-smoke",
      email: "platform@boeltech.com",
      firstName: "Platform",
      lastName: "Owner",
      platformRole: "platform_owner",
      scope: "platform",
      mfaEnabled: true,
      mfaEnabledAt: "2026-01-01T00:00:00.000Z",
    })),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const NOW = new Date("2026-08-08T12:00:00.000Z");

const SAT_ESTADO: CatalogType = {
  id: "type-sat-estado",
  code: "sat_estado",
  name: "Estados",
  description: "Catálogo SAT de estados",
  source: "SAT",
  parentTypeCode: null,
  isHierarchical: false,
  isGlobal: true,
  metadataSchema: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const SAT_ESTADO_WITH_VERSION: CatalogTypeWithVersion = {
  ...SAT_ESTADO,
  currentVersion: {
    id: "ver-1",
    catalogTypeId: SAT_ESTADO.id,
    version: "1.0.20260801",
    publishedAt: "2026-08-01T00:00:00.000Z",
    sourceUrl: null,
    notes: null,
    isCurrent: true,
    itemsCount: 32,
    createdAt: NOW,
  },
  itemsCount: 32,
};

const PLATFORM_OWNER: PlatformUserJSON = {
  id: "user-platform-catalogs-smoke",
  email: "platform@boeltech.com",
  firstName: "Platform",
  lastName: "Owner",
  platformRole: "platform_owner",
  scope: "platform",
  mfaEnabled: true,
  mfaEnabledAt: "2026-01-01T00:00:00.000Z",
};

const PLATFORM_SUPPORT: PlatformUserJSON = {
  ...PLATFORM_OWNER,
  id: "user-platform-support-smoke",
  email: "support@boeltech.com",
  firstName: "Platform",
  lastName: "Support",
  platformRole: "platform_support",
};

function seedPlatformSession(user: PlatformUserJSON) {
  localStorage.clear();
  sessionStorage.clear();
  platformTokenStorage.setToken("smoke-platform-token");
  platformTokenStorage.setRefreshToken("smoke-platform-refresh");
  platformTokenStorage.setUser(user);
  markPlatformFreshLoginSession();
}

function seedCatalogMocks() {
  mockFindTypes.mockResolvedValue([SAT_ESTADO]);
  mockFindTypeByCode.mockResolvedValue(SAT_ESTADO_WITH_VERSION);
  mockGetStatistics.mockResolvedValue([
    {
      typeCode: "sat_estado",
      typeName: "Estados",
      itemCount: 32,
      currentVersion: "1.0.20260801",
      source: "SAT",
    },
  ]);
  mockDownloadTemplate.mockResolvedValue(undefined);
  mockValidateImport.mockResolvedValue({
    isValid: true,
    totalRows: 2,
    validRows: 2,
    errors: [],
    preview: [
      { code: "01", name: "Aguascalientes", description: null, parentCode: null },
      { code: "02", name: "Baja California", description: null, parentCode: null },
    ],
    estimatedDeactivateCount: 3,
    detectedProfile: "sat_estado",
    detectedDelimiter: ",",
  });
  mockImportCatalog.mockResolvedValue({
    success: true,
    typeCode: "sat_estado",
    version: "1.0.20260808",
    totalRows: 2,
    insertedCount: 0,
    updatedCount: 2,
    skippedCount: 0,
    errorCount: 0,
    deactivatedCount: 3,
    errors: [],
    duration: 120,
  });
}

function renderHub(ui: ReactNode = <PlatformGlobalCatalogsPage />) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/platform/catalogs"]}>
        <PlatformAuthProvider>{ui}</PlatformAuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke platform catalogs import (SAT release kit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedCatalogMocks();
  });

  it("owner: abre wizard, descarga plantilla con authScope platform y ve estimate tras validar", async () => {
    seedPlatformSession(PLATFORM_OWNER);
    const user = userEvent.setup();
    renderHub();

    expect(
      await screen.findByText(platformCopy.catalogs.title),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFindTypes).toHaveBeenCalled();
    });
    expect(mockFindTypes.mock.calls[0]?.[0]).toEqual({
      authScope: "platform",
    });

    expect(
      (await screen.findAllByText(SAT_ESTADO.name)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(platformCopy.catalogs.groups.geography.title),
    ).toBeInTheDocument();

    const updateButtons = await screen.findAllByRole("button", {
      name: platformCopy.catalogs.import,
    });
    expect(updateButtons.length).toBeGreaterThan(0);
    await user.click(updateButtons[0]!);

    expect(
      await screen.findByRole("button", { name: /Descargar plantilla/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Descargar plantilla/i }),
    );

    await waitFor(() => {
      expect(mockDownloadTemplate).toHaveBeenCalledWith("sat_estado", {
        authScope: "platform",
      });
    });

    const file = new File(
      ["c_Estado,Nombre del estado\n01,Aguascalientes\n"],
      "estados.csv",
      { type: "text/csv" },
    );
    const fileInput = document.getElementById(
      "csv-upload",
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /Validar archivo/i }));

    await waitFor(() => {
      expect(mockValidateImport).toHaveBeenCalled();
    });
    expect(mockValidateImport.mock.calls[0]?.[2]).toEqual({
      authScope: "platform",
    });

    expect(
      await screen.findByText("Desactivación estimada"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Se desactivarían/, { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return (
          element?.tagName === "STRONG" && content.trim() === "3"
        );
      }),
    ).toBeInTheDocument();
  });

  it("support: lista catálogos en solo lectura sin botón Actualizar", async () => {
    seedPlatformSession(PLATFORM_SUPPORT);
    renderHub();

    expect(
      await screen.findByText(platformCopy.catalogs.title),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFindTypes).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(platformCopy.catalogs.readOnlyTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(platformCopy.catalogs.readOnlyHint),
    ).toBeInTheDocument();

    expect(
      (await screen.findAllByText(SAT_ESTADO.name)).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: platformCopy.catalogs.import }),
    ).toBeNull();
  });
});
