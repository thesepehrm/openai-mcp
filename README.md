# OpenAI MCP Server

Self-hosted MCP server that exposes OpenAI APIs as tools for any MCP client (Claude, Cursor, etc.). Each user authenticates via a small web UI, stores their own OpenAI API key (AES-256-GCM encrypted), then connects their MCP client via full OAuth 2.1 with PKCE — no shared keys, no cross-user access.

GPT Image 2 is the first feature — more OpenAI APIs to follow.

## Features

### GPT Image 2

- **`generate_image`** — text-to-image with gpt-image-2 (size, quality, format, background)
- **`edit_image`** — edit an existing image with a prompt + optional mask

### Infrastructure

- **OAuth 2.1** — full spec-compliant AS: DCR (RFC 7591), PKCE S256, rotating refresh tokens, audience binding (RFC 8707)
- **Encrypted key storage** — AES-256-GCM, master key in env, never logged
- **Self-contained** — single Docker image, SQLite, no external services

## Stack

- Next.js 15 App Router (TypeScript)
- SQLite via `better-sqlite3`
- `@modelcontextprotocol/sdk` — Streamable HTTP transport (web-standard)
- `openai` SDK, `argon2id`, `iron-session`, `jose`

---

## Local development

### 1. Install dependencies

```bash
npm install
```

> Requires Node.js 22+. Native modules (`better-sqlite3`, `argon2`) are compiled during install.

### 2. Generate secrets

```bash
npm run setup
```

Creates `.env.local` with random `MASTER_ENC_KEY`, `JWT_SECRET`, and `SESSION_SECRET`. Safe to re-run — skips if the file already exists.

### 3. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) → sign up → add your OpenAI API key on the dashboard.

### 4. Connect an MCP client

In Claude (or any MCP client), add a remote MCP server:

```text
http://localhost:3000/mcp
```

The client triggers the OAuth flow — a browser window opens, you log in, grant access, and the client receives a token automatically.

---

## Deployment (Docker)

### Environment variables

| Variable         | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| `APP_URL`        | Public URL, no trailing slash. e.g. `https://mcp.example.com`       |
| `MASTER_ENC_KEY` | 32-byte base64 key for AES-256-GCM encryption of API keys           |
| `JWT_SECRET`     | 32-byte base64 key for signing OAuth access tokens                  |
| `SESSION_SECRET` | String secret for iron-session cookies                              |
| `DB_PATH`        | SQLite file path (default `/data/app.db`)                           |
| `OUTPUTS_DIR`    | Directory for generated image files (default `/data/outputs`)       |
| `ALLOW_SIGNUP`   | `true` to allow new registrations, `false` to lock (default `true`) |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# run 3× for MASTER_ENC_KEY, JWT_SECRET, SESSION_SECRET
```

### Docker Compose

```bash
cp .env.example .env
# fill in the secrets
docker compose up --build
```

The compose file mounts two named volumes:

- `sqlite_data` → `/data` — SQLite database
- `outputs_data` → `/data/outputs` — generated images served at `/outputs/<filename>`

After your first login, set `ALLOW_SIGNUP=false` to prevent new registrations.

---

## MCP tools

### `generate_image`

Generates one or more images from a text prompt.

| Parameter       | Type                                                | Default  | Description        |
| --------------- | --------------------------------------------------- | -------- | ------------------ |
| `prompt`        | string                                              | required | Image description  |
| `size`          | `auto` \| `1024x1024` \| `1536x1024` \| `1024x1536` | `auto`   | Dimensions         |
| `n`             | 1–4                                                 | `1`      | Number of images   |
| `output_format` | `png` \| `webp` \| `jpeg`                           | `png`    | File format        |
| `background`    | `auto` \| `transparent` \| `opaque`                 | `auto`   | Background type    |
| `quality`       | `low` \| `medium` \| `high`                         | `medium` | Generation quality |

### `edit_image`

Edits an existing image using a prompt and optional mask.

| Parameter       | Type          | Default  | Description                                       |
| --------------- | ------------- | -------- | ------------------------------------------------- |
| `prompt`        | string        | required | Description of changes                            |
| `image`         | string        | required | Base64-encoded image (PNG/WebP/JPEG)              |
| `mask`          | string        | —        | Base64-encoded PNG mask (transparent = edit area) |
| `size`          | same as above | `auto`   | Output dimensions                                 |
| `output_format` | same as above | `png`    | Output format                                     |
| `quality`       | same as above | `medium` | Quality                                           |
| `n`             | 1–4           | `1`      | Number of variants                                |

---

## OAuth flow

The server implements the [MCP 2025-06-18 authorization spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization):

1. Client hits `POST /mcp` → `401` with `WWW-Authenticate` pointing to `/.well-known/oauth-protected-resource`
2. Client fetches `/.well-known/oauth-authorization-server` (RFC 8414)
3. Client registers via `POST /oauth/register` (RFC 7591 DCR)
4. Client opens browser to `/oauth/authorize` with PKCE S256 + `resource` parameter
5. User logs in and grants access on the consent page
6. Client exchanges code at `POST /oauth/token`
7. Access token (JWT, 1h) + refresh token (30d, rotated on use) issued
8. All `/mcp` requests carry `Authorization: Bearer <token>`

---

## Tests

```bash
npm test                # run once
npm run test:watch      # watch mode
npm run test:coverage   # coverage report
```

32 tests covering: AES-256-GCM crypto, argon2 auth, PKCE S256, JWT access tokens, refresh token rotation, DCR client registration, OAuth metadata endpoints.

---

## Security notes

- API keys are never stored in plaintext — only AES-256-GCM ciphertext + IV + auth tag
- `MASTER_ENC_KEY` rotation requires a manual re-encrypt of all rows (not automated in v1)
- Access tokens are audience-bound to `$APP_URL/mcp` — tokens issued for other services are rejected
- PKCE is mandatory (S256 only, `plain` is rejected)
- Refresh tokens rotate on every use — replayed tokens return 400
- Set `ALLOW_SIGNUP=false` after initial setup to prevent new accounts
