# Reddit Post — CPS-0001 v1.0-RC1

## Target Subreddit (Single, Vertical)

**r/crypto** — cryptography research community

Do NOT cross-post to other subreddits. If r/crypto doesn't respond, wait 72+ hours before trying a different single subreddit.

**Pre-Posting Requirement:** Manually check r/crypto's pinned rules for self-promotion and new account restrictions before posting.

## Post Title

We released an open-source tool for verifiable entity continuity — looking for technical criticism

## Post Body

We just released CPS-0001 v1.0-RC1, an open-source reference for Continuity Receipts.

I'm sharing this primarily because we're looking for people who are willing to tell us where the design is wrong.

The core idea is to separate:

- evidence generation
- the receipt object
- verification
- downstream policy

A producer can generate a receipt using its own evidence engine.

A verifier should be able to validate the receipt without knowing how that evidence was generated.

The RC1 release includes:

- a reference verifier
- an independent second producer
- V₁–V₇ verification
- canonical signing payload parity across implementations
- CLI verification
- valid/invalid test vectors
- conformance tests

One thing we deliberately tried to avoid is overclaiming.

CPS-0001 does not claim that a signed receipt proves biological truth, proof-of-human, proof-of-liveness, or universal anti-Sybil protection.

The reference is currently in a 30-day community review.

I'm particularly interested in criticism around:

- canonicalization
- design boundaries
- interoperability
- threat models
- verifier design
- whether this abstraction is actually useful

Repository: https://github.com/myshapeprotocol/myshape-protocol/releases/tag/v1.0-RC1

If this approach is unnecessary, I'd rather discover that now than after calling it v1.0.

---

## Posting Notes

- Do NOT post to multiple subreddits simultaneously
- Post to r/crypto ONLY first
- Wait at least 72 hours before posting to a different subreddit (if at all)
- Engage with every comment honestly
- Do not use upvote manipulation or alt accounts
- Follow r/crypto's self-promotion rules strictly
- **NO links to myshapeprotocol.com — GitHub Release only**
- Check subreddit rules BEFORE posting (Human-in-the-loop gate)
