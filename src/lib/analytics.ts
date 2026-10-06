// Analytics event names prepared for future integration (no provider wired yet).
export type FinancingEvent =
  | "financing_landing_view"
  | "financing_calculator_start"
  | "financing_calculator_complete"
  | "financing_budget_selected"
  | "financing_vehicle_view"
  | "financing_vehicle_click"
  | "financing_dealer_contact_click"
  | "financing_faq_open";

export function track(event: FinancingEvent, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  (w.dataLayer ??= []).push({ event, ...payload });
}
