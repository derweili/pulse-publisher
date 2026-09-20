// Verifies the cache-purge webhook apps/cms sends on every content change
// (see apps/cms/src/hooks/revalidate.ts and docs/cache-revalidation.md).
// Same scheme the old Sanity webhook used:
//
//   webhook-signature: t=<unix seconds>,v1=<base64url HMAC-SHA256, no padding>
//
// signing `<timestamp>.<raw request body>` with the shared secret. Built on
// Web Crypto (`crypto.subtle`) so this endpoint has no Node-only dependency
// and runs the same way in `astro dev`, `wrangler dev`, and the deployed
// Worker; apps/cms signs with `node:crypto`'s `createHmac`, which produces
// byte-identical output for the same inputs.

const SIGNATURE_HEADER = "webhook-signature";
const TOLERANCE_SECONDS = 300;

function base64UrlEncode(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function parseSignatureHeader(header: string): { timestamp: string; signature: string } | null {
  const parts = new Map(
    header
      .split(",")
      .map((part) => part.trim().split("="))
      .filter((pair): pair is [string, string] => pair.length === 2)
      .map(([key, value]) => [key, value] as [string, string])
  );
  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return null;
  return { timestamp, signature };
}

/**
 * `body` must be the exact raw request text the signature was computed
 * over — re-serializing a parsed-and-reparsed JSON object will not match.
 */
export async function isValidWebhookSignature(
  body: string,
  signatureHeaderValue: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeaderValue || !secret) return false;

  const parsed = parseSignatureHeader(signatureHeaderValue);
  if (!parsed) return false;

  const timestampSeconds = Number(parsed.timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const skewSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (skewSeconds > TOLERANCE_SECONDS) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parsed.timestamp}.${body}`));
  const expectedSignature = base64UrlEncode(mac);

  return timingSafeEqual(expectedSignature, parsed.signature);
}

export { SIGNATURE_HEADER };
