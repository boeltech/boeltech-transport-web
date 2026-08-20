import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary, RouteErrorBoundary } from "./ErrorBoundary";
import { CHUNK_RELOAD_KEY } from "@shared/lib/lazyWithRetry";

vi.mock("@shared/observability/sentry", () => ({
  captureWebException: vi.fn(),
}));

const CHUNK_ERROR = new TypeError(
  "Failed to fetch dynamically imported module: http://localhost:5173/src/features/drivers/index.ts",
);

function renderRouteError(error: Error) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <div>ok</div>,
        errorElement: <RouteErrorBoundary />,
        loader() {
          throw error;
        },
      },
    ],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("RouteErrorBoundary", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the chunk-load fallback instead of the generic crash page", async () => {
    renderRouteError(CHUNK_ERROR);

    expect(
      await screen.findByText("Hay una nueva versión disponible"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recargar ahora" })).toBeInTheDocument();
    expect(screen.queryByText("Algo salió mal")).not.toBeInTheDocument();
  });

  it("shows the generic fallback for unexpected errors", async () => {
    renderRouteError(new TypeError("Cannot read properties of null"));

    expect(await screen.findByText("Algo salió mal")).toBeInTheDocument();
    expect(
      screen.queryByText("Hay una nueva versión disponible"),
    ).not.toBeInTheDocument();
  });
});

describe("ErrorBoundary (class)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders ChunkLoadFallback when a child throws a dynamic import error", () => {
    function Boom(): null {
      throw CHUNK_ERROR;
    }

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText("Hay una nueva versión disponible"),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem(CHUNK_RELOAD_KEY)).not.toBeNull();
  });
});
