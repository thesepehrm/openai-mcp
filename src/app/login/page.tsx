"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const FEATURES = [
  {
    name: "OAuth 2.1 + PKCE",
    detail: "Full spec-compliant authorization server",
  },
  {
    name: "AES-256-GCM encryption",
    detail: "Your API key encrypted at rest, never logged",
  },
  {
    name: "GPT Image 2",
    detail: "generate_image · edit_image as MCP tools",
  },
  {
    name: "Docker-ready",
    detail: "Single image · SQLite · no external services",
  },
];

function BrandMark({ size = 28 }: { size?: number }) {
  const h = Math.round(size * 0.57);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 28 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="0.75"
        y="0.75"
        width="11.5"
        height="14.5"
        rx="3.25"
        fill="var(--amber)"
      />
      <path
        d="M12.25 8H15.75"
        stroke="var(--panel-edge)"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect
        x="15.75"
        y="0.75"
        width="11.5"
        height="14.5"
        rx="3.25"
        fill="var(--amber)"
        opacity="0.35"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, action: "login" }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Login failed");
      else router.push(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100dvh",
      }}
    >
      {/* ── Left panel ──────────────────────────── */}
      <aside
        className="hidden lg:flex"
        style={{
          width: 360,
          flexShrink: 0,
          flexDirection: "column",
          background: "var(--panel)",
          borderRight: "1px solid var(--panel-edge)",
          padding: "48px 40px",
        }}
      >
        {/* Brand */}
        <div style={{ marginBottom: 44 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <BrandMark size={28} />
            <span
              style={{
                color: "var(--panel-ink)",
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: "-0.015em",
              }}
            >
              OpenAI MCP
            </span>
          </div>
          <p
            style={{
              color: "var(--panel-dim)",
              fontSize: 13.5,
              lineHeight: 1.65,
              margin: 0,
              maxWidth: 270,
            }}
          >
            Self-hosted Model Context Protocol server. Connect any MCP client to
            OpenAI APIs using your own key.
          </p>
        </div>

        {/* Features */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
          role="list"
        >
          {FEATURES.map(({ name, detail }) => (
            <div
              key={name}
              role="listitem"
              style={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              <span
                style={{
                  color: "var(--panel-ink)",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                }}
              >
                {name}
              </span>
              <span style={{ color: "var(--panel-dim)", fontSize: 12 }}>
                {detail}
              </span>
            </div>
          ))}
        </div>

        {/* Footer accent */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingTop: 40,
          }}
        >
          <div
            style={{
              width: 24,
              height: 2,
              background: "var(--amber)",
              borderRadius: 1,
            }}
          />
          <span style={{ color: "var(--panel-dim)", fontSize: 11 }}>
            v0.1 · MIT license
          </span>
        </div>
      </aside>

      {/* ── Right: form ─────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          background: "var(--canvas)",
        }}
      >
        <div style={{ width: "100%", maxWidth: 372 }}>
          {/* Mobile-only brand */}
          <div className="lg:hidden" style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg
                width="22"
                height="13"
                viewBox="0 0 28 16"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="0.75"
                  y="0.75"
                  width="11.5"
                  height="14.5"
                  rx="3.25"
                  fill="var(--amber)"
                />
                <path
                  d="M12.25 8H15.75"
                  stroke="var(--line-strong)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <rect
                  x="15.75"
                  y="0.75"
                  width="11.5"
                  height="14.5"
                  rx="3.25"
                  fill="var(--amber)"
                  opacity="0.35"
                />
              </svg>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: "-0.015em",
                  color: "var(--ink)",
                }}
              >
                OpenAI MCP
              </span>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
                margin: "0 0 6px",
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                color: "var(--ink-2)",
                fontSize: 14,
                margin: 0,
              }}
            >
              Sign in to manage your API key
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink-2)",
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                id="email"
                className="field"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink-2)",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                id="password"
                className="field"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  background: "var(--bad-pale)",
                  border: "1px solid var(--bad-edge)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: "var(--bad)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 4 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "var(--ink-3)",
              marginTop: 24,
            }}
          >
            No account?{" "}
            <Link
              href="/signup"
              style={{
                color: "var(--amber-hover)",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
