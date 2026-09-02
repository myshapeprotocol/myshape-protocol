# LinkedIn Post — CPS-0001 v1.0-RC1

CPS-0001 v1.0-RC1 is now publicly released.

Today we are opening a 30-day community review of the Continuity Protocol Standard.

The idea is simple:

Digital identity systems are very good at answering:

"Who are you?"

But many emerging systems need a different question:

"Can a system verify continuity over time?"

CPS-0001 defines a protocol object called the Continuity Receipt — a cryptographically verifiable record representing evidence collected over a bounded interval.

The protocol is intentionally engine-independent.

It does not require MyShape's implementation.
It does not require a particular sensor.
It does not require a particular evidence algorithm.

A third party should be able to implement a compatible producer or verifier independently.

RC1 includes:

• a V₁–V₇ verification contract
• an independent reference verifier
• a second producer implementation
• cross-implementation conformance testing
• canonical signing payload parity
• CLI verification
• valid and invalid test vectors
• browser key security controls

Just as importantly, we have explicitly documented what the protocol does NOT prove.

CPS-0001 does not claim biological truth, proof-of-human, proof-of-liveness, or universal anti-Sybil protection.

We believe a protocol becomes stronger when its boundaries are explicit.

So this release is not a declaration that the problem is solved.

It is an invitation to challenge the protocol before v1.0.

30-day community review is now open.

Repository:
https://github.com/myshapeprotocol/myshape-protocol

Protocol:
https://www.myshape.com/protocol

If you build identity, security, agent infrastructure, robotics, XR, or verification systems, we would particularly value your criticism and interoperability attempts.
