# arXiv Submission Package — The Continuity Problem

## Files in this directory

| File | Description |
|:---|:---|
| `paper.tex` | Main LaTeX source (IEEEtran, cs.CR) |
| `paper.pdf` | Compiled output (3 pages, 4 figures) |
| `fig-architecture.svg` | Multi-engine + CPS-0001 protocol architecture |
| `fig-cost-asymmetry.svg` | Cost asymmetry model — forgery cost vs. number of evidence channels |
| `fig-engine-results.svg` | 576-run experiment summary (4 engines, detection rate by attack vector) |
| `README.md` | This file — submission instructions |

## arXiv Submission Steps

### 1. Account + Endorsement

arXiv requires endorsement for first-time submitters in cs.CR.

**Your options:**

- **Option A:** Ask a colleague who has previously published in cs.CR to endorse you. The endorser needs to confirm they know you and that the work is legitimate.

- **Option B:** Submit to **cs.AI** or **cs.HC** (Human-Computer Interaction) instead, where the endorsement bar may be lower — but cs.CR is the better fit for this paper's framing (security primitive, attack model, protocol).

- **Option C:** Use the "no endorsement" path — submit and arXiv will assign an administrator to verify. This can take 5-14 days.

- **Option D:** Find endorsers via:
  - https://arxiv.org/endorse — check if you already have endorsement from a co-author's past submissions
  - Academic Twitter / LinkedIn — ask if someone in cryptography/security can endorse you
  - University email — if you have a .edu email, endorsement is easier to get

### 2. Upload

1. Go to https://arxiv.org → **START NEW SUBMISSION**
2. Upload `paper.tex` as the main file
3. Upload `fig-architecture.svg`, `fig-cost-asymmetry.svg`, `fig-engine-results.svg` as figure files
4. Archive: **cs.CR** (Cryptography and Security)
5. Title auto-populates from `\title{}`
6. Authors: **The Continuity Lab**
7. Abstract auto-populates
8. Add `https://www.myshape.com/research` as report number
9. After submission, arXiv assigns ID like `arXiv:2607.XXXXX`

### 3. After Publication

- Add the arXiv ID back to the website (citation badge on research pages)
- Share on X / LinkedIn / Bluesky
- Update the CPS-0001 spec page with arXiv citation

### Notes

- No external dependencies — pure LaTeX, compiles on arXiv's build system
- IEEEtran.cls is standard and available on all arXiv servers
- All figures are SVG (arXiv supports vector graphics)
- If a table or figure doesn't render, check arXiv's TeX log after submission
