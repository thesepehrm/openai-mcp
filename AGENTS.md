<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Design Context

### Users

Developers self-hosting the server for personal use or sharing with a small technical team. Also serves as a public open-source showcase — first impressions matter. Users are comfortable with OAuth flows, Docker, and API keys. They land on login/signup once, then spend most time on the dashboard.

### Brand Personality

Precise, open, self-reliant. The interface should feel like a well-built tool — confident without being loud, technical without being cold.

### Aesthetic Direction

Light theme. Bright, minimal, and colorful via a single warm amber accent (`oklch(70% 0.17 68)`). Off-white warm canvas backgrounds, near-black text with a slight cool tint, clean card layouts. Split-panel auth pages (dark left brand panel, light right form). No gradients, no glassmorphism, no border-left accent stripes.

Fonts: **Onest** (headings and UI copy) + **JetBrains Mono** (API keys, code, monospace displays). Both loaded via `next/font/google`.

### Design Principles

1. **One accent, used sparingly** — amber appears on CTAs, focus rings, and the brand mark only. Everywhere else is neutral.
2. **Left-align, varied spacing** — no identical padding everywhere; hierarchy through space.
3. **No border-left stripes** — status communicated via pill badges with full borders.
4. **Typography does the work** — size/weight contrast over decorative elements.
5. **Functional delight** — copy button, focus rings, hover shadows. Micro-interactions serve the task.

### Token Reference

See `src/app/globals.css` for the full CSS variable set. Key tokens:

- `--canvas` / `--surface` / `--subtle` — surface hierarchy
- `--line` / `--line-strong` — borders
- `--ink` / `--ink-2` / `--ink-3` — text hierarchy
- `--amber` / `--amber-hover` / `--amber-ink` — accent
- `--panel` / `--panel-edge` / `--panel-ink` / `--panel-dim` — dark left panel
- `--ok-*` / `--bad-*` / `--warn-*` — semantic states

### Component Classes

Defined in `globals.css` `@layer components`:

- `.field` / `.field-mono` — inputs with amber focus ring
- `.btn .btn-primary` — amber CTA
- `.btn .btn-ghost` — neutral secondary
- `.btn .btn-danger` — neutral → red on hover
- `.card` — surface card with border
- `.code-display` — monospace URL/code display
- `.pill .pill-ok .pill-warn` — status badges
