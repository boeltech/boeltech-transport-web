/** Umbral de caracteres: mensajes más largos van inline en el overlay. */
export const OVERLAY_ERROR_INLINE_THRESHOLD = 160;

export function buildOverlayErrorToastDescription(
  message: string,
  seeInlineCopy: string,
): string {
  return message.length > OVERLAY_ERROR_INLINE_THRESHOLD
    ? seeInlineCopy
    : message;
}
