"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  PRESETS,
  type ChamberPreview,
  type InboxItem,
} from "@/lib/chamber";

type Beat = 0 | 1 | 2 | 3 | 4;
type ChamberMood = "idle" | "scan" | "block" | "allow";
type PresetId = (typeof PRESETS)[number]["id"];

function claimOf(payload: Record<string, unknown>) {
  const claim = payload.claim;
  if (typeof claim === "string" && claim.trim()) return claim;
  const ids = payload.customer_ids;
  if (Array.isArray(ids)) return `Raw IDs: ${ids.map(String).join(", ")}`;
  const name = payload.customer_name;
  if (typeof name === "string") return name;
  return JSON.stringify(payload);
}

function stopLine(reason: string | null) {
  if (reason === "IDENTITY_DISCLOSURE") return "Stop. Identity disclosure.";
  if (reason === "RAW_IDENTIFIERS") return "Stop. Raw identifiers.";
  if (reason === "PROHIBITED_FIELDS") return "Stop. Private fields.";
  return reason ? `Stop. ${reason}.` : "Stop.";
}

function titleHit(hit: string) {
  return hit
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function longestUnique(hits: string[]) {
  const unique = [...new Set(hits.map((hit) => hit.toLowerCase()))];
  unique.sort((a, b) => b.length - a.length);
  const kept: string[] = [];
  for (const hit of unique) {
    if (kept.some((prior) => prior.includes(hit))) continue;
    kept.push(hit);
  }
  return kept;
}

function looksLikeAddress(hit: string) {
  return /\d/.test(hit) || hit.includes("straße") || hit.includes("strasse") || hit.includes(",");
}

function flaggedLine(preview: ChamberPreview) {
  const identity = longestUnique(preview.identity_hits || []);
  const names = identity.filter((hit) => !looksLikeAddress(hit)).map(titleHit);
  const addresses = identity.filter(looksLikeAddress);
  const ids = [...new Set((preview.identifier_hits || []).map((hit) => hit.toUpperCase()))];
  const parts: string[] = [];
  if (names.length) parts.push(`name, ${names.join(", ")}`);
  if (ids.length) parts.push(`customer ids, ${ids.join(", ")}`);
  const fields = preview.prohibited_fields;
  if (
    !ids.length &&
    fields.some((field) => field === "customer_id" || field === "customer_ids")
  ) {
    parts.push("customer ids");
  }
  if (addresses.length || fields.some((field) => field.includes("address"))) {
    parts.push("address");
  }
  if (!parts.length && preview.dropped_fields.length) {
    return `Flagged: ${preview.dropped_fields.join(", ")}.`;
  }
  if (!parts.length) return "Flagged: identity.";
  return `Flagged: ${parts.join(". ")}.`;
}

function highlightClaim(text: string, hits: string[]) {
  if (!hits.length) return text;
  const lowered = hits.map((hit) => hit.toLowerCase());
  const pattern = hits
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((hit) => hit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp(`(${pattern})`, "ig");
  const parts = text.split(re);
  return parts.map((part, i) =>
    lowered.includes(part.toLowerCase()) ? (
      <mark key={`${part}-${i}`} className="bg-transparent font-medium text-block">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${i}`}>{part}</span>
    ),
  );
}

export default function DemoBoard() {
  const [text, setText] = useState<string>(PRESETS[0].text);
  const [presetId, setPresetId] = useState<PresetId>("name");
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [modelUsed, setModelUsed] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ChamberPreview | null>(null);
  const [commit, setCommit] = useState<ChamberPreview | null>(null);
  const [beat, setBeat] = useState<Beat>(0);
  const [mood, setMood] = useState<ChamberMood>("idle");
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [search, setSearch] = useState("Anna Müller");
  const [msg, setMsg] = useState("");
  const [closed, setClosed] = useState<string | null>(null);
  const committed = useRef<ChamberPreview | null>(null);

  useEffect(() => {
    if (!preview) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setBeat(4);
      setMood(preview.allowed ? "allow" : "block");
      return;
    }
    setBeat(1);
    setMood("scan");
    const t2 = window.setTimeout(() => setBeat(2), 500);
    const t3 = window.setTimeout(() => setBeat(3), 1100);
    const t4 = window.setTimeout(() => {
      setBeat(4);
      setMood(preview.allowed ? "allow" : "block");
    }, 1700);
    return () => {
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [preview]);

  useEffect(() => {
    if (beat < 4 || !commit?.allowed) return;
    if (committed.current === commit) return;
    committed.current = commit;
    const item: InboxItem = {
      id: `${Date.now()}`,
      claim: claimOf(commit.payload),
      status: "arrived",
      payload: commit.payload,
    };
    setInbox((prev) => [item, ...prev]);
    setCommit(null);
  }, [beat, commit]);

  const hits = useMemo(() => {
    const q = search.trim();
    if (!q) return "";
    const blob = JSON.stringify({ inbox, closed }).toLowerCase();
    const n = blob.split(q.toLowerCase()).length - 1;
    return n === 0 ? `${q}: 0 hits in the shared record.` : `${q}: ${n} hits.`;
  }, [search, inbox, closed]);

  const canClose = inbox.some((item) => item.status === "arrived") && !closed;

  async function send(next?: { text?: string; payload?: Record<string, unknown> }) {
    const body = next?.payload
      ? { payload: next.payload }
      : { text: (next?.text ?? text).trim() };
    if (!("payload" in body) && !body.text) return;
    setBusy(true);
    setAsking(false);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/chamber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ChamberPreview & { error?: string };
      if (!res.ok) {
        setError(data.error || "The gate did not run.");
        return;
      }
      setPreview(data);
      setCommit(data);
      setBeat(0);
    } catch {
      setError("The gate did not run. Start the app from this project.");
    } finally {
      setBusy(false);
    }
  }

  async function askModel(flavor: PresetId) {
    setBusy(true);
    setAsking(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/chamber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ask: "endeavor", case: flavor }),
      });
      const data = (await res.json()) as ChamberPreview & { error?: string };
      if (!res.ok) {
        setError(data.error || "The model call failed.");
        return false;
      }
      if (data.ask_error) {
        setError(data.ask_error);
        return false;
      }
      if (data.draft) setText(data.draft);
      setModelUsed(data.model || "");
      setPreview(data);
      setCommit(data);
      setBeat(0);
      return true;
    } catch {
      setError("The model call failed. Run flwr login supergrid in this terminal.");
      return false;
    } finally {
      setBusy(false);
      setAsking(false);
    }
  }

  async function runPreset(item: (typeof PRESETS)[number]) {
    setPresetId(item.id);
    setText(item.text);
    await askModel(item.id);
  }

  function closeRecord() {
    const item = inbox.find((row) => row.status === "arrived");
    if (!item) return;
    setClosed(item.claim);
    setInbox((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, status: "closed" } : row)),
    );
    setMsg("Record closed.");
  }

  const outgoingText = preview ? claimOf(preview.outgoing) : "";

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <div className="karo" aria-hidden />
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
        <nav className="flex items-center gap-4 rounded-full bg-white px-5 py-2 shadow-[0_10px_28px_rgba(28,25,20,0.12)]">
          <Link href="/" className="font-display text-xl tracking-wide text-accent">
            AIRLOCK
          </Link>
          <Link href="/" className="text-sm font-medium">
            Home
          </Link>
        </nav>
        <p className="text-sm font-medium">The door</p>
      </header>

      <main className="grid flex-1 md:grid-cols-3">
        <section className="border-t border-line px-6 py-8 md:border-r md:px-10">
          <h1 className="font-display text-3xl tracking-wide">Agent A</h1>
          <p className="mt-1 text-sm text-muted">Retailer. Private file.</p>
          <ul className="mt-5 list-disc pl-5">
            <li>Anna Müller</li>
            <li>Peter Schmidt</li>
            <li>Leila Hassan</li>
            <li>Jonas Weber</li>
          </ul>
          <h2 className="mt-8 text-sm font-medium uppercase tracking-[0.14em] text-muted">
            What it tries to send
          </h2>
          {preview ? (
            <p
              className={`mt-3 border-2 px-4 py-3 ${
                preview.allowed ? "border-field text-field" : "border-block"
              }`}
            >
              {highlightClaim(outgoingText, [
                ...preview.identity_hits,
                ...(preview.identifier_hits || []),
              ])}
            </p>
          ) : (
            <p className="mt-3 text-muted">Nothing has left this file yet.</p>
          )}
        </section>

        <section
          className={`border-t border-line px-6 py-8 md:px-10 ${
            mood === "block"
              ? "chamber-block-blink bg-block text-paper"
              : mood === "allow"
                ? "bg-field text-paper"
                : mood === "scan"
                  ? "bg-ink text-paper"
                  : "bg-accent text-paper"
          }`}
        >
          <h2 className="font-display text-3xl tracking-wide">Chamber</h2>
          <p className="mt-1 text-sm text-paper/80">Shared write. Empty until it passes.</p>
          <div className="mt-6 min-h-64 space-y-3" aria-live="polite">
            {beat === 0 && !preview ? (
              <p className="text-paper/80">Propose a sentence.</p>
            ) : null}
            {preview && beat >= 1 && !preview.allowed ? (
              <p className="slip-in border-2 border-paper bg-paper px-4 py-3 font-medium text-block">
                {stopLine(preview.reason)}
              </p>
            ) : null}
            {preview && beat >= 2 && !preview.allowed ? (
              <p className="slip-in border-2 border-paper bg-paper px-4 py-3 font-medium text-block">
                {flaggedLine(preview)}
              </p>
            ) : null}
            {preview && beat >= 3 && preview.allowed ? (
              <p className="slip-in border-2 border-paper bg-paper px-4 py-3 font-medium text-field">
                Clear. {claimOf(preview.payload)}
              </p>
            ) : null}
            {preview && beat >= 4 && !preview.allowed && !preview.file_return ? (
              <p className="slip-in border-2 border-paper/40 px-4 py-3">
                This write stays in File A.
              </p>
            ) : null}
            {preview && beat >= 4 && preview.file_return ? (
              <div className="slip-in space-y-3">
                <p className="border-2 border-paper bg-paper px-4 py-3 font-medium text-field">
                  Agent rewrite: {claimOf(preview.file_return)}
                </p>
                <p className="border-2 border-paper/40 px-4 py-3">
                  Release this to Agent B.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    send({ payload: preview.file_return as Record<string, unknown> })
                  }
                  className="rounded-full bg-paper px-5 py-2 font-medium text-ink"
                >
                  Release the return
                </button>
              </div>
            ) : null}
            {preview && beat >= 4 && preview.allowed ? (
              <p className="slip-in text-sm text-paper/85">
                Sent to Agent B.
              </p>
            ) : null}
            {closed ? (
              <p className="font-medium">Released: {closed}</p>
            ) : null}
          </div>
        </section>

        <section className="border-t border-line px-6 py-8 md:px-10">
          <h2 className="font-display text-3xl tracking-wide">Agent B</h2>
          <p className="mt-1 text-sm text-muted">Supplier. Sees only what the chamber lets through.</p>
          <p className="mt-5">
            Names and customer ids stay in File A.
          </p>
          <h3 className="mt-8 text-sm font-medium uppercase tracking-[0.14em] text-muted">
            What arrives
          </h3>
          <div className="mt-3 space-y-3">
            {inbox.length === 0 ? (
              <p className="text-muted">
                {preview && !preview.allowed
                  ? "Nothing arrived. Sensitive bits stayed in File A."
                  : "Waiting for a sentence."}
              </p>
            ) : (
              inbox.map((item) => (
                <article key={item.id} className="border-2 border-line px-4 py-3">
                  <p className="font-medium">{item.claim}</p>
                  <p className="mt-1 text-sm text-muted">
                    {item.status === "closed"
                      ? "Closed."
                      : "Arrived. Sensitive bits stayed in File A."}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      <div className="karo" aria-hidden />

      <form
        className="sticky bottom-0 bg-paper px-6 py-5 md:px-10"
        onSubmit={(e) => {
          e.preventDefault();
          const preset = PRESETS.find((item) => item.id === presetId);
          if (preset && "payload" in preset && text === preset.text) {
            void send({ payload: { ...preset.payload } });
            return;
          }
          void send({ text });
        }}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={busy}
              onClick={() => void runPreset(item)}
              className={`rounded-full border px-4 py-1 text-sm disabled:opacity-40 ${
                presetId === item.id
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-white"
              }`}
            >
              {asking && presetId === item.id ? "Asking" : item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="min-w-60 flex-1">
            <span className="sr-only">Propose from Agent A</span>
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setPresetId("name");
              }}
              placeholder="Propose a sentence from Agent A"
              className="w-full rounded-full border border-line bg-white px-5 py-3 text-ink"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-accent px-6 py-3 font-medium text-paper disabled:opacity-40"
          >
            {asking ? "Asking" : busy ? "Gating" : "Propose"}
          </button>
          <button
            type="button"
            disabled={!canClose}
            onClick={closeRecord}
            className="rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-40"
          >
            Close record
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <label className="text-muted">
            Search shared
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2 rounded-full border border-line bg-white px-3 py-1 text-ink"
            />
          </label>
          <span className="font-medium">{hits}</span>
          <span className="text-muted">{msg}</span>
          <span className="text-muted">
            {modelUsed ? `Wrote with ${modelUsed}.` : "The door. Same Python policy."}
          </span>
          {error ? <span className="text-block">{error}</span> : null}
        </div>
      </form>
    </div>
  );
}
