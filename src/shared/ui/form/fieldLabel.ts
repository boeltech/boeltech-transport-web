import { Children, isValidElement, type ReactElement, type ReactNode } from "react";

const TRAILING_ASTERISK_RE = /\s*\*+\s*$/;

/** Quita marcas `*` finales de labels en string (legacy). */
export function stripTrailingAsteriskFromLabel(label: string): string {
  return label.replace(TRAILING_ASTERISK_RE, "").trim();
}

/** Detecta si un nodo React ya incluye asterisco de obligatorio. */
export function reactNodeHasRequiredMark(node: ReactNode): boolean {
  if (node == null || typeof node === "boolean") return false;
  if (typeof node === "string") return /\*/.test(node);
  if (typeof node === "number") return false;
  if (Array.isArray(node)) return node.some(reactNodeHasRequiredMark);

  if (!isValidElement(node)) return false;

  const el = node as ReactElement<{ children?: ReactNode }>;
  if (
    el.type === "span" &&
    typeof el.props.children === "string" &&
    el.props.children.includes("*")
  ) {
    return true;
  }

  const { children } = el.props;
  if (children == null) return false;
  return Children.toArray(children).some(reactNodeHasRequiredMark);
}

/**
 * Unifica label + obligatorio: quita `*` del texto y evita duplicar el asterisco rojo del shell.
 */
export function normalizeRequiredFieldLabel(
  label: ReactNode,
  requiredProp?: boolean,
): { displayLabel: ReactNode; required: boolean; showRequiredMark: boolean } {
  if (typeof label === "string") {
    const required = requiredProp ?? TRAILING_ASTERISK_RE.test(label);
    const displayLabel = stripTrailingAsteriskFromLabel(label);
    return { displayLabel, required, showRequiredMark: required };
  }

  const required = requiredProp ?? false;
  const embeddedMark = reactNodeHasRequiredMark(label);
  return {
    displayLabel: label,
    required: required || embeddedMark,
    showRequiredMark: required && !embeddedMark,
  };
}
