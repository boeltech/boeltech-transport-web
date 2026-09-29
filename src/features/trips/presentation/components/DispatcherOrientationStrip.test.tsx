import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripsListCopy } from "../copy/listCopy";
import {
  DISPATCHER_ORIENTATION_STRIP_STORAGE_KEY,
  DispatcherOrientationStrip,
} from "./DispatcherOrientationStrip";

const copy = tripsListCopy.orientation;
const TEST_KEY = `${DISPATCHER_ORIENTATION_STRIP_STORAGE_KEY}.test`;

describe("DispatcherOrientationStrip", () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  it("muestra los 4 pasos y persiste collapsed=true al cerrar", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <DispatcherOrientationStrip storageKey={TEST_KEY} />,
    );

    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(copy.steps).toHaveLength(4);
    for (const step of copy.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: copy.dismiss }));
    expect(window.localStorage.getItem(TEST_KEY)).toBe("true");
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();

    unmount();
    render(<DispatcherOrientationStrip storageKey={TEST_KEY} />);
    expect(screen.queryByText(copy.title)).not.toBeInTheDocument();
  });
});
