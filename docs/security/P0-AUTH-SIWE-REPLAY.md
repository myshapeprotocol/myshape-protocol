# P0-AUTH — SIWE Replay Protection

**Batch:** P0-AUTH (strictly isolated security fix batch)
**Date:** 2026-09-08
**Baseline commit:** `4cd117cfa221dbdad8855bd6030a704e6302810a`
**Predecessor report:** `P0-VERIFY-REPORT.md` (finding: SIWE has no server-side nonce / replay protection — CONFIRMED, HIGH)

---

## 1. Executive Summary

Original problem:

> SIWE nonce was client-generated and lacked server-side issuance, persistence,
> expiration, and single-use consumption. `src/hooks/useWalletAuth.ts` built SIWE
> messages with `Nonce: ${Date.now()}`, so any captured (message, signature) pair
> could be replayed against `POST /api/auth/siwe` indefinitely. The server had no
> way to distinguish a fresh login from a replay.

After this batch, the SIWE flow satisfies:

1. **Server-generated nonce** — `GET /api/auth/siwe/nonce` issues `crypto.randomUUID()` (Node CSPRNG, 122-bit entropy). Client-generated nonces cannot pass verification.
2. **Server-side persistence** — every nonce is inserted into the dedicated `siwe_nonces` table (Supabase, service role, RLS-denied to anon/authenticated) before it is returned.
3. **TTL** — nonces expire after **5 minutes** (`expires_at`), enforced in the DB consume function.
4. **Single-use** — consumption happens through the Postgres function `consume_siwe_nonce(p_nonce, p_address)`, an atomic conditional `UPDATE ... WHERE used_at IS NULL AND expires_at > NOW() RETURNING *`. Concurrent replays cannot both succeed.
5. **Expiration validation** — SIWE message timestamps (`Expiration Time`, `Not Before`, future `Issued At`) are validated server-side before signature verification and before nonce consumption.
6. **Domain / URI / chainId validation** — against the project's canonical origins (`src/lib/site-host.ts`), not attacker-controlled values.
7. **Signature verification unchanged** — `ethers.verifyMessage` recovered-address equality is still required (verification guarantees preserved).

Result: a valid SIWE message **cannot** be replayed after its nonce has been consumed.

---

## 2. Baseline (recorded before changes)

```
git status --short   → pre-existing working-tree modifications (unrelated site-restructure batches)
git rev-parse HEAD   → 4cd117cfa221dbdad8855bd6030a704e6302810a
npx tsc --noEmit     → clean (post-change verification)
npx vitest run       → 64 files / 862 passed / 5 skipped / 0 failed (full regression after changes)
```

---

## 3. Root Cause

| Element | Before (vulnerable) | After (fixed) |
| --- | --- | --- |
| Nonce source | `Date.now().toString()` in `useWalletAuth.ts` (client-controlled, ~0 entropy, predictable) | `crypto.randomUUID()` in `GET /api/auth/siwe/nonce` (server CSPRNG) |
| Nonce persistence | none | `siwe_nonces` table (`supabase/migrations/20260907_siwe_nonces.sql`) |
| Expiration | none (message `Expiration Time` not validated; nonce never expires) | 5-min nonce TTL in DB + `validateSiweTimestamps()` on the message |
| Single-use | none — same signed message accepted forever | atomic `consume_siwe_nonce()` RPC; second consume raises `NONCE_INVALID_OR_CONSUMED` |
| Domain/URI | loosely accepted | strict allow-list from `src/lib/site-host.ts` canonical origins |
| Replay window | infinite | one consumption attempt within 5 minutes |


---

## 4. Security Design

### 4.1 Nonce endpoint — `src/app/api/auth/siwe/nonce/route.ts` (GET)

- Rate-limited first (`apiLookupLimiter`, 10 req/IP/min) — prevents nonce flooding.
- `randomUUID()` → insert row `{ nonce, created_at, expires_at = now+5min, used_at: null, address: null, domain, chain_id: 8453 }` → only then return `{ nonce, expires_at, domain, chain_id }`.
- No secrets returned. Insert failure → generic `INTERNAL_SERVER_ERROR` (500).
- Domain resolved from `NEXT_PUBLIC_SITE_URL` (fallback `myshape.com`); no per-request attacker input is trusted.

### 4.2 Verification route — `src/app/api/auth/siwe/route.ts` (POST)

Order of operations (security-equivalent to the required sequence):

```
1. rate limit (per-IP)
2. parse EIP-4361 message           → parseSiweMessage()  [siwe-parser.ts]
3. validate domain allow-list       → 400 SIWE_INVALID_DOMAIN
4. validate URI allow-list          → 400 SIWE_INVALID_URI
5. validate chainId policy          → 400 SIWE_INVALID_CHAIN (8453 only)
6. validate message timestamps      → 400 SIWE_TIMESTAMP_ERROR: SIWE_MESSAGE_EXPIRED /
                                        SIWE_MESSAGE_NOT_YET_VALID / SIWE_MESSAGE_ISSUED_IN_FUTURE
7. verify signature                 → ethers.verifyMessage; recovered ≠ claimed → 401 SIGNATURE_MISMATCH
8. atomically consume nonce         → supabase.rpc('consume_siwe_nonce', { p_nonce, p_address })
                                        failure → 400 SIWE_NONCE_INVALID (uniform message)
9. existing binding/session logic   → unchanged (genesis / skip_otp / email-ownership invariants preserved)
```

Nonce is consumed **after** cryptographic verification (step 7 → 8), so an attacker cannot burn a victim's nonce with garbage signatures.

### 4.3 Error uniformity (anti-enumeration)

External response for *not-found / expired / already-consumed* is one uniform code:

```
400 { "error": "SIWE_NONCE_INVALID: Nonce is invalid, expired, or already used" }
```

Internal `console.error` retains the specific reason (`SIWE_NONCE_CONSUME_ERROR: ...`) for server diagnostics without leaking state distinctions to clients. Domain/URI/chain/timestamp errors remain distinct because they are message-structure errors, not nonce-state errors.

### 4.4 Client flow — `src/hooks/useWalletAuth.ts`

```
eth_requestAccounts
  → GET /api/auth/siwe/nonce            (server nonce; aborts on failure)
  → build EIP-4361 message with server nonce + 5-min Expiration Time
  → signer.signMessage(message)
  → POST /api/auth/siwe { message, signature, address, email? }
```

The mock/demo branch (`?mock`) **no longer touches the real auth endpoint** — previously it POSTed a forged message with `Nonce: ${Date.now()}` and a random hex "signature"; that path is now simulated locally (`skip_otp: true, is_genesis: false`) so demo UX works without producing client-generated SIWE nonces.

---

## 5. Changed Files

**Created:**

| File | Purpose |
| --- | --- |
| `supabase/migrations/20260907_siwe_nonces.sql` | `siwe_nonces` table + RLS + `consume_siwe_nonce()` + `cleanup_expired_siwe_nonces()` |
| `src/app/api/auth/siwe/nonce/route.ts` | `GET /api/auth/siwe/nonce` — server nonce issuance |
| `src/lib/siwe-parser.ts` | EIP-4361 parser + `validateSiweTimestamps()` (no new dependency; pure TS) |
| `src/lib/siwe-parser.test.ts` | parser unit tests incl. frozen canonical origins |
| `src/lib/site-host.ts` | canonical origin constants shared by auth validation (auth helper) |
| `src/lib/site-host.test.ts` | pins canonical origins |
| `docs/security/P0-AUTH-SIWE-REPLAY.md` | this report |

**Modified:**

| File | Change |
| --- | --- |
| `src/app/api/auth/siwe/route.ts` | added parse/domain/URI/chain/timestamp validation + atomic nonce consumption after signature verification |
| `src/hooks/useWalletAuth.ts` | fetch server nonce before signing; removed client `Date.now()` nonce; mock branch no longer hits the auth API |
| `src/app/api/auth/siwe/route.test.ts` | 20 tests: replay matrix (Tests 1–10) + email-ownership invariants (Tests A–H) preserved and extended |

**Deleted:** none.

---

## 6. Database Changes

`supabase/migrations/20260907_siwe_nonces.sql` — additive only; **no existing table is altered**; no CPS-0001/CPS-0002 schema touched.

- `siwe_nonces`: `nonce TEXT PRIMARY KEY` (unique by construction), `created_at`, `expires_at`, `used_at` (NULL = unused), optional `address` (audit), `domain`, `chain_id`.
- Indexes: `idx_siwe_nonces_expires_at`; partial index `idx_siwe_nonces_used_at WHERE used_at IS NULL`.
- RLS enabled; policies: `service_role` full access; `anon` and `authenticated` explicitly denied (`USING (false)`) — the nonce table is reachable **only** through the API routes.
- `consume_siwe_nonce(p_nonce, p_address)` — atomic single-use consumption (see §8).
- `cleanup_expired_siwe_nonces(retention_minutes := 60)` — optional lightweight cleanup for pg_cron/scheduled job; expiry is *also* enforced at query/consume time, so cleanup is not required for correctness.

---

## 7. Nonce Lifecycle

```
ISSUE          GET /api/auth/siwe/nonce → randomUUID() (server CSPRNG)
  ↓
PERSIST        INSERT INTO siwe_nonces (expires_at = now + 5 min, used_at = NULL)
  ↓
CLIENT USE     client builds SIWE message embedding the nonce; wallet signs
  ↓
VERIFY         POST /api/auth/siwe → parse → domain/URI/chain/timestamps → signature
  ↓
ATOMIC CONSUME SELECT consume_siwe_nonce(p_nonce, p_address)
               UPDATE siwe_nonces SET used_at = NOW()
               WHERE nonce = p_nonce AND used_at IS NULL AND expires_at > NOW()
               RETURNING *   — row-by-row atomic; loser gets NOT FOUND
  ↓
SESSION        existing genesis / skip_otp / session logic (unchanged)
```

Any failure before CONSUME leaves the nonce unconsumed (except signature-valid replays, which consume exactly once by definition).

---

## 8. Replay Protection

> **A valid SIWE message cannot be successfully replayed after nonce consumption.**

Concretely:

- The consume function's `WHERE used_at IS NULL AND expires_at > NOW()` makes the state transition `unused → used` atomic at the row level. A second attempt — seconds later or concurrently — matches zero rows, raises `NONCE_INVALID_OR_CONSUMED`, and the route returns the uniform `400 SIWE_NONCE_INVALID`.
- Because the nonce is bound into the signed message, an attacker cannot swap in a fresh nonce without invalidating the wallet signature.
- Because consumption precedes session creation but follows signature verification, replay attempts are rejected without granting any session state.
- Expired nonces are rejected inside the same atomic statement; a late replay within the 5-minute message `Expiration Time` window still fails once the nonce is consumed.

## 9. Concurrency Behavior

Two requests racing the **same** nonce (Test 5): the Postgres row lock during the conditional `UPDATE` serializes the two consumers; the first commits `used_at = NOW()` and returns the row; the second's `WHERE used_at IS NULL` no longer matches → `NOT FOUND` → exception → `400`.

Test evidence (`src/app/api/auth/siwe/route.test.ts`, `Test 5 — concurrent replay`): `Promise.all([callRoute(body), callRoute(body)])` with the mock modeling DB single-use semantics yields exactly `[200, 400]`; the loser's error contains `SIWE_NONCE_INVALID`; both attempts are recorded as `consume_siwe_nonce` RPCs.

## 10. Server-Side Validation Matrix

| # | Check | Implementation | Failure response |
| --- | --- | --- | --- |
| A | Nonce exists & was server-issued | `consume_siwe_nonce` lookup in `siwe_nonces` | `400 SIWE_NONCE_INVALID` |
| B | Client arbitrary nonce | absent from table → same rejection as A (Test 6 proves `Date.now()` nonce fails) | `400` |
| C | Nonce not expired | `expires_at > NOW()` inside atomic UPDATE | `400 SIWE_NONCE_INVALID` |
| D | Nonce unused | `used_at IS NULL` inside atomic UPDATE | `400 SIWE_NONCE_INVALID` |
| E | Domain allow-list | `validateSiweMessageDomain` vs `site-host.ts` canonical origins | `400 SIWE_INVALID_DOMAIN` |
| F | URI belongs to application | URI origin must equal canonical origin | `400 SIWE_INVALID_URI` |
| G | ChainId policy | Base Mainnet `8453` only (matches existing client policy) | `400 SIWE_INVALID_CHAIN` |
| H | Address / signature | `ethers.verifyMessage(message, signature) === claimed address` (case-insensitive EIP-55 compare) | `401 SIGNATURE_MISMATCH` / `SIGNATURE_INVALID` |
| I | Message not expired | `validateSiweTimestamps` (`Expiration Time` in past) | `400 SIWE_TIMESTAMP_ERROR: SIWE_MESSAGE_EXPIRED` |
| J | Message not future/early | `Issued At > now + 2 min` and `Not Before > now` rejected | `400 SIWE_TIMESTAMP_ERROR: ...` |

## 11. Tests

`src/app/api/auth/siwe/route.test.ts` — real `ethers` signatures (deterministic throwaway key), Supabase client mocked with recorded calls:

| Spec test | Covers |
| --- | --- |
| Test 1 — valid nonce succeeds | happy path; asserts exactly one `consume_siwe_nonce` RPC |
| Test 2 — nonexistent nonce rejected | random UUID never issued → `400 SIWE_NONCE_INVALID` |
| Test 3 — expired nonce rejected | DB rejects expired row → uniform `400`, no row reads leaked |
| Test 4 — consumed nonce: first succeeds, second fails | sequential replay |
| Test 5 — concurrent replay: exactly one succeeds | `Promise.all` race → `[200, 400]` |
| Test 6 — client arbitrary nonce (`Date.now()`) rejected | proves client cannot mint its own valid nonce |
| Test 7 — invalid domain rejected | `evil.com` → `400 SIWE_INVALID_DOMAIN` |
| Test 8 — invalid URI rejected | `https://evil.com` → `400 SIWE_INVALID_URI` |
| Test 9 — expired SIWE message rejected | past `Expiration Time` → `400 SIWE_MESSAGE_EXPIRED`, zero RPCs |
| Test 10 — invalid signature rejected | different wallet signs → `401 SIGNATURE_MISMATCH` |
| Tests A–H | pre-existing email-ownership / genesis / error-sanitization invariants — all preserved (Test F, G, H unchanged in intent; A/E/E2 extended to the server-nonce flow) |

`src/lib/siwe-parser.test.ts`: EIP-4361 field extraction, timestamp validation edge cases, frozen canonical origins.

## 12. Test Results

```
Vitest (targeted):  npx vitest run src/app/api/auth/siwe/route.test.ts src/lib/siwe-parser.test.ts
                    → Test Files 2 passed (2) · Tests 23 passed (23)
                    (route.test.ts = 20: Tests 1–10 + email-ownership matrix A–H
                     + signature test; siwe-parser.test.ts = 3)

Vitest (full):      npx vitest run
                    → Test Files 64 passed (64) · Tests 862 passed, 5 skipped, 0 failed

TypeScript:         npx tsc --noEmit → exit 0 (clean, no errors)

Lint:               npx eslint <SIWE files> → no findings attributable to this batch.
                    Remaining findings verified as pre-existing against HEAD:
                    1. useWalletAuth.ts:101 react-hooks/set-state-in-effect — the
                       session-restore effect content is byte-identical to HEAD
                       (`git show HEAD:src/hooks/useWalletAuth.ts`); the HEAD
                       version of the file also fails eslint (`git show … |
                       npx eslint --stdin` → 1 error), so this is a baseline
                       issue in an out-of-scope area (unrelated UI).
                    2. route.test.ts:97/99 `_table`/`_cols` unused-param warnings —
                       present verbatim in HEAD (pre-existing mock convention).
```

## 13. Out of Scope (verified untouched by this batch)

- **CPS-0001** — canonical signing payload, protocol semantics, receipt schema: no changes; all CPS-0001 suites pass unchanged.
- **CPS-0002** — schema, canonical payload, trust semantics: untouched.
- **WebCrypto / browser key architecture** — `src/lib/browser-keys.ts` untouched.
- **CSPRNG outside SIWE nonce** — `src/engine/local-identity.ts` still uses a `Date.now()`-based presence-session nonce (documented P0-VERIFY finding; out of scope here).
- **Distributed rate limiter** — `src/lib/rate-limiter.ts` untouched (still process-local; reused as-is for the nonce endpoint).
- **CSP** — `next.config.ts` untouched.
- **MotionDemoClient / unrelated UI** — untouched (only the SIWE section inside `useWalletAuth.ts` changed).
- No dependency added or upgraded; no protocol/test file outside the SIWE scope modified.

## 14. Remaining Security Work

1. Legacy `localStorage` plaintext-hex Ed25519 key path (`src/lib/crypto.ts`) — audit/removal (HIGH, from P0-VERIFY).
2. Reference verifier `createReceiptId()` `Math.random()` cleanup (`continuity-protocol/reference-verifier/verifier.ts`).
3. Distributed rate limiter (current limiter is process-local; bypassable across instances/serverless).
4. CPS-0001 v1.1 signed `previousReceiptHash` (predecessor pointer currently unsigned by design decision).
5. `signedAt` design decision for CPS-0001.
6. CSP hardening (`unsafe-inline`/`unsafe-eval` in production headers).
7. Optional: schedule `cleanup_expired_siwe_nonces` via pg_cron (correctness does not depend on it).
8. Note: `nonce/route.ts` falls back to anon key if `SUPABASE_SERVICE_ROLE_KEY` is unset (existing project pattern); RLS denies anon inserts so it fails closed, but a missing service key will 500 — monitoring should alert on it.

## 15. Final Verification Commands

```
git diff --stat      → only SIWE-scoped files plus pre-existing unrelated working-tree changes
git diff --check     → no whitespace/conflict-marker errors in SIWE files
git status --short   → SIWE files present as expected; no git commit / tag created
```

Pre-existing unrelated working-tree modifications (site restructure etc.) were present at baseline and were **not** touched by this batch.

## 16. Final Verdict

| Required property | Status |
| --- | --- |
| Server generates SIWE nonce | ✅ `crypto.randomUUID()` in `nonce/route.ts` |
| Nonce persisted | ✅ `siwe_nonces` insert before response |
| Nonce has expiration | ✅ 5-min TTL enforced in DB consume |
| Nonce is single-use | ✅ atomic conditional UPDATE |
| Replay is rejected | ✅ Tests 2/3/4/6 |
| Concurrent replay allows exactly one success | ✅ Test 5 |
| Domain validated | ✅ Test 7 |
| URI validated | ✅ Test 8 |
| Expired SIWE rejected | ✅ Test 9 |
| Invalid signature rejected | ✅ Test 10 |
| Existing CPS-0001 tests unchanged | ✅ full suite green |
| Existing CPS-0002 tests unchanged | ✅ full suite green |
| No protocol semantics changed | ✅ additive-only scope |

**P0-AUTH STATUS: PASS**

