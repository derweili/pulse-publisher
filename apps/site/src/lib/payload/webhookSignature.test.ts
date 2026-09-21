import { describe, expect, it } from "vitest";
import { isValidWebhookSignature, SIGNATURE_HEADER } from "./webhookSignature";

const SECRET = "whsec_test_secret";

async function sign(body: string, secret: string, timestampSeconds: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestampSeconds}.${body}`));
  let binary = "";
  for (const byte of new Uint8Array(mac)) binary += String.fromCharCode(byte);
  const signature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `t=${timestampSeconds},v1=${signature}`;
}

describe("isValidWebhookSignature", () => {
  it("accepts a correctly signed, fresh payload", async () => {
    const body = JSON.stringify({ type: "article", slug: "some-story" });
    const header = await sign(body, SECRET, Math.floor(Date.now() / 1000));
    expect(await isValidWebhookSignature(body, header, SECRET)).toBe(true);
  });

  it("rejects a payload signed with the wrong secret", async () => {
    const body = JSON.stringify({ type: "article", slug: "some-story" });
    const header = await sign(body, "wrong-secret", Math.floor(Date.now() / 1000));
    expect(await isValidWebhookSignature(body, header, SECRET)).toBe(false);
  });

  it("rejects a tampered body", async () => {
    const body = JSON.stringify({ type: "article", slug: "some-story" });
    const header = await sign(body, SECRET, Math.floor(Date.now() / 1000));
    const tamperedBody = JSON.stringify({ type: "article", slug: "different-story" });
    expect(await isValidWebhookSignature(tamperedBody, header, SECRET)).toBe(false);
  });

  it("rejects a signature outside the timestamp tolerance", async () => {
    const body = JSON.stringify({ type: "article", slug: "some-story" });
    const staleTimestamp = Math.floor(Date.now() / 1000) - 3600;
    const header = await sign(body, SECRET, staleTimestamp);
    expect(await isValidWebhookSignature(body, header, SECRET)).toBe(false);
  });

  it("rejects a missing header", async () => {
    expect(await isValidWebhookSignature("{}", null, SECRET)).toBe(false);
  });

  it("rejects a malformed header", async () => {
    expect(await isValidWebhookSignature("{}", "not-a-valid-header", SECRET)).toBe(false);
  });

  it("exposes the expected header name", () => {
    expect(SIGNATURE_HEADER).toBe("webhook-signature");
  });
});
