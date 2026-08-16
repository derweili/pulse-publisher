import { describe, expect, it } from "vitest";
import { resolveAction } from "./mos-actions";

function link(action: string | null, { nested = false }: { nested?: boolean } = {}): { target: Element; anchor: Element } {
  const a = document.createElement("a");
  a.setAttribute("href", "/sign-in");
  if (action !== null) a.setAttribute("data-mos-action", action);

  let target: Element = a;
  if (nested) {
    const span = document.createElement("span");
    a.appendChild(span);
    target = span;
  }

  document.body.appendChild(a);
  return { target, anchor: a };
}

describe("resolveAction", () => {
  it("known action + Clerk loaded → dispatches", () => {
    const { target } = link("sign-in");
    expect(resolveAction(target, true)).toBe("sign-in");
  });

  it("known action + Clerk not loaded → no dispatch", () => {
    const { target } = link("sign-up");
    expect(resolveAction(target, false)).toBeNull();
  });

  it("unknown action value → no dispatch", () => {
    const { target } = link("delete-everything");
    expect(resolveAction(target, true)).toBeNull();
  });

  it("click on a nested child element inside the link → still matches", () => {
    const { target } = link("sign-out", { nested: true });
    expect(resolveAction(target, true)).toBe("sign-out");
  });

  it("click anywhere else on the page → no-op", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    expect(resolveAction(div, true)).toBeNull();
  });
});
