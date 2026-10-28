import { useState } from "react";
import { opsCopy } from "../opsCopy";
import { OpsButton } from "../ui/OpsButton";
import { OpsSectionRule } from "./OpsSectionRule";

export interface OpsSecretListProps {
  codes: readonly string[];
  hint?: string;
  /** Marca de ejemplo para el showcase. La página de seguridad no la enciende. */
  example?: boolean;
}

export function OpsSecretList({
  codes,
  hint,
  example = false,
}: OpsSecretListProps) {
  const copy = opsCopy.secrets;
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      data-testid="ops-secret-list"
      data-ops-example={example ? "true" : undefined}
    >
      <OpsSectionRule label={copy.rule} />
      {example ? (
        <p className="mt-1 text-[11px] ops-text-muted">{copy.example}</p>
      ) : null}
      {hint ? <p className="mt-1 text-[11px] ops-text-muted">{hint}</p> : null}
      <ul className="ops-secret-list">
        {codes.map((code) => (
          <li key={code} className="ops-secret-code">
            {code}
          </li>
        ))}
      </ul>
      <OpsButton variant="ghost" size="sm" onClick={() => onCopy()}>
        {copied ? copy.copied : copy.copy}
      </OpsButton>
    </div>
  );
}
