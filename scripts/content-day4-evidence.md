# Day 4 — Evidence: 576 Runs. 4 Engines. All Open.

## Data verified from: papers/arxiv-rn-001/paper.tex, papers/rn-002/

---

## X / Bluesky Thread (6 posts, ≤300 chars each)

Post 1:
```
Day 4: Evidence.

Three days of framing the problem. Today: the data.

576 experimental runs. 4 independent engines. All on consumer hardware. All open.
```

Post 2:
```
EE-001 — Presence Entropy Score
4-dimensional biological noise analysis.
N = 281 | Cohen's d = 2.1 | AUC = 0.94

Translation: human sensor data is systematically different from AI-generated data. Not by a little. By two standard deviations.

There is a detectable signal.
```

Post 3:
```
EE-002 — Cross-Modal Causal Coupling
Camera + IMU temporal binding.
100% alignment across 316 trials.

The question isn't "is the camera feed real?" It's "do the camera and the motion sensor see the same event at the same time?"

When they do — and they did, 316/316 — that's not luck.
```

Post 4:
```
EE-003 — Challenge-Response
Randomized gyroscope challenges with jittered timing.
60% pass rate, N = 200.

Not perfect. Not meant to be.

The point: a challenge that costs the verifier almost nothing but forces the attacker to solve a real-time physics problem.
```

Post 5:
```
VS-001 — Verification Session
Dual-engine pipeline: passive PES → active challenge escalation.
93% pass rate across 60 sessions.

Each engine alone has gaps. Combined, they catch what individuals miss.

576 runs total. All documented. Failures included.
```

Post 6:
```
We don't claim any of these engines are perfect.
We claim the evidence is public, reproducible, and directionally consistent.

If you think the numbers are wrong — the data is open. Run it yourself.

thecontinuitylab.org | github.com/myshapeprotocol
```

---

## LinkedIn Long-Form

```
576 Experiments. 4 Engines. One Question.

Three days ago we laid out the problem. Yesterday we showed the math behind our approach. Today we show the evidence — all of it.

═══════════════════════════════════════

THE FOUR ENGINES

EE-001 — Presence Entropy Score (PES)

4-dimensional biological noise analysis. No user action needed — it passively measures whether sensor data carries the statistical signature of a living entity.

N = 281 | Cohen's d = 2.1 | AUC = 0.94

"Cohen's d = 2.1" means the distribution of human sensor data is separated from AI-generated data by more than two standard deviations. That's not a subtle difference. That's a detectable signal.

Crucially: inter-person discrimination is d = 0.04. PES was designed to measure presence, not identity. The null result on identity confirms the design intent.

EE-002 — Cross-Modal Causal Coupling

Temporal binding between independent sensor streams (camera + IMU). The question: do both sensors detect the same physical event at the same moment?

100% alignment across 316 trials.

This is important because an AI generating a video doesn't necessarily produce IMU data consistent with the camera motion. The two streams are physically coupled in reality. The coupling is detectable.

EE-003 — Challenge-Response

Randomized gyroscope challenges with jittered timing. The user must move their device in a specific direction within a time window.

60% pass rate, N = 200.

Only 60%? Yes. And that's expected. Challenge-response is noisy by nature — human reaction times vary, motion varies. But the architecture matters more than the score: a real-time challenge costs the verifier almost nothing, while it forces the attacker to solve a physics problem on demand.

EE-004 — Verification Session (VS-001)

Dual-engine pipeline combining passive PES with active challenge escalation. Protocol-level: hash-chained receipts, Ed25519 signatures, V₁-V₇ verification contract.

93% pass rate, 60 sessions.

The pipeline is the point. Each engine individually has gaps. Combined, they do what individuals cannot — because the attacker faces multiple independent tests simultaneously.

═══════════════════════════════════════

WHAT THIS MEANS

576 experimental runs total. Four independent engines. All on consumer hardware. All data open. All failure cases documented alongside results.

We are not claiming to have solved forgery. We are claiming to have built an architecture where the evidence is public, the protocol is engine-independent, and the direction of the data is consistent.

The next step: external verification. Can someone else — using different hardware, different subjects, different conditions — reproduce these results?

If you have a phone and some skepticism, the data is open.

github.com/myshapeprotocol/myshape-protocol
thecontinuitylab.org

#TheContinuityLab #MyShape #CPS0001 #OpenScience
```

---

## Telegram (Markdown)

```
*Day 4 — Evidence: 576 Runs. 4 Engines. All Open.*

Three days of problem setup. Today: what the lab actually produced.

*The Four Engines*

*EE-001 — Presence Entropy Score*
4-dimensional biological noise. Passive — no user action.
N = 281 | Cohen's d = 2.1 | AUC = 0.94
Human sensor data is systematically different from synthetic. By two standard deviations. This is the strongest signal we have.

*EE-002 — Cross-Modal Causal Coupling*
Temporal binding: do camera and IMU see the same event?
100% alignment — 316/316 trials.
Physically coupled signals leave detectable traces.

*EE-003 — Challenge-Response*
Randomized gyroscope challenges, jittered timing.
60% pass, N = 200.
Not perfect. Not meant to be. The architecture matters: real-time physics problems are expensive for attackers, cheap for verifiers.

*VS-001 — Verification Session*
Dual-engine pipeline: PES → challenge escalation.
93% pass, 60 sessions.
Combined, the engines catch what individuals miss.

*Total: 576 runs. All data open. All failures documented.*

Next step: independent reproduction.

thecontinuitylab.org | github.com/myshapeprotocol
```

---

## Discord

```
**Day 4 — Evidence: 576 Runs. 4 Engines. All Open.**

**EE-001 (PES):** 4D biological noise, N=281, Cohen's d=2.1, AUC=0.94
**EE-002 (Cross-modal):** Camera+IMU alignment, 100% across 316 trials
**EE-003 (Challenge):** Randomized gyro, 60% pass, N=200
**VS-001 (Pipeline):** PES→challenge escalation, 93% pass, 60 sessions

**576 total runs.** Consumer hardware. All data public. All failure cases documented.

github.com/myshapeprotocol
```

---

## GitHub Discussion

Title: **Day 4: Evidence — 576 experimental runs, 4 engines, all open**

Post:
```
Three days of framing the problem. Today we show the data.

**The Four Engines**

| Engine | Method | N | Key Metric |
|--------|--------|---|------------|
| EE-001 (PES) | 4D biological noise | 281 | Cohen's d = 2.1, AUC = 0.94 |
| EE-002 (Cross-modal) | Camera+IMU temporal binding | 316 | 100% alignment |
| EE-003 (Challenge) | Randomized gyroscope | 200 | 60% pass rate |
| VS-001 (Pipeline) | PES → challenge escalation | 60 sessions | 93% pass rate |

**Total: 576 experimental runs.**

**Key properties:**
- All on consumer hardware (no special equipment needed)
- All data public
- All failure cases documented in the arXiv paper appendix
- Protocol is engine-independent — any sensor, any algorithm can produce CPS-0001 receipts
- PES measures presence, not identity (inter-person d = 0.04 confirms this by design)

**What's next:** External reproduction. We need independent teams to run these engines on their own hardware, with their own subjects.

Paper: myshape.com/research
Code: github.com/myshapeprotocol/myshape-protocol
```

---

## HuggingFace Discussion

Title: **Day 4: Evidence — 576 experimental runs, 4 engines**

Post:
```
576 experimental runs across 4 independent evidence engines. All on consumer hardware. All data open.

| Engine | N | Key Result |
|--------|---|------------|
| EE-001 (PES) | 281 | Cohen's d = 2.1 (strong biological signal) |
| EE-002 (Cross-modal) | 316 | 100% temporal alignment |
| EE-003 (Challenge) | 200 | 60% pass rate |
| VS-001 (Pipeline) | 60 sessions | 93% pass rate |

Each engine has gaps individually. Combined, the attack surface shrinks.

Dataset: huggingface.co/datasets/ContinuityLab-Org/cps-0001-benchmark
```
