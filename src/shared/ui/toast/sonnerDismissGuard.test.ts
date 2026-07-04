import { describe, expect, it, vi } from "vitest";
import {
  isSonnerToastTarget,
  preventDismissOnSonnerToast,
} from "./sonnerDismissGuard";

describe("sonnerDismissGuard", () => {
  it("detecta clics dentro del portal Sonner", () => {
    const toaster = document.createElement("section");
    toaster.setAttribute("data-sonner-toaster", "");
    const toast = document.createElement("li");
    toast.setAttribute("data-sonner-toast", "");
    toaster.appendChild(toast);
    document.body.appendChild(toaster);

    expect(isSonnerToastTarget(toast)).toBe(true);
    expect(isSonnerToastTarget(toaster)).toBe(true);
    expect(isSonnerToastTarget(document.body)).toBe(false);

    document.body.removeChild(toaster);
  });

  it("preventDismissOnSonnerToast llama preventDefault en toast", () => {
    const toast = document.createElement("li");
    toast.setAttribute("data-sonner-toast", "");
    document.body.appendChild(toast);

    const event = new Event("pointerdown", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: toast });
    const preventDefault = vi.spyOn(event, "preventDefault");

    preventDismissOnSonnerToast(event);

    expect(preventDefault).toHaveBeenCalled();

    document.body.removeChild(toast);
  });

  it("no previene dismiss fuera de Sonner", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);

    const event = new Event("pointerdown", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: button });
    const preventDefault = vi.spyOn(event, "preventDefault");

    preventDismissOnSonnerToast(event);

    expect(preventDefault).not.toHaveBeenCalled();

    document.body.removeChild(button);
  });
});
