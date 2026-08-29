# CPS-0001 v1.0-RC1 Release Notes

**Release candidate for CPS-0001 v1.0.**

## Status

- **Protocol spec**: FROZEN
- **Vectors**: FROZEN (5 reference receipts + invalid cases)
- **Conformance suite**: FROZEN (23 assertions, 10 scenarios)
- **Signature payload**: FROZEN (13 fields, all signed since v1.0-RC)
- **Temporal semantics**: FROZEN (since Batch-2C)
- **Browser key protection**: FROZEN (since Batch-2D)

## Changes since v1.0-RC

| Category | Change | Rationale |
|---|---|---|
| Signature | `interval.coverageMs` added to signing payload | Prevents receipt tampering: coverageMs could previously be altered without invalidating signature |
| Temporal | NaN-producing dates → TEMPORAL_INCONSISTENCY | Prevents malformed-date bypass of freshness checks |
| Temporal | `end > now` → INVALID (future interval blocked) | Prevents pre-signed future receipts |
| Browser | Private key now `CryptoKey` (non-extractable), stored in IndexedDB | Removes JS-readable private key from localStorage |
| CSP | `unsafe-inline` / `unsafe-eval` removed from production CSP | Closes XSS → key-extraction vector |

## What is NOT changing

- No protocolVersion bump (still "1.0")
- No receipt schema change
- No verification semantics change (V₁–V₇ unchanged)
- No issuer assertion/truth semantics change

## Security Disclosure

### Fixed in v1.0-RC1

- **CVE-N/A**: Private key was stored as extractable hex string in localStorage, vulnerable to XSS extraction. Now uses WebCrypto CryptoKey with `extractable=false`.
- **CVE-N/A**: `coverageMs` was not included in signing payload, allowing receipt content tampering. Now signed and verified.
- **CVE-N/A**: Malformed temporal values produced `NaN`, bypassing freshness checks via JavaScript falsy comparison. Now explicitly rejected.

### Known Limitations (Non-blocking)

- Dev-mode CSP temporarily allows `unsafe-inline` for debugging (disabled in production)
- Published npm package `@thecontinuitylab/myshape@0.3.0` predates Batch-2D hardening
- Historical receipts signed with hex-key format cannot be verified under new non-extractable key regime

## NPM Package Version

- **Source**: v1.0-RC1 (frozen here)
- **Published**: `@thecontinuitylab/myshape` — **NOT YET** re-published since Batch-2D; current registry version (0.3.0) contains pre-hardening key storage

## Next Steps

1. RC1 30-day community review period
2. Collect independent implementation feedback (IMPLEMENT.md challenge)
3. Address conformance edge cases
4. Plan v1.0 final release

## References

- Full verification log: see `docs/forensic-audit-2026-08-25.md`
- Protocol boundary: see `continuity-protocol/PROTOCOL_BOUNDARY.md`
