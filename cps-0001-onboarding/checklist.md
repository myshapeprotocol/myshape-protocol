# CPS-0001 Onboarding Checklist

Track your progress through the onboarding.

## 00 — Protocol Model

- [ ] Read what CPS-0001 is (four layers: assertion, evidence, context, signature)
- [ ] Understood the seven verification checks (V₁–V₇)
- [ ] Understood engine-independence principle

## 01 — Receipt Walkthrough

- [ ] Walked through the example receipt JSON
- [ ] Can identify each field's role in verification
- [ ] Saw the real test vectors

## 02 — Build a Receipt

- [ ] Created and ran `generate-receipt.mjs`
- [ ] Got `receiptId` in the output
- [ ] `my-receipt.json` saved to disk
- [ ] Confirmed it's valid JSON

## 03 — Verify

- [ ] Ran the conformance suite
- [ ] Or implemented V₁ in your language of choice
- [ ] Got "V₁ PASS" or `{ status: "VALID" }`

## 04 — Write Your Own Producer (optional but valuable)

- [ ] Read the challenge description
- [ ] Implemented a producer that generates a valid receipt
- [ ] Receipt passes the verifier
- [ ] (Optional) Used a real sensor for evidence

## Completion

- [ ] You have generated and verified a CPS-0001 receipt
- [ ] You did NOT read MyShape engine code
- [ ] (If you published your implementation) Tagged us on GitHub

---

## Feedback

If you got stuck, hit a gap, or have suggestions:

- Open an issue: https://github.com/myshapeprotocol/myshape-protocol/issues
- Or email: thecontinuitylab@myshape.org

Every point of friction is valuable — it tells us where the protocol needs to be clearer.
