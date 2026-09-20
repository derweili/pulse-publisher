import { describe, expect, it } from "vitest";
import { isValidRevalidateAuth } from "./revalidateAuth";

describe("isValidRevalidateAuth", () => {
  it("accepts a matching bearer header", () => {
    expect(isValidRevalidateAuth("Bearer topsecret", "topsecret")).toBe(true);
  });

  it("rejects a mismatched secret", () => {
    expect(isValidRevalidateAuth("Bearer wrong", "topsecret")).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(isValidRevalidateAuth(null, "topsecret")).toBe(false);
  });

  it("rejects when no secret is configured", () => {
    expect(isValidRevalidateAuth("Bearer topsecret", "")).toBe(false);
  });

  it("rejects a header missing the Bearer prefix", () => {
    expect(isValidRevalidateAuth("topsecret", "topsecret")).toBe(false);
  });
});
