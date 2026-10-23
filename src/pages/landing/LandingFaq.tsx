/**
 * FAQ accesible (accordion) — F3. Solo hechos SoT/copy.
 */
import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { landingCopy } from "./landingCopy";

export function LandingFaq() {
  const { faq } = landingCopy;
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id={faq.id}
      className="landing-band landing-band-muted landing-faq scroll-mt-20 py-16 md:py-20"
    >
      <div className="landing-shell">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="landing-section-title">{faq.title}</h2>
        </div>

        <div className="landing-faq-list mx-auto mt-10 max-w-2xl">
          {faq.items.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-btn-${index}`;

            return (
              <div
                key={item.question}
                className={cn("landing-faq-item", isOpen && "is-open")}
              >
                <h3 className="landing-faq-question">
                  <button
                    type="button"
                    id={buttonId}
                    className="landing-faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() =>
                      setOpenIndex((prev) => (prev === index ? null : index))
                    }
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className="landing-faq-chevron"
                      aria-hidden
                      strokeWidth={2}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="landing-faq-panel"
                >
                  <p>{item.answer}</p>
                  {"linkHref" in item && item.linkHref && item.linkLabel ? (
                    <p className="landing-faq-link-wrap">
                      <a href={item.linkHref} className="landing-faq-link">
                        {item.linkLabel}
                      </a>
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
