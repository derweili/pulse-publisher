// Mirrors the mOS console's `[data-mos="auth-state"]` component-behaviour
// values (see docs/mos-selectors.md) — nothing type-checks that link, so if
// either side changes, change the other.
export type ServerAuthState = "unproxied" | "anonymous" | "signed-in";

export type ReconcileAction = "reload" | "rearm" | "noop";

/**
 * Decides what a client should do after comparing the mOS-resolved auth
 * state (baked into the origin HTML by a component behaviour) against
 * Clerk's own client-side auth state.
 *
 * `serverState === "unproxied"` means no mOS behaviour touched the marker —
 * local dev, a direct origin request, or a misconfigured/missing behaviour —
 * and must always be a `noop`, checked before anything else, so a missing
 * proxy is never mistaken for a resolved-anonymous reader.
 */
export function reconcile(input: {
  serverState: ServerAuthState;
  clientSignedIn: boolean;
  alreadyRetried: boolean;
}): ReconcileAction {
  const { serverState, clientSignedIn, alreadyRetried } = input;

  if (serverState === "unproxied") {
    return "noop";
  }

  const serverSignedIn = serverState === "signed-in";
  if (serverSignedIn === clientSignedIn) {
    return "rearm";
  }

  if (alreadyRetried) {
    return "noop";
  }

  return "reload";
}

const KEY = "mos-auth-resync";

/**
 * Fails closed: if we can't read whether a reload was already attempted, we
 * must assume one was, so a broken sessionStorage can't cause a reload loop.
 */
export function readGuard(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

/**
 * Fails closed: if we can't record that a reload is about to happen, we must
 * not reload — an unrecordable reload is an infinite loop, a missed one just
 * costs a stale page view.
 */
export function writeGuard(): boolean {
  try {
    sessionStorage.setItem(KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function clearGuard(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to do — there was never a guard to clear, or storage is unusable either way.
  }
}
