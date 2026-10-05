import { describe, expect, it, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HelpPanelProvider,
  useHelpPanel,
} from "./HelpPanelController";

vi.mock("../../application", async () => {
  const actual = await vi.importActual<typeof import("../../application")>(
    "../../application",
  );
  return {
    ...actual,
    useHelpArticles: () => ({ data: [], isLoading: false }),
    useOpenTicketCount: () => ({ data: 0 }),
    useHelpArticle: () => ({ data: undefined, isLoading: false }),
  };
});

vi.mock("@/shared/hooks/useAuth", () => ({
  useAuth: () => ({ user: { email: "a@b.com", tenant: { name: "T" } } }),
}));

function Probe({ onReady }: { onReady: (api: ReturnType<typeof useHelpPanel>) => void }) {
  const api = useHelpPanel();
  onReady(api);
  return <button type="button" onClick={() => api.openHelpPanel()}>open</button>;
}

describe("HelpPanelProvider / openHelpPanel", () => {
  it("exposes openHelpPanel and opens the panel sheet", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let api: ReturnType<typeof useHelpPanel> | null = null;

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HelpPanelProvider>
            <Probe onReady={(value) => { api = value; }} />
          </HelpPanelProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(api).not.toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      api!.openHelpPanel({ articleId: "facturar-viaje", expand: true });
    });

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ayuda" }),
    ).toBeInTheDocument();
  });
});
