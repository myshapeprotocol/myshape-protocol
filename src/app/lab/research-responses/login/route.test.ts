/**
 * Operator login and logout routes.
 *
 * The login route exchanges the secret for a signed session cookie. These
 * tests assert the security properties that matter: the secret is never
 * echoed, never placed in a URL, and never becomes the cookie value; a
 * failure is indistinguishable from any other failure; and logout clears the
 * cookie so the old token stops authorizing.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { POST as loginPost } from "./route";
import { POST as logoutPost } from "../logout/route";
import { verifyOperatorSessionToken, OPERATOR_SESSION_SECONDS } from "@/lib/operator-session";

const SECRET = "test-operator-secret";

function makeRequest(fields: Record<string, string> | null): Request {
  if (fields === null) {
    return new Request("https://example.test/lab/research-responses/login", { method: "POST" });
  }
  const encoded = new URLSearchParams(fields);
  return new Request("https://example.test/lab/research-responses/login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": `10.2.0.${Math.floor(Math.random() * 250) + 1}` },
    body: encoded.toString(),
  });
}

/** Read a Set-Cookie header into its attribute map. */
function cookieAttr(res: Response, name: string): string | null {
  const all = res.headers.getSetCookie?.() ?? [];
  const hit = all.find((c) => c.startsWith(`${name}=`));
  return hit ?? null;
}

beforeEach(() => {
  process.env.OPERATOR_SECRET = SECRET;
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.test";
});

afterEach(() => {
  delete process.env.OPERATOR_SECRET;
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe("login", () => {
  it("issues a signed session cookie for the correct secret", async () => {
    const res = await loginPost(makeRequest({ secret: SECRET }));

    expect(res.status).toBe(303);
    const setCookie = cookieAttr(res, "op_session");
    expect(setCookie).not.toBeNull();

    const value = decodeURIComponent(setCookie!.split(";")[0].split("=")[1]);
    expect(verifyOperatorSessionToken(value, SECRET)).toBe(true);
  });

  it("never returns the secret in the cookie or the redirect", async () => {
    const res = await loginPost(makeRequest({ secret: SECRET }));

    const all = res.headers.getSetCookie?.() ?? [];
    for (const c of all) {
      expect(c).not.toContain(SECRET);
    }
    expect(res.headers.get("location")).not.toContain(SECRET);
  });

  it("sets HttpOnly, SameSite=Strict, path and maxAge", async () => {
    const res = await loginPost(makeRequest({ secret: SECRET }));
    const setCookie = cookieAttr(res, "op_session")!;

    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Strict/i);
    // Next.js serialises cookie attributes in Title-Case (Path, Max-Age).
    expect(setCookie).toMatch(/Path=\/lab\/research-responses/i);
    expect(setCookie).toMatch(new RegExp(`Max-Age=${OPERATOR_SESSION_SECONDS}`, "i"));
  });

  it("rejects a wrong secret without setting a cookie", async () => {
    const res = await loginPost(makeRequest({ secret: "wrong" }));

    expect(res.status).toBe(303);
    expect(res.headers.getSetCookie?.() ?? []).toHaveLength(0);
  });

  it("rejects a missing secret", async () => {
    const res = await loginPost(makeRequest({}));
    expect(res.status).toBe(303);
    expect(res.headers.getSetCookie?.() ?? []).toHaveLength(0);
  });

  it("fails closed when OPERATOR_SECRET is not configured", async () => {
    delete process.env.OPERATOR_SECRET;
    const res = await loginPost(makeRequest({ secret: SECRET }));

    expect(res.status).toBe(303);
    expect(res.headers.getSetCookie?.() ?? []).toHaveLength(0);
  });

  it("does not distinguish a wrong secret from an unset variable", async () => {
    const wrong = await loginPost(makeRequest({ secret: "wrong" }));
    delete process.env.OPERATOR_SECRET;
    const unset = await loginPost(makeRequest({ secret: SECRET }));

    expect(wrong.status).toBe(unset.status);
    expect(wrong.headers.get("location")).toBe(unset.headers.get("location"));
  });
});

describe("logout", () => {
  it("clears the session cookie with maxAge=0", async () => {
    const res = await logoutPost();
    const setCookie = cookieAttr(res, "op_session");

    expect(setCookie).not.toBeNull();
    expect(setCookie).toMatch(/Max-Age=0/i);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Path=\/lab\/research-responses/i);
  });

  it("issues a cookie value that no longer verifies", async () => {
    const res = await logoutPost();
    const setCookie = cookieAttr(res, "op_session")!;
    const value = decodeURIComponent(setCookie.split(";")[0].split("=")[1]);

    expect(verifyOperatorSessionToken(value || null, SECRET)).toBe(false);
  });

  it("only exports POST, so a GET cannot sign the operator out", async () => {
    const mod = await import("./route");
    const logoutMod = await import("../logout/route");
    expect((mod as Record<string, unknown>).GET).toBeUndefined();
    expect((logoutMod as Record<string, unknown>).GET).toBeUndefined();
  });
});
