# CPS-0001 v1.0-RC1 — Publishing Schedule

## Overview

This document defines the exact order and timing for publishing CPS-0001 v1.0-RC1 across all platforms.

The goal is NOT maximum exposure. It is to attract the right audience: people who will actually read the protocol, implement it, or challenge it.

---

## Pre-Publishing Checklist

- [x] GitHub Release created: https://github.com/myshapeprotocol/myshape-protocol/releases/tag/v1.0-RC1
- [x] v1.0-RC1 tag pushed to remote
- [x] All 39 RC1 files committed and pushed
- [x] Protocol boundary documented
- [x] Test vectors published
- [x] CLI parity verified
- [x] Browser key security implemented

---

## Publishing Timeline

### T+0 (NOW) — GitHub Release

**Status:** ✅ COMPLETED

URL: https://github.com/myshapeprotocol/myshape-protocol/releases/tag/v1.0-RC1

This is the single source of truth. All other platforms point here.

---

### T+15 minutes — X (Twitter)

**Status:** ⏳ MANUAL (User will post)

**File:** `x-thread.md`

**Content:** Short main post + 5-tweet thread

**Key message:** "CPS-0001 v1.0-RC1 is public. 30-day community review is open."

**Link:** GitHub Release URL

---

### T+1 hour — LinkedIn

**Status:** ⏳ MANUAL (User will post)

**File:** `linkedin-post.md`

**Content:** Long-form post about why we're publishing, not just what we built

**Key message:** "We're inviting criticism, not asking for trust."

**Link:** GitHub Release URL

---

### T+3 hours — Bluesky

**Status:** ⏳ AUTOMATED (This agent will post)

**File:** `bluesky-post.md`

**Content:** Short post with link to GitHub

**Key message:** "We're not asking you to trust it. We're asking you to implement it, test it, and break it."

**Link:** GitHub Release URL

---

### T+24 hours (Tomorrow) — Hacker News

**Status:** ⏳ AUTOMATED (This agent will post)

**File:** `hackernews-post.md`

**Content:** Show HN format, technical focus

**Title:** "Show HN: CPS-0001 – An engine-independent protocol for verifiable continuity"

**Link:** GitHub Release URL

---

### T+48-72 hours (Day 2-3) — Reddit

**Status:** ⏳ AUTOMATED (This agent will post)

**File:** `reddit-post.md`

**Content:** Technical discussion, not product announcement

**Title:** "We just released an engine-independent protocol for verifiable continuity — looking for technical criticism"

**Target:** r/crypto or r/programming first

**Link:** GitHub Release URL

---

## Platform-Specific Notes

### X (Twitter)

- Character limit: 280 per post
- Use thread format for technical details
- Pin the main post to your profile
- Do not use excessive hashtags
- Engage with every reply in the first 2 hours

### LinkedIn

- No strict character limit, but keep under 3000 characters
- Use professional tone
- Tag relevant connections if appropriate
- Engage with every comment
- Consider writing a longer article later if engagement is good

### Bluesky

- Character limit: 300 per post
- Keep it short and direct
- Use link card for GitHub Release
- Engage with replies

### Hacker News

- Show HN format required
- Post during peak hours (8-10 AM EST)
- First 30-60 minutes are critical
- Be honest about limitations
- Engage with every comment in first 2 hours
- Do not delete and repost if it doesn't gain traction

### Reddit

- Do NOT post to multiple subreddits at once
- Start with one relevant subreddit
- Wait 48 hours before posting to another
- Follow each subreddit's self-promotion rules
- Engage with every comment
- Be honest about limitations

---

## What We're Measuring (30-Day Review)

### Primary Metrics (Most Valuable)

1. **Independent implementations** — Someone builds a producer or verifier we didn't write
2. **Technical criticism** — Someone finds a real flaw in the protocol
3. **GitHub issues/discussions** — Substantive technical discussion
4. **External references/citations** — Someone cites CPS-0001 in their own work

### Secondary Metrics (Nice to Have)

5. **GitHub stars** — Indicator of interest, but not validation
6. **Social media engagement** — Likes, shares, comments
7. **Press mentions** — Articles or blog posts about CPS-0001

### What We're NOT Measuring

- Raw social media views
- Follower count
- "Hype" or "buzz"
- Superficial engagement

---

## Post-Publishing: 30-Day Review Process

### Week 1: Observation

- Monitor GitHub issues and discussions daily
- Respond to every substantive comment within 24 hours
- Do NOT defend the protocol — listen and document
- Track all criticism in a running document

### Week 2: Engagement

- Follow up on promising leads
- Reach out to people who asked good questions
- Offer to help with independent implementations
- Document any patterns in feedback

### Week 3: Synthesis

- Compile all feedback into a structured document
- Categorize: bugs, design issues, missing features, unclear language
- Prioritize by severity and frequency
- Begin drafting v1.0 final or v1.0-RC2 changes

### Week 4: Decision

- Decide: v1.0 final, v1.0-RC2, or major revision
- Publish decision and rationale
- Thank all contributors
- Plan next steps

---

## Important Reminders

1. **RC1 is frozen.** Do not change protocol semantics during review.
2. **All criticism is welcome.** Even "this protocol is unnecessary" is valuable.
3. **No marketing spin.** Be honest about limitations.
4. **GitHub is the source of truth.** All platforms point there.
5. **Quality over quantity.** One independent implementation is worth more than 10,000 likes.
