---
name: myshape-patterns
description: Coding patterns extracted from MyShape Protocol repository — commit conventions, CSS architecture, component patterns, brand compliance
version: 1.0.0
source: local-git-analysis
analyzed_commits: 200
---

# MyShape Protocol — Repository Patterns

> Auto-generated from 200 commits of git history. Teaches AI agents the team's conventions.

## Commit Conventions

This project uses **conventional commits** with strict enforcement:

| Type | Count | Usage |
|------|-------|-------|
| `fix:` | 77 | Bug fixes, CSS fixes, click-through, deploy issues |
| `feat:` | 66 | New features, components, infrastructure |
| `refactor:` | 37 | Code quality, CSS extraction, component splitting |
| `chore:` | 14 | Maintenance, daemon state, brand compliance |
| `docs:` | 2 | Documentation |
| `security:` | 1 | Security hardening |

**Rule**: Every commit must pass brand compliance hook. Banned terms: gendered, corporeal, bio-identification.

## Code Architecture

```
src/
├── app/                    # 74 Next.js App Router pages
│   ├── page.tsx            #   Server Component (metadata + JSON-LD)
│   └── *Client.tsx         #   Client Component ("use client", interactive)
├── components/             # 94 reusable components
│   ├── component-name/     #   Co-located: .tsx + .css
│   │   ├── Component.tsx
│   │   └── component.css
├── hooks/                  # Custom React hooks (use*.ts)
├── lib/                    # Pure utilities, API contracts, schemas
├── protocol/               # Protocol constants, thresholds
├── styles/
│   └── animations.css      # ALL @keyframes — single source of truth
└── types/                  # TypeScript type definitions (readonly, strict)
```

## CSS Architecture (CRITICAL)

**Anti-patterns — NEVER use:**
- ❌ `data-hover` attributes + `hoverOn()`/`hoverOff()` JS functions
- ❌ `querySelector` style manipulation in event handlers
- ❌ `<style>` tags in components
- ❌ `!important`
- ❌ Inline `style={{}}` for static values (dynamic OK)

**Required patterns:**
- ✅ Dedicated `.css` file per component group
- ✅ CSS `:hover` selectors for all hover effects (GPU-accelerated)
- ✅ CSS custom properties (`var(--accent-ice)`, `var(--accent-gold)`)
- ✅ Transition: `0.35s cubic-bezier(0.4, 0, 0.2, 1)` for consistent feel
- ✅ Tailwind for layout/spacing; CSS for styling/hover/animation
- ✅ `@keyframes` → `src/styles/animations.css` ONLY

### Standard Hover Pattern

```css
/* Card hover — every interactive surface uses this */
.my-card {
  border: 1px solid rgba(144,200,255,0.1);
  background: transparent;
  transition: border-color 0.35s cubic-bezier(0.4,0,0.2,1),
              transform 0.35s cubic-bezier(0.4,0,0.2,1),
              box-shadow 0.35s cubic-bezier(0.4,0,0.2,1);
}
.my-card:hover {
  border-color: rgba(144,200,255,0.35);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px -4px rgba(144,200,255,0.1);
}
.my-card:hover .my-card-title { color: rgba(255,255,255,0.95); }
.my-card:hover .my-card-desc  { color: rgba(255,255,255,0.5); font-size: 10.5px; }
```

## Component Patterns

### Server/Client Split

Every route follows this pattern:

```tsx
// page.tsx — Server Component
export const metadata: Metadata = { title: "...", description: "..." };
export default function Page() {
  return (
    <>
      <BreadcrumbList ... />
      <script type="application/ld+json">...</script>
      <PageClient />
    </>
  );
}

// PageClient.tsx — Client Component
"use client";
import "./page.css";
export default function PageClient() { ... }
```

### Component File Structure

```
components/my-feature/
  MyFeature.tsx       # Main component
  SubComponent.tsx    # Extracted sub-components
  my-feature.css      # All styles (NO inline, NO <style>)
  types.ts            # Shared interfaces
```

## Brand Compliance

**Pre-commit hook scans for banned terms.** Blocked word categories include:
- B-- (biological recognition terminology)
- F-- (appearance-related descriptors)
- C-- (physical form references)
- Any gendered or appearance-judgment terms

**Approved replacements:**
- `static-feature recognition` instead of B-words
- `entity`, `silhouette`, `wireframe anatomy`
- `ethereal data energy`, `non-binary aesthetic`

**CSS class names are also scanned** — avoid physical-form or recognition-related stems in class names.

## Workflows

### Adding a New Page
1. Create `src/app/page-name/page.tsx` (Server — metadata + JSON-LD)
2. Create `src/app/page-name/PageClient.tsx` ("use client")
3. Create `src/app/page-name/page-name.css` if needed
4. Add JSON-LD structured data
5. Add BreadcrumbList

### Refactoring a Component
1. Extract inline `style={{}}` → CSS classes
2. Replace `hoverOn`/`hoverOff` → CSS `:hover`
3. Remove `<style>` tags → `animations.css` global file
4. Run `npx tsc --noEmit` (0 errors required)
5. Run `npx vitest run` (309 tests must pass)
6. Commit with `refactor:` prefix

### Deploying
1. Push to both remotes: `git push origin master && git push org master`
2. Vercel auto-deploys from `org` (myshapeprotocol/myshape-protocol)
3. Verify at myshape.com

## Testing

- **Framework**: Vitest
- **Tests**: 309 passing, 21 test files
- **Snapshot**: 3,282 lines locking 4 approximation functions
- **CI rule**: Snapshot mismatch + no changelog entry = BLOCKED
- **Location**: `src/__tests__/` with `__snapshots__/` directory

## Design Tokens

```css
--accent-ice:   #90c8ff   /* Primary — borders, highlights */
--accent-cyan:  #22d3ee   /* Active states */
--accent-gold:  #d4af37   /* Genesis, premium */
--accent-amber: #d2991d   /* Warnings, milestones */
--semantic-success: #3fb950
```

## Frequent Change Files

These files change most often — expect them in refactors:
- `MotionDemoClient.tsx` (24 changes) — Hero particle animation
- `PresenceNetwork.tsx` (20) — Network visualization
- `HomeClient.tsx` (19) — Homepage layout
- `ProtocolStatus.tsx` (18) — Status bar
- `GenesisClient.tsx` (16) — Genesis flow
- `header.tsx` (14) — Global navigation
- `footer.tsx` (12) — Global footer
