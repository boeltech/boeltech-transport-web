import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import {
  grantPermissions,
  resetPermissionsMock,
} from "@/test/mocks/permissions";
import { resetAuthMock, setMockAuthUser } from "@/test/mocks/auth";
import { ClientCollectableCard } from "./ClientCollectableCard";
import { clientDetailCopy } from "../copy/clientDetailCopy";
import type { Client, ClientByChannel, LastCollection } from "../../domain";

vi.mock("@features/auth", async () =>
  (await import("@/test/mocks/auth")).authModuleMock(),
);
vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

const useClientByChannelMock = vi.fn();
const useLastCollectionMock = vi.fn();

vi.mock("../../application", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../application")>();
  return {
    ...actual,
    useClientByChannel: (...args: unknown[]) => useClientByChannelMock(...args),
    useLastCollection: (...args: unknown[]) => useLastCollectionMock(...args),
  };
});

const copy = clientDetailCopy.collectable;

const CLIENT_UUID = "11111111-1111-4111-8111-111111111111";
const BATCH_UUID = "22222222-2222-4222-8222-222222222222";

function makeClient(overrides?: Partial<Client>): Client {
  return {
    id: CLIENT_UUID,
    tenantId: "t-1",
    clientCode: "C-001",
    type: "company",
    legalName: "Acme SA",
    taxId: "XAXX010101000",
    taxRegime: "601",
    cfdiReceptorProfile: "receptor_cfdi",
    paymentTerms: "credit",
    creditDays: 30,
    isActive: true,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

function makeByChannel(
  wi: Partial<ClientByChannel["withInvoice"]> = {},
  wo: Partial<ClientByChannel["withoutInvoice"]> = {},
): ClientByChannel {
  return {
    withInvoice: { balance: 0, count: 0, oldestAt: null, ...wi },
    withoutInvoice: { balance: 0, count: 0, oldestAt: null, ...wo },
  };
}

function byChannelResult(byChannel: ClientByChannel) {
  return {
    data: byChannel,
    isLoading: false,
    isError: false,
  };
}

function lastCollectionResult(lc: LastCollection | null) {
  return {
    data: lc,
    isLoading: false,
    isError: false,
  };
}

describe("ClientCollectableCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMock();
    resetPermissionsMock();
    setMockAuthUser({ role: "admin" });
    grantPermissions(["finance.read", "finance.create", "operational_cash.create"]);
    useClientByChannelMock.mockReturnValue(
      byChannelResult(
        makeByChannel(
          { balance: 24360, count: 2, oldestAt: "2026-10-28" },
          { balance: 22600, count: 4, oldestAt: "2026-10-30" },
        ),
      ),
    );
    useLastCollectionMock.mockReturnValue(
      lastCollectionResult({
        channel: "with_invoice",
        ref: { channel: "with_invoice", paymentId: "pay-1" },
        amount: 8000,
        at: "2026-11-12",
        label: "Transferencia",
      }),
    );
  });

  it("shows title «Por cobrar», total, and both channel rows", () => {
    renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
    );

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$46,960\.00/)).toBeInTheDocument();
    expect(screen.getByText(copy.channelWithInvoice + " ↗")).toBeInTheDocument();
    expect(screen.getByText(copy.channelWithoutInvoice + " ↗")).toBeInTheDocument();
  });

  it("shows «Registrar cobro» CTA when there is balance", () => {
    renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
    );

    const cta = screen.getByRole("link", { name: copy.registerCtaAria });
    expect(cta).toBeInTheDocument();
    expect(cta.getAttribute("href")).toContain("/finance/collections/new");
  });

  it("shows «Último cobro · Ver» when last-collection exists", () => {
    renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
    );

    expect(screen.getByText(copy.lastCollectionSee)).toBeInTheDocument();
    expect(screen.getByText(/\$8,000\.00/)).toBeInTheDocument();
  });

  it("«Ver» href uses client UUID (never /clients/undefined)", () => {
    useLastCollectionMock.mockReturnValue(
      lastCollectionResult({
        channel: "without_invoice",
        ref: {
          channel: "without_invoice",
          kind: "batch",
          batchId: BATCH_UUID,
        },
        amount: 22600,
        at: "2026-11-12",
        label: "Efectivo",
      }),
    );

    renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
      {
        route: `/clients/${CLIENT_UUID}`,
        path: "/clients/:id",
      },
    );

    const ver = screen.getByRole("link", { name: copy.lastCollectionSeeAria });
    const href = ver.getAttribute("href") ?? "";
    expect(href).toContain(`/clients/${CLIENT_UUID}?batch=${BATCH_UUID}`);
    expect(href).not.toContain("/clients/undefined");
  });

  it("falls back to route param id when client.id is missing", () => {
    useLastCollectionMock.mockReturnValue(
      lastCollectionResult({
        channel: "without_invoice",
        ref: {
          channel: "without_invoice",
          kind: "batch",
          batchId: BATCH_UUID,
        },
        amount: 1000,
        at: "2026-11-12",
        label: "Efectivo",
      }),
    );

    renderWithProviders(
      <ClientCollectableCard
        client={makeClient({ id: undefined as unknown as string })}
      />,
      {
        route: `/clients/${CLIENT_UUID}`,
        path: "/clients/:id",
      },
    );

    const ver = screen.getByRole("link", { name: copy.lastCollectionSeeAria });
    expect(ver.getAttribute("href")).toContain(
      `/clients/${CLIENT_UUID}?batch=${BATCH_UUID}`,
    );
  });

  it("hides «Ver» link when client id cannot be resolved", () => {
    useLastCollectionMock.mockReturnValue(
      lastCollectionResult({
        channel: "without_invoice",
        ref: {
          channel: "without_invoice",
          kind: "batch",
          batchId: BATCH_UUID,
        },
        amount: 1000,
        at: "2026-11-12",
        label: "Efectivo",
      }),
    );

    renderWithProviders(
      <ClientCollectableCard
        client={makeClient({ id: undefined as unknown as string })}
      />,
    );

    expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: copy.lastCollectionSeeAria }),
    ).not.toBeInTheDocument();
  });

  it("shows «Qué cobras» when both channels have balance", () => {
    renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
    );

    expect(screen.getByText(copy.whatDoYouCollect)).toBeInTheDocument();
  });

  it("preselects oldest channel (without_invoice older)", () => {
    useClientByChannelMock.mockReturnValue(
      byChannelResult(
        makeByChannel(
          { balance: 10000, count: 1, oldestAt: "2026-11-01" },
          { balance: 5000, count: 2, oldestAt: "2026-10-15" },
        ),
      ),
    );

    renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
    );

    const registerLink = screen.getByRole("link", { name: copy.registerCtaAria });
    expect(registerLink.getAttribute("href")).toContain("channel=without_invoice");
  });

  it("preselects with_invoice on tie (same oldest_at)", () => {
    useClientByChannelMock.mockReturnValue(
      byChannelResult(
        makeByChannel(
          { balance: 10000, count: 1, oldestAt: "2026-10-15" },
          { balance: 5000, count: 2, oldestAt: "2026-10-15" },
        ),
      ),
    );

    renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
    );

    const registerLink = screen.getByRole("link", { name: copy.registerCtaAria });
    expect(registerLink.getAttribute("href")).toContain("channel=with_invoice");
  });

  it("hides for cash + receptor_cfdi + zero balance (Q11)", () => {
    useClientByChannelMock.mockReturnValue(
      byChannelResult(makeByChannel()),
    );

    const { container } = renderWithProviders(
      <ClientCollectableCard
        client={makeClient({ paymentTerms: "cash" })}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows for credit client even with zero balance (Q11)", () => {
    useClientByChannelMock.mockReturnValue(
      byChannelResult(makeByChannel()),
    );
    useLastCollectionMock.mockReturnValue(lastCollectionResult(null));

    renderWithProviders(
      <ClientCollectableCard
        client={makeClient({ paymentTerms: "credit" })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: copy.registerCtaAria }),
    ).not.toBeInTheDocument();
  });

  it("shows for comercial_only client even with zero balance (Q11)", () => {
    useClientByChannelMock.mockReturnValue(
      byChannelResult(makeByChannel()),
    );
    useLastCollectionMock.mockReturnValue(lastCollectionResult(null));

    renderWithProviders(
      <ClientCollectableCard
        client={makeClient({
          paymentTerms: "cash",
          cfdiReceptorProfile: "comercial_only",
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
  });

  it("does not mount when user lacks permissions", () => {
    grantPermissions("none");

    const { container } = renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("hides «Qué cobras» when only one channel has balance", () => {
    useClientByChannelMock.mockReturnValue(
      byChannelResult(
        makeByChannel({ balance: 24360, count: 2, oldestAt: "2026-10-28" }),
      ),
    );

    renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
    );

    expect(screen.queryByText(copy.whatDoYouCollect)).not.toBeInTheDocument();
  });

  it("hides last-collection line when no data", () => {
    useLastCollectionMock.mockReturnValue(lastCollectionResult(null));

    renderWithProviders(
      <ClientCollectableCard client={makeClient()} />,
    );

    expect(screen.queryByText(copy.lastCollectionSee)).not.toBeInTheDocument();
  });
});
