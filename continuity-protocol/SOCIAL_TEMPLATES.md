# Social Post Templates

> Updated: 2026-07-25 · CPS-0001 v1.0-RC

---

## GitHub Discussions (Show and tell)

Title: **[Challenge] Implement CPS-0001 from spec alone — blind implementation test**

```
We're testing whether CPS-0001 is independently implementable.

The claim: a third party can build a conforming producer or verifier
without reading MyShape source code, using only SHA-256 and Ed25519.

What we need:
3–5 developers to try the blind implementation challenge.
30–90 minutes. Any language. Pass or fail — both are data.

→ START_HERE: continuity-protocol/START_HERE.md
→ Spec: CPS0001.md
→ Verifier: npx cps-verify your-receipt.json

Known limitations posted in PROTOCOL_STATUS.md.
No product pitch. No company. Just protocol testing.

Try it: github.com/myshapeprotocol/myshape-protocol
```

---

## Reddit (r/cryptography, r/rust, r/golang)

Title: **[Challenge] Can you implement this protocol from spec alone?**

```
CPS-0001 is a protocol for continuity assertions — engine-independent,
Ed25519-signed, JSON Schema validated. The claim is that anyone can
implement a conformant producer without reading the original source.

I'm testing that claim. Not selling anything. Just collecting data.

The challenge:
1. Read START_HERE.md (no MyShape source, no SDK)
2. Write a program (any language) that produces a valid Continuity Receipt
3. Run the CLI verifier against your output:
   node cli/bin/cps-verify.mjs your-receipt.json

Tools needed: SHA-256 + Ed25519 + JSON. No framework, no GPU, no sensor.
Most implementations: 30–90 minutes.

3–5 independent implementations wanted. Pass or fail — both are valuable.
PROTOCOL_STATUS.md lists all known limitations honestly.

github.com/myshapeprotocol/myshape-protocol
Discussions: github.com/myshapeprotocol/myshape-protocol/discussions
```

---

## X/Twitter

```
Testing a claim: can you implement CPS-0001 without reading the source?

Blind implementation challenge:
→ Any language
→ SHA-256 + Ed25519 only
→ 30–90 min
→ Pass or fail — both are data

github.com/myshapeprotocol/myshape-protocol
→ START_HERE.md

Not a product. Protocol testing. 3–5 implementers wanted.
```

---

## Bluesky

```
Blind protocol test: can you implement CPS-0001 from spec alone?

Any language. SHA-256 + Ed25519. 30–90 min.
3–5 independent implementations wanted.
Pass or fail — both are data points.

github.com/myshapeprotocol/myshape-protocol
```

---

## Telegram / Discord / Signal

```
[Challenge] Implement CPS-0001 from spec — no source access

30–90 min · Any language · SHA-256 + Ed25519
3–5 developers wanted for blind implementation test.

github.com/myshapeprotocol/myshape-protocol
→ continuity-protocol/START_HERE.md
```

---

## Dev.to / Blog Post

Title: **"We're Testing Whether Our Protocol Can Be Implemented Without Reading the Source"**

Angle: honest research post, not marketing. Document the blind test setup,
known limitations (link PROTOCOL_STATUS.md), and what we hope to learn.
Call to action: try the challenge, report stuck points.

---

## Direct Email / DM

Subject: Blind protocol implementation — 30 minute challenge

```
I'm running a blind implementation test for CPS-0001,
an engine-independent protocol for continuity assertions.

The question: can someone implement it without reading the source?

The challenge (30–90 min):
1. Read one markdown file
2. Write a small program in any language
3. Run a CLI verifier against your output

You need SHA-256, Ed25519, and JSON. That's it.
No setup, no dependencies, no MyShape knowledge needed.

If you're interested: github.com/myshapeprotocol/myshape-protocol
Start: continuity-protocol/START_HERE.md

Pass or fail — both are data. I want to know where you got stuck.
```
