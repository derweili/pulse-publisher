import type { Clerk } from "@clerk/shared/types";

// Mirrors the mOS console's `data-mos-action` component-behaviour values (see
// docs/mos-selectors.md) — nothing type-checks that link, so if either side
// changes, change the other. Whitelist only: injected creative must never be
// able to reach a Clerk method that isn't listed here.
const ACTIONS = {
  "sign-in": (clerk: Clerk) => clerk.openSignIn({}),
  "sign-up": (clerk: Clerk) => clerk.openSignUp({}),
  "sign-out": (clerk: Clerk) => void clerk.signOut(),
} as const satisfies Record<string, (clerk: Clerk) => void>;

export type MosAction = keyof typeof ACTIONS;

/**
 * Pure decision function: given the clicked element and whether Clerk has
 * loaded, returns the action to dispatch, or `null` to leave the link's
 * `href` alone (unknown action, or Clerk not ready yet) — the same markup
 * either way, no separate no-JS configuration path.
 */
export function resolveAction(element: Element, clerkLoaded: boolean): MosAction | null {
  const target = element.closest("[data-mos-action]");
  if (!target) return null;

  const action = target.getAttribute("data-mos-action");
  if (!action || !(action in ACTIONS)) return null;

  if (!clerkLoaded) return null;

  return action as MosAction;
}

export function dispatchMosAction(action: MosAction, clerk: Clerk): void {
  ACTIONS[action](clerk);
}
