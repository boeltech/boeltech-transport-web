import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
} from "react-router-dom";
import { ScrollToTopOnNavigate } from "./ScrollToTopOnNavigate";

function renderWithScroll(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <ScrollToTopOnNavigate />
            <Link to="/welcome">Ir a welcome</Link>
            <Link to="/welcome#pricing">Ir a pricing</Link>
          </>
        ),
        children: [
          { path: "/login", element: <div>login</div> },
          { path: "/welcome", element: <div>welcome</div> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe("ScrollToTopOnNavigate", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("scrolls to top when navigating between paths without hash", async () => {
    const user = userEvent.setup();
    renderWithScroll("/login");

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    vi.mocked(window.scrollTo).mockClear();
    await user.click(screen.getByRole("link", { name: "Ir a welcome" }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });

  it("does not scroll when navigating to a hash anchor", async () => {
    const user = userEvent.setup();
    renderWithScroll("/login");
    vi.mocked(window.scrollTo).mockClear();

    await user.click(screen.getByRole("link", { name: "Ir a pricing" }));

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to top on initial mount without hash", () => {
    act(() => {
      renderWithScroll("/welcome");
    });
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });
});
