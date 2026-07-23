#!/usr/bin/env python3
"""
Minimal CPS-0001 Verifier (V₁ only)

Demonstrates that the protocol is simple enough to implement
in any language. This script checks schema validity (V₁) in ~50 lines.

Usage:
    python verify.py path/to/receipt.json
"""

import json
import sys
import hashlib


def verify_v1(receipt: dict) -> list[str]:
    """V₁: Schema validity. Returns list of error messages (empty = PASS)."""
    errors = []

    # protocolVersion must be "1.0"
    if receipt.get("protocolVersion") != "1.0":
        errors.append("protocolVersion must be '1.0'")

    # receiptId must be a non-empty string
    rid = receipt.get("receiptId")
    if not isinstance(rid, str) or len(rid) == 0:
        errors.append("receiptId must be a non-empty string")

    # interval with start, end, coverageMs
    interval = receipt.get("interval", {})
    if not isinstance(interval.get("start"), str):
        errors.append("interval.start must be a string (ISO 8601)")
    if not isinstance(interval.get("end"), str):
        errors.append("interval.end must be a string (ISO 8601)")
    if not isinstance(interval.get("coverageMs"), (int, float)) or interval["coverageMs"] <= 0:
        errors.append("interval.coverageMs must be a positive number")

    # subject with non-empty id
    subject = receipt.get("subject", {})
    if not isinstance(subject.get("id"), str) or len(subject["id"]) == 0:
        errors.append("subject.id must be a non-empty string")

    # at least one evidence block
    evidence = receipt.get("evidence", [])
    if not isinstance(evidence, list) or len(evidence) == 0:
        errors.append("evidence must be a non-empty array")
    else:
        for i, block in enumerate(evidence):
            if not isinstance(block.get("engineId"), str):
                errors.append(f"evidence[{i}].engineId must be a string")
            if not isinstance(block.get("confidence"), (int, float)):
                errors.append(f"evidence[{i}].confidence must be a number")
            if not isinstance(block.get("payload"), dict):
                errors.append(f"evidence[{i}].payload must be an object")
            if not isinstance(block.get("payloadDigest"), str):
                errors.append(f"evidence[{i}].payloadDigest must be a string")

    # assertions with required fields
    assertions = receipt.get("assertions", {})
    for key in ("observationOccurred", "continuityMaintained", "receiptIntegrity"):
        entry = assertions.get(key, {})
        if not isinstance(entry.get("value"), bool):
            errors.append(f"assertions.{key}.value must be a boolean")
        if not isinstance(entry.get("confidence"), (int, float)):
            errors.append(f"assertions.{key}.confidence must be a number")

    # issuer
    issuer = receipt.get("issuer", {})
    if not isinstance(issuer.get("id"), str) or len(issuer["id"]) == 0:
        errors.append("issuer.id must be a non-empty string")
    if not isinstance(issuer.get("publicKey"), str) or len(issuer["publicKey"]) == 0:
        errors.append("issuer.publicKey must be a non-empty string")

    # signature
    sig = receipt.get("signature", {})
    if not isinstance(sig.get("algorithm"), str):
        errors.append("signature.algorithm must be a string")
    if not isinstance(sig.get("value"), str) or len(sig.get("value", "")) == 0:
        errors.append("signature.value must be a non-empty string")
    if not isinstance(sig.get("signedAt"), str):
        errors.append("signature.signedAt must be a string (ISO 8601)")

    return errors


def main():
    if len(sys.argv) < 2:
        print("Usage: python verify.py <receipt.json>")
        sys.exit(1)

    path = sys.argv[1]
    with open(path) as f:
        receipt = json.load(f)

    errors = verify_v1(receipt)

    if errors:
        print("V₁ FAIL")
        for e in errors:
            print(f"  ✗ {e}")
        sys.exit(1)
    else:
        print("V₁ PASS")
        print(f"  receiptId: {receipt.get('receiptId')}")
        print(f"  evidence:  {len(receipt.get('evidence', []))} block(s)")
        print(f"  issuer:    {receipt.get('issuer', {}).get('id')}")


if __name__ == "__main__":
    main()
