# Hacker News Post — CPS-0001 v1.0-RC1

## Post Type

Show HN

## Title

Show HN: CPS-0001 – An open-source reference implementation for entity continuity

## Post Body

We built an open-source reference implementation for tracking whether an entity (user, device, agent) has remained continuous over a bounded time interval.

The core problem we're trying to solve: how do you cryptographically bind a set of observations to a time window, such that a third party can verify the binding without needing to trust the observation source?

The repository includes:

- A reference verifier (TypeScript/Node)
- An independent second-producer implementation
- CLI tool for verification
- Test vectors (valid and invalid)
- Conformance tests across implementations
- Browser-side key handling tests

The current implementation uses Ed25519 signatures over a canonical serialization of the receipt. The signing payload covers 13 fields including the interval, subject, evidence digests, issuer, and temporal bounds.

We are deliberately conservative about what this does NOT establish:

- It does not prove the underlying evidence is truthful
- It does not establish biological identity
- It does not provide liveness detection
- It does not prevent Sybil attacks by itself

The 13-field signing payload is frozen for a 30-day review period. We're particularly interested in:

- Canonicalization edge cases
- Verifier design flaws
- Whether this abstraction is useful at all

Repository: https://github.com/myshapeprotocol/myshape-protocol/releases/tag/v1.0-RC1

## Posting Notes

- Post during peak HN traffic hours (8-10 AM EST / 13:00-15:00 UTC)
- The first 30-60 minutes are critical for visibility
- Engage with every comment in the first 2 hours
- Be honest about limitations — HN values technical honesty over marketing
- Do not use upvote manipulation or alt accounts
- If the post doesn't gain traction, do NOT delete and repost
- **NO links to myshapeprotocol.com — GitHub Release only**
