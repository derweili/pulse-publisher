import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearGuard, reconcile, readGuard, writeGuard } from "./auth-reconcile";

describe("reconcile", () => {
  it("unproxied + signed-in + not retried is a noop (the local-dev case)", () => {
    expect(reconcile({ serverState: "unproxied", clientSignedIn: true, alreadyRetried: false })).toBe("noop");
  });

  it("unproxied always noops regardless of client state or retry flag", () => {
    for (const clientSignedIn of [true, false]) {
      for (const alreadyRetried of [true, false]) {
        expect(reconcile({ serverState: "unproxied", clientSignedIn, alreadyRetried })).toBe("noop");
      }
    }
  });

  it("anonymous + signed out agree → rearm", () => {
    expect(reconcile({ serverState: "anonymous", clientSignedIn: false, alreadyRetried: false })).toBe("rearm");
    expect(reconcile({ serverState: "anonymous", clientSignedIn: false, alreadyRetried: true })).toBe("rearm");
  });

  it("signed-in + signed in agree → rearm", () => {
    expect(reconcile({ serverState: "signed-in", clientSignedIn: true, alreadyRetried: false })).toBe("rearm");
    expect(reconcile({ serverState: "signed-in", clientSignedIn: true, alreadyRetried: true })).toBe("rearm");
  });

  it("anonymous + signed in disagree, not retried → reload", () => {
    expect(reconcile({ serverState: "anonymous", clientSignedIn: true, alreadyRetried: false })).toBe("reload");
  });

  it("signed-in + signed out disagree, not retried → reload", () => {
    expect(reconcile({ serverState: "signed-in", clientSignedIn: false, alreadyRetried: false })).toBe("reload");
  });

  it("anonymous + signed in disagree, already retried → noop", () => {
    expect(reconcile({ serverState: "anonymous", clientSignedIn: true, alreadyRetried: true })).toBe("noop");
  });

  it("signed-in + signed out disagree, already retried → noop", () => {
    expect(reconcile({ serverState: "signed-in", clientSignedIn: false, alreadyRetried: true })).toBe("noop");
  });

  it("a persistent mismatch reloads exactly once, then stops", () => {
    let alreadyRetried = false;
    const input = { serverState: "anonymous" as const, clientSignedIn: true };

    const first = reconcile({ ...input, alreadyRetried });
    expect(first).toBe("reload");
    alreadyRetried = true; // simulates writeGuard() having succeeded

    const second = reconcile({ ...input, alreadyRetried });
    expect(second).toBe("noop");

    const third = reconcile({ ...input, alreadyRetried });
    expect(third).toBe("noop");
  });

  it("states agreeing after a prior mismatch re-arms the guard", () => {
    // Simulates: reload fired (alreadyRetried=true), client catches up, states now agree.
    expect(reconcile({ serverState: "signed-in", clientSignedIn: true, alreadyRetried: true })).toBe("rearm");
  });
});

describe("sessionStorage guards", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("readGuard returns false when nothing has been recorded", () => {
    expect(readGuard()).toBe(false);
  });

  it("writeGuard records the attempt and readGuard picks it up", () => {
    expect(writeGuard()).toBe(true);
    expect(readGuard()).toBe(true);
  });

  it("clearGuard removes a recorded attempt", () => {
    writeGuard();
    clearGuard();
    expect(readGuard()).toBe(false);
  });

  it("readGuard returns true when sessionStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(readGuard()).toBe(true);
  });

  it("writeGuard returns false when sessionStorage.setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(writeGuard()).toBe(false);
  });

  it("clearGuard does not throw when sessionStorage.removeItem throws", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(() => clearGuard()).not.toThrow();
  });
});
