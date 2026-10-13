import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  useNavigate,
} from "react-router-dom";
import { useState } from "react";
import {
  UNSAVED_CHANGES_COPY,
  useUnsavedChangesGuard,
} from "./useUnsavedChangesGuard";
import { UnsavedChangesDialog } from "@shared/ui/form/UnsavedChangesDialog";

function DirtyProbe({ initiallyDirty = false }: { initiallyDirty?: boolean }) {
  const [isDirty, setIsDirty] = useState(initiallyDirty);
  const navigate = useNavigate();
  const { blocker, allowLeave } = useUnsavedChangesGuard({ isDirty });

  return (
    <div>
      <button type="button" onClick={() => setIsDirty(true)}>
        mark-dirty
      </button>
      <button type="button" onClick={() => setIsDirty(false)}>
        mark-clean
      </button>
      <button type="button" onClick={() => allowLeave()}>
        allow-leave
      </button>
      <button type="button" onClick={() => navigate("/away")}>
        leave
      </button>
      <Link to="/away">link-away</Link>
      <UnsavedChangesDialog blocker={blocker} />
      <span data-testid="dirty">{isDirty ? "yes" : "no"}</span>
    </div>
  );
}

function renderProbe(initiallyDirty = false) {
  const router = createMemoryRouter(
    [
      { path: "/", element: <DirtyProbe initiallyDirty={initiallyDirty} /> },
      { path: "/away", element: <div>away-page</div> },
    ],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("useUnsavedChangesGuard", () => {
  beforeEach(() => {
    vi.spyOn(window, "addEventListener");
    vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not block when clean", async () => {
    const user = userEvent.setup();
    renderProbe(false);

    await user.click(screen.getByRole("button", { name: "leave" }));
    expect(await screen.findByText("away-page")).toBeInTheDocument();
    expect(
      screen.queryByRole("alertdialog", { name: UNSAVED_CHANGES_COPY.title }),
    ).not.toBeInTheDocument();
  });

  it("blocks navigation when dirty and confirms leave", async () => {
    const user = userEvent.setup();
    renderProbe(true);

    await user.click(screen.getByRole("button", { name: "leave" }));
    expect(
      await screen.findByRole("alertdialog", {
        name: UNSAVED_CHANGES_COPY.title,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: UNSAVED_CHANGES_COPY.confirmLabel }),
    );
    expect(await screen.findByText("away-page")).toBeInTheDocument();
  });

  it("keeps editing when dismiss is chosen", async () => {
    const user = userEvent.setup();
    renderProbe(true);

    await user.click(screen.getByRole("link", { name: "link-away" }));
    expect(
      await screen.findByRole("alertdialog", {
        name: UNSAVED_CHANGES_COPY.title,
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: UNSAVED_CHANGES_COPY.keepEditingLabel,
      }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(screen.queryByText("away-page")).not.toBeInTheDocument();
    expect(screen.getByTestId("dirty")).toHaveTextContent("yes");
  });

  it("allowLeave bypasses the dialog", async () => {
    const user = userEvent.setup();
    renderProbe(true);

    await user.click(screen.getByRole("button", { name: "allow-leave" }));
    await user.click(screen.getByRole("button", { name: "leave" }));
    expect(await screen.findByText("away-page")).toBeInTheDocument();
  });

  it("registers beforeunload while dirty", () => {
    renderProbe(true);
    expect(window.addEventListener).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function),
    );
  });
});
