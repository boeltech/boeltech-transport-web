import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ArticleFeedback } from "./ArticleFeedback";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const trackHelpEvent = vi.hoisted(() => vi.fn());

vi.mock("../../application/trackHelpEvent", () => ({
  trackHelpEvent,
}));

const copy = helpCenterCopy.feedback;
const ARTICLE_ID = "facturar-viaje";

function renderFeedback(
  props: Partial<{
    hasProblem: boolean;
    onRequestTicket: () => void;
    onShowProblem: () => void;
  }> = {},
) {
  const onRequestTicket = props.onRequestTicket ?? vi.fn();
  const onShowProblem = props.onShowProblem ?? vi.fn();
  render(
    <MemoryRouter>
      <ArticleFeedback
        articleId={ARTICLE_ID}
        hasProblem={props.hasProblem ?? true}
        onRequestTicket={onRequestTicket}
        onShowProblem={onShowProblem}
      />
    </MemoryRouter>,
  );
  return { onRequestTicket, onShowProblem };
}

describe("ArticleFeedback", () => {
  beforeEach(() => {
    sessionStorage.clear();
    trackHelpEvent.mockClear();
  });

  it("asks the question with Sí / No", () => {
    renderFeedback();
    expect(screen.getByText(copy.question)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.yes })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.no })).toBeInTheDocument();
  });

  it("Sí shows Gracias, emits feedback, and does not ask again in the session", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <MemoryRouter>
        <ArticleFeedback
          articleId={ARTICLE_ID}
          onRequestTicket={vi.fn()}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: copy.yes }));

    expect(screen.getByRole("status")).toHaveTextContent(copy.thanks);
    expect(trackHelpEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "help_article_feedback",
        articleId: ARTICLE_ID,
        payload: { helpful: true },
      }),
    );
    expect(sessionStorage.getItem(`help.feedback.${ARTICLE_ID}`)).toBe("1");

    unmount();
    trackHelpEvent.mockClear();

    render(
      <MemoryRouter>
        <ArticleFeedback
          articleId={ARTICLE_ID}
          onRequestTicket={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toHaveTextContent(copy.thanks);
    expect(
      screen.queryByRole("button", { name: copy.yes }),
    ).not.toBeInTheDocument();
    expect(trackHelpEvent).not.toHaveBeenCalled();
  });

  it("No offers ticket CTA, shows problem link, and emits feedback", async () => {
    const user = userEvent.setup();
    const { onRequestTicket, onShowProblem } = renderFeedback();

    await user.click(screen.getByRole("button", { name: copy.no }));

    expect(trackHelpEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: "help_article_feedback",
        payload: { helpful: false },
      }),
    );
    expect(onShowProblem).toHaveBeenCalled();

    const ticketBtn = screen.getByRole("button", {
      name: copy.sendTicketAboutThis,
    });
    await user.click(ticketBtn);
    expect(onRequestTicket).toHaveBeenCalled();

    expect(
      screen.getByRole("button", { name: copy.problemLink }),
    ).toBeInTheDocument();
  });
});
