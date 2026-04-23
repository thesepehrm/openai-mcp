"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface KeyStatus {
  configured: boolean;
  updatedAt: number | null;
}

function BrandMark() {
  return (
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
  );
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="0.5"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M3 5H2a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 2 16h8a1.5 1.5 0 0 0 1.5-1.5V13"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2.5 8.5L6 12L13.5 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [keyStatus, setKeyStatus] = useState<KeyStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [mcpUrl, setMcpUrl] = useState("/mcp");
  useEffect(() => {
    setMcpUrl(`${window.location.origin}/mcp`);
  }, []);

  useEffect(() => {
    fetch("/api/keys")
      .then((r) => {
        if (r.status === 401) router.push("/login");
        return r.json();
      })
      .then(setKeyStatus)
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveMsg("");
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save");
      } else {
        setSaveMsg("API key saved.");
        setApiKey("");
        setKeyStatus({ configured: true, updatedAt: Date.now() });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Remove your API key? MCP calls will fail until you add a new one.",
      )
    )
      return;
    setDeleting(true);
    try {
      await fetch("/api/keys", { method: "DELETE" });
      setKeyStatus({ configured: false, updatedAt: null });
      setSaveMsg("");
    } finally {
      setDeleting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(mcpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--canvas)" }}>
      {/* ── Header ──────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          background: "var(--surface)",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandMark />
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
          <span
            style={{
              color: "var(--line-strong)",
              fontSize: 16,
              fontWeight: 300,
              marginLeft: 2,
            }}
          >
            /
          </span>
          <span
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              letterSpacing: "-0.01em",
            }}
          >
            Dashboard
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ padding: "5px 12px", fontSize: 13 }}
        >
          Sign out
        </button>
      </header>

      {/* ── Content ─────────────────────────────── */}
      <main
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "32px 24px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Status pill */}
        {keyStatus && (
          <div style={{ marginBottom: 4 }}>
            <span
              className={`pill ${keyStatus.configured ? "pill-ok" : "pill-warn"}`}
            >
              <span className="dot" />
              {keyStatus.configured
                ? `API key configured${
                    keyStatus.updatedAt
                      ? ` · updated ${new Date(keyStatus.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                      : ""
                  }`
                : "No API key — MCP calls will fail"}
            </span>
          </div>
        )}

        {/* ── API Key card ─────────────────────── */}
        <div className="card">
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              margin: "0 0 4px",
            }}
          >
            OpenAI API Key
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              margin: "0 0 16px",
              lineHeight: 1.55,
            }}
          >
            Stored AES-256-GCM encrypted. Used exclusively for your MCP
            sessions.
          </p>

          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <input
              className="field field-mono"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              autoComplete="off"
            />

            {saveMsg && (
              <p style={{ fontSize: 13, color: "var(--ok)", margin: 0 }}>
                {saveMsg}
              </p>
            )}
            {saveError && (
              <p style={{ fontSize: 13, color: "var(--bad)", margin: 0 }}>
                {saveError}
              </p>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                disabled={saving || !apiKey}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {saving
                  ? "Saving…"
                  : keyStatus?.configured
                    ? "Rotate key"
                    : "Save key"}
              </button>
              {keyStatus?.configured && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="btn btn-danger"
                  style={{ padding: "9px 16px" }}
                >
                  {deleting ? "Removing…" : "Remove"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── MCP Connection card ───────────────── */}
        <div className="card">
          <h2
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              margin: "0 0 4px",
            }}
          >
            Connect via MCP
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              margin: "0 0 14px",
              lineHeight: 1.55,
            }}
          >
            Add this URL to your MCP client. OAuth handles authentication
            automatically.
          </p>

          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <div className="code-display" style={{ flex: 1 }}>
              {mcpUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-ghost"
              style={{
                padding: "0 12px",
                flexShrink: 0,
                color: copied ? "var(--ok)" : "var(--ink-2)",
                transition:
                  "color 140ms ease, background 140ms ease, border-color 140ms ease",
              }}
              aria-label={copied ? "Copied" : "Copy MCP URL"}
              title={copied ? "Copied!" : "Copy URL"}
            >
              {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            </button>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "var(--ink-3)",
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            GPT Image 2 tools:{" "}
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ink-2)",
                background: "var(--subtle)",
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              generate_image
            </code>{" "}
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ink-2)",
                background: "var(--subtle)",
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              edit_image
            </code>
          </p>
        </div>
      </main>
    </div>
  );
}
