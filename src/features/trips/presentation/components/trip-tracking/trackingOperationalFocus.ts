/** Pedido de foco hacia una parada del hub operativo (guide → master-detail). */
export type TrackingOperationalFocusRequest = {
  stopId: string;
  nonce: number;
};
