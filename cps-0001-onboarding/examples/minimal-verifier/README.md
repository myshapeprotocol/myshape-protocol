# Minimal CPS-0001 Verifier

A standalone Python script that performs V₁ (schema validity) check.

Demonstrates that the protocol is simple enough to implement in any language.

## Run

```bash
pip install jsonschema  # optional, only if you want schema validation

# Test against the minimal receipt
python verify.py ../minimal-receipt.json

# Test against a test vector
python verify.py ../../continuity-protocol/test-vectors/valid-receipt-01.json
```

## Expected output

```
V₁ PASS
  receiptId: 00000000-0000-7000-8000-000000000001
  evidence:  1 block(s)
  issuer:    sha256:external-impl
```
