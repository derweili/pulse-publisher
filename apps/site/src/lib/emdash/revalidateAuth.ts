// Replaces webhookSignature.ts's Sanity-specific HMAC verification.
//
// EmDash has no built-in "signed outbound webhook" feature (see
// docs/emdash-migration-plan.md) — packages/emdash-revalidate-plugin, a
// native EmDash plugin running inside apps/cms, POSTs here directly after a
// content lifecycle event. Both sides are infrastructure this repo owns
// (apps/cms and apps/site), so a shared-secret bearer check is sufficient:
// there's no third-party signing scheme to interoperate with, unlike the old
// Sanity webhook.

const AUTH_HEADER = "authorization";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function isValidRevalidateAuth(authHeaderValue: string | null, secret: string): boolean {
  if (!secret || !authHeaderValue) return false;
  const expected = `Bearer ${secret}`;
  return timingSafeEqual(authHeaderValue, expected);
}

export { AUTH_HEADER };
