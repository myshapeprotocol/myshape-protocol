# Minimal CPS-0001 Producer

A standalone Node.js script that generates a valid Continuity Receipt.

## Run

```bash
node generate.mjs
```

Output: `my-cps-0001-receipt.json`

## Verify

```bash
# Option 1: HTTP gateway
curl -X POST https://myshape.org/api/verify-receipt \
  -H "Content-Type: application/json" \
  -d @my-cps-0001-receipt.json

# Option 2: Reference verifier (clone repo)
cp my-cps-0001-receipt.json ../test-vectors/valid-receipt-01.json
npx vitest run continuity-protocol/conformance/
```

## What to change

Replace the `payload` and confidence score with your own evidence engine.

## Zero MyShape dependencies

This file imports nothing from the MyShape codebase. It only uses Node.js built-in `crypto` and `fs` modules.
