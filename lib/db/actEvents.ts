// lib/actEvents.ts
export const ACTS_UPDATED_EVENT = "soundwalk:acts-updated";

export function notifyActsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACTS_UPDATED_EVENT));
}
