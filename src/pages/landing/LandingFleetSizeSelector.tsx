/**
 * Selector tipográfico de banda por # motrices (F2: idioma tabs evidencia).
 * Solo highlight UI — no muta precios SoT.
 */
import { cn } from "@shared/lib/utils/cn";
import { landingCopy } from "./landingCopy";

type LandingFleetSizeSelectorProps = {
  value: string;
  onChange: (optionId: string, planCode: string) => void;
};

export function LandingFleetSizeSelector({
  value,
  onChange,
}: LandingFleetSizeSelectorProps) {
  const { fleetSelector } = landingCopy.pricing;

  return (
    <div className="landing-fleet-selector">
      <p className="landing-fleet-selector-label" id="landing-fleet-label">
        {fleetSelector.label}
      </p>
      <p className="landing-fleet-selector-hint">{fleetSelector.hint}</p>
      <div
        className="landing-fleet-selector-options"
        role="radiogroup"
        aria-labelledby="landing-fleet-label"
      >
        {fleetSelector.options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              className={cn(
                "landing-fleet-selector-option",
                selected && "is-selected",
              )}
              onClick={() => onChange(option.id, option.planCode)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
