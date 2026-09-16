# MyShape Protocol — External Review Brief

**Audience:** External researchers, protocol engineers, security reviewers
**Tone:** Technical, neutral, honest
**Last verified:** 2026-09-14 against repository state

---

## 1. What problem are we exploring?

Identity systems answer *"who is this entity?"* Authentication answers *"can this entity prove who it is?"* Authorization answers *"is this entity allowed to do this?"*

None of these answer a different question: **"Is this the same entity that was here before — continuously, across time, sessions, and state transitions?"**

We call this property **continuity**: the verifiable, unbroken chain of existence of a digital subject over a bounded interval.

This question becomes critical when AI agents can generate faces, voices, and behaviors on demand. A face proves a face was present. A voice proves a sound was played. Neither proves that the same entity remained continuously present throughout.

For digital entities — human-operated sessions, autonomous AI agents, long-running service accounts — continuity asks whether the entity at time T2 is the same physical or operational entity that was verified at time T1, without interruption or impersonation.

We do not claim this problem is unsolved or that existing systems fail. We claim it is underexplored as an independent primitive.

---

## 2. The hypothesis

**"Continuity may represent an independent, verifiable trust primitive."**

This is a hypothesis, not an established fact.

We do not claim continuity is "the missing layer" or that it replaces identity, authentication, or authorization. We claim it may be *orthogonal* to them — useful in contexts where those three are already satisfied but the question of *temporal persistence* remains open.

This hypothesis could be wrong. Continuity may be fully reducible to combinations of existing primitives (state integrity, session binding, attestation). We are publishing our work to find out.

---

## 3. What we built

Two protocol specifications, frozen at prototype stage:

**CPS-0001 — Continuity Receipt**
An engine-independent, Ed25519-signed receipt that records the evidence and continuity result produced by an observation process over a bounded time interval. The receipt references the subject, the time window, and the evidence — but does not specify *how* the evidence was collected. Any sensor, algorithm, or hardware can produce a valid receipt.

**CPS-0002 — Human Signal Assertion (HSA)**
A receipt-bound attestation layer. An independent attester signs an assertion that references a specific CPS-0001 receipt by hash, carries an evidence payload digest, and has a bounded validity window. The assertion supports independent cryptographic verification: any party can confirm the signature, receipt binding, and validity window without relying on claims from the issuer, attester, or sensor stack. This produces a VALID/INVALID verdict only — it does not, by itself, establish trust.

**Verification model**
Two independent verifier implementations (reference + second) both process every assertion and must agree on `VALID` / `INVALID`. The verdict is cryptographic only — it does not establish trust, human authenticity, or authorization.

**Architecture in brief**
1. An evidence engine observes a subject over time.
2. CPS-0001 produces a signed Continuity Receipt.
3. CPS-0002 produces an attestation bound to that receipt.
4. Any party can verify the assertion cryptographically.
5. Trust decisions (accept, reject, act) are explicitly outside the protocol.

---

## 4. What is frozen today

| Artifact | Version | Status |
|---|---|---|
| CPS-0001 | v1.0-RC1 | Release candidate |
| CPS-0002 Protocol Core | `cps-hsa-0.1-draft` | Prototype freeze candidate — not yet frozen |
| Conformance tests | 52 | Passing |
| Interoperability tests | 39 | Passing |
| **Total** | **91** | **All passing** |

These are protocol conformance and cross-verifier interoperability results. They demonstrate that two independent implementations agree on the cryptographic verdict for a defined set of inputs.

They are **not** proof of real-world adoption, scientific validation, or resistance to attacks not covered by the test suite.

---

## 5. What is NOT being claimed

The following statements are **explicitly false** under this protocol:

- `VALID` ≠ `TRUSTED`
- `VALID` ≠ `HUMAN`
- `VALID` ≠ `AUTHORIZED`
- `VALID` ≠ `ACCEPTED`
- Human Signal Assertion ≠ Proof of Human

A `VALID` CPS-0002 assertion means only that the cryptography verifies, the receipt binding is correct, and the assertion is within its validity window. Whether the attested subject is a human, a script, or an AI agent is outside the scope of the protocol core.

Scientific evidence for the underlying motion-signature approach remains preliminary. It has not been independently replicated at scale. The benchmark dataset is limited in size, demographic coverage, and hardware diversity.

These limitations are stated explicitly because the purpose of external review is to identify where the work is wrong, incomplete, or unnecessary.

---

## 6. What we want external reviewers to challenge

We are asking reviewers to focus on three questions:

**A. Is continuity genuinely distinct?**
Is "continuity" a meaningful independent primitive, or is it simply a combination of existing state-integrity, session-binding, and attestation mechanisms? If it is reducible, we want to know.

**B. Does it provide independent value?**
Even if distinct, is continuity useful? Are there real applications where continuity provides security or trust properties that cannot be achieved more simply with existing primitives?

**C. What assumptions are wrong or incomplete?**
We have made technical, security, and adoption assumptions. Which ones are incorrect? Which threat vectors are we missing? Which deployment realities have we not considered?

We are not asking for endorsement. We are asking for the specific ways this work is insufficient, incorrect, or unnecessary.

---

## 7. Links

- **Website:** https://myshape.com
- **CPS-0001 (Continuity Receipt):** https://myshape.com/research/notes/008-continuity-protocol-core
- **CPS-0002 (Human Signal Assertion):** https://thecontinuitylab.org/protocols/cps-0002
- **Source repository:** https://github.com/myshapeprotocol/myshape-protocol
- **Research lab:** https://thecontinuitylab.org

---

*This brief is a factual summary, not a marketing document. All claims are verifiable against the repository state as of 2026-09-14. If you find errors, please open an issue or contact the lab directly.*

