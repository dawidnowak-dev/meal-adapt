// Smoke test: proves the built app, the Cloudflare adapter, the Supabase auth flow and the exclusions API (two accounts) still work together, plus the protected exclusions page.
// Zero dependencies on purpose. Run against a live server: BASE_URL=http://localhost:4321 node scripts/smoke.mjs

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4321";
const runId = Date.now();
const email = `smoke-${runId}@example.com`;
const emailB = `smoke-${runId}-b@example.com`;
const password = "Smoke-Test-Passw0rd!";

// Separate cookie jars: account A, account B, a fresh session of A ("another device") and an anonymous client.
const jar = new Map();
const jarB = new Map();
const jarA2 = new Map();
const anonymousJar = new Map();

function cookieHeader(cookies) {
  return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(cookies, response) {
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";");
    const [name, ...rest] = pair.split("=");
    const expired = attrs.some((a) => /max-age=0/i.test(a.trim()));
    if (expired) cookies.delete(name.trim());
    else cookies.set(name.trim(), rest.join("="));
  }
}

async function request(path, { method = "GET", form, json, rawBody, contentType, cookies = jar } = {}) {
  let body;
  let type;
  if (form) [body, type] = [new URLSearchParams(form).toString(), "application/x-www-form-urlencoded"];
  else if (json !== undefined) [body, type] = [JSON.stringify(json), "application/json"];
  else if (rawBody !== undefined) [body, type] = [rawBody, contentType];
  const response = await fetch(BASE_URL + path, {
    method,
    redirect: "manual",
    headers: {
      Cookie: cookieHeader(cookies),
      Origin: BASE_URL,
      ...(type ? { "Content-Type": type } : {}),
    },
    body,
  });
  storeCookies(cookies, response);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }
  return { status: response.status, location: response.headers.get("location") ?? "", data };
}

const productIds = (actual) => (actual.data?.exclusions ?? []).map((e) => e.productId);
const sameList = (actual, expected) => JSON.stringify(productIds(actual)) === JSON.stringify(expected);
const errorCode = (actual) => actual.data?.error?.code;
const exclusionId = (actual) => actual.data?.exclusion?.productId;

const steps = [
  ["home renders", () => request("/"), { status: 200 }],
  ["dashboard redirects anonymous user", () => request("/dashboard"), { status: 302, location: "/auth/signin" }],
  [
    "signup creates account",
    () => request("/api/auth/signup", { method: "POST", form: { email, password } }),
    { status: 302, location: "/auth/confirm-email" },
  ],
  [
    "signin rejects wrong password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password: "wrong" } }),
    { status: 302, location: "/auth/signin?error=" },
  ],
  [
    "signin accepts correct password",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/" },
  ],
  ["dashboard renders for signed-in user", () => request("/dashboard"), { status: 200 }],
  ["signout clears session", () => request("/api/auth/signout", { method: "POST" }), { status: 302, location: "/" }],
  ["dashboard redirects after signout", () => request("/dashboard"), { status: 302, location: "/auth/signin" }],

  // Exclusions API: isolation between accounts, idempotency and reading from another device.
  [
    "anonymous exclusions list is rejected",
    () => request("/api/exclusions", { cookies: anonymousJar }),
    { status: 401, check: (a) => errorCode(a) === "unauthorized" },
  ],
  [
    "account A signs in again",
    () => request("/api/auth/signin", { method: "POST", form: { email, password } }),
    { status: 302, location: "/" },
  ],
  [
    "account B signs up (session starts immediately)",
    () => request("/api/auth/signup", { method: "POST", form: { email: emailB, password }, cookies: jarB }),
    { status: 302, location: "/auth/confirm-email" },
  ],
  [
    "exclusions page redirects anonymous user",
    () => request("/exclusions", { cookies: anonymousJar }),
    { status: 302, location: "/auth/signin" },
  ],
  ["exclusions page renders for signed-in A", () => request("/exclusions"), { status: 200 }],
  [
    "A adds cow-milk",
    () => request("/api/exclusions", { method: "POST", json: { productId: "cow-milk" } }),
    { status: 201, check: (a) => exclusionId(a) === "cow-milk" && a.data.exclusion.supported === true },
  ],
  [
    "A adds cow-milk again (idempotent)",
    () => request("/api/exclusions", { method: "POST", json: { productId: "cow-milk" } }),
    { status: 200, check: (a) => exclusionId(a) === "cow-milk" },
  ],
  [
    "A cannot add non-selectable oat",
    () => request("/api/exclusions", { method: "POST", json: { productId: "oat" } }),
    { status: 400, check: (a) => errorCode(a) === "unsupported-product" },
  ],
  [
    "A cannot add unknown name mleko",
    () => request("/api/exclusions", { method: "POST", json: { productId: "mleko" } }),
    { status: 400, check: (a) => errorCode(a) === "unsupported-product" },
  ],
  [
    // Non-form, non-JSON type with a same-origin Origin header passes Astro's checkOrigin and reaches the handler.
    "A non-JSON body is rejected",
    () =>
      request("/api/exclusions", {
        method: "POST",
        rawBody: "<productId>cow-milk</productId>",
        contentType: "application/xml",
      }),
    { status: 415, check: (a) => errorCode(a) === "unsupported-media-type" },
  ],
  [
    "A sees exactly [cow-milk]",
    () => request("/api/exclusions"),
    { status: 200, check: (a) => sameList(a, ["cow-milk"]) },
  ],
  [
    "new session of A signs in",
    () => request("/api/auth/signin", { method: "POST", form: { email, password }, cookies: jarA2 }),
    { status: 302, location: "/" },
  ],
  [
    "new session of A sees [cow-milk]",
    () => request("/api/exclusions", { cookies: jarA2 }),
    { status: 200, check: (a) => sameList(a, ["cow-milk"]) },
  ],
  [
    "B sees an empty list",
    () => request("/api/exclusions", { cookies: jarB }),
    { status: 200, check: (a) => sameList(a, []) },
  ],
  [
    "B deleting cow-milk returns 204",
    () => request("/api/exclusions/cow-milk", { method: "DELETE", cookies: jarB }),
    { status: 204 },
  ],
  [
    "A still sees [cow-milk] after B's delete",
    () => request("/api/exclusions"),
    { status: 200, check: (a) => sameList(a, ["cow-milk"]) },
  ],
  ["A deletes cow-milk", () => request("/api/exclusions/cow-milk", { method: "DELETE" }), { status: 204 }],
  ["A sees an empty list", () => request("/api/exclusions"), { status: 200, check: (a) => sameList(a, []) }],
  [
    "A deletes cow-milk again (idempotent)",
    () => request("/api/exclusions/cow-milk", { method: "DELETE" }),
    { status: 204 },
  ],
];

let failed = 0;
for (const [name, run, expected] of steps) {
  const actual = await run();
  const ok =
    actual.status === expected.status &&
    (expected.location === undefined || actual.location.startsWith(expected.location)) &&
    (expected.check === undefined || expected.check(actual));
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  -> ${actual.status} ${actual.location}`);
  if (!ok) {
    failed++;
    console.log(`      expected ${expected.status} ${expected.location ?? ""}`);
  }
}

console.log(failed ? `\n${failed} step(s) failed` : "\nAll smoke steps passed");
process.exit(failed ? 1 : 0);
