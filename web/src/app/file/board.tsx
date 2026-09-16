"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LastRun, Motion } from "@/lib/types";

function motionLine(m: Motion) {
  if (m.source === "model" && m.status === "blocked") {
    return (
      <p key={m.id} className="font-medium text-block">
        Model blocked: {m.reason}. Alternative: {m.allowed_alternative}.
      </p>
    );
  }
  if (m.status === "blocked") {
    return (
      <p key={m.id} className="font-medium text-block">
        Block {m.id}: {m.reason}. Alternative: {m.allowed_alternative}.
      </p>
    );
  }
  if (m.status === "seconded") {
    return (
      <p key={m.id} className="font-medium text-field">
        {m.claim} Seconded.
      </p>
    );
  }
  if (m.status === "moved") {
    return (
      <p key={m.id}>
        {m.claim || m.id} Waiting for a second.
      </p>
    );
  }
  if (m.status === "objected") {
    return (
      <p key={m.id} className="font-medium text-block">
        {m.id} no second.
      </p>
    );
  }
  return <p key={m.id}>{m.id}</p>;
}

export default function Board({ initial }: { initial: LastRun | null }) {
  const [data, setData] = useState<LastRun | null>(initial);
  const [q, setQ] = useState("Anna Müller");
  const [msg, setMsg] = useState("");

  const step = useMemo(() => {
    if (!data) return "private";
    if (data.public_record?.length) return "shared";
    if (data.motions.some((m) => m.status === "seconded")) return "release";
    if (data.motions.some((m) => m.status === "blocked")) return "airlock";
    return "private";
  }, [data]);

  const hits = useMemo(() => {
    if (!data || !q.trim()) return "";
    const n =
      data.audit && data.audit[q] != null
        ? data.audit[q]
        : JSON.stringify({
            motions: data.motions,
            public_record: data.public_record,
            standing_orders: data.standing_orders,
          })
            .toLowerCase()
            .split(q.toLowerCase()).length - 1;
    return n === 0
      ? `${q}: 0 hits in Context.`
      : `${q}: ${n} hits.`;
  }, [data, q]);

  const canRelease =
    !!data &&
    !data.public_record?.length &&
    data.motions.some((m) => m.status === "seconded");

  function closeRecord() {
    if (!data) return;
    const seconded = data.motions.find((m) => m.status === "seconded");
    if (!seconded) return;
    setData({
      ...data,
      public_record: [
        {
          id: seconded.id,
          claim: seconded.claim || "",
          batch_id: seconded.batch_id,
          product_type: seconded.product_type,
        },
      ],
    });
    setMsg("Record closed.");
  }

  const steps = [
    { id: "private", label: "Private" },
    { id: "airlock", label: "Airlock" },
    { id: "release", label: "Human release" },
    { id: "shared", label: "Shared" },
  ] as const;

  return (
    <div className="min-h-screen bg-paper">
      <div className="karo" aria-hidden />
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
        <nav className="flex items-center gap-4 rounded-full bg-white px-5 py-2 shadow-[0_10px_28px_rgba(28,25,20,0.12)]">
          <Link href="/" className="font-display text-xl tracking-wide text-accent">
            AIRLOCK
          </Link>
          <Link href="/" className="text-sm font-medium">
            Home
          </Link>
          <Link href="/demo" className="text-sm font-medium">
            Live demo
          </Link>
        </nav>
        <p className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-muted">
          {steps.map((item) => (
            <span
              key={item.id}
              className={step === item.id ? "border-b-2 border-accent text-ink" : ""}
            >
              {item.label}
            </span>
          ))}
        </p>
      </header>

      {!data ? (
        <p className="px-6 text-block md:px-10">
          No run loaded. In the project folder: uv run python -m agent.demo
        </p>
      ) : (
        <main className="grid gap-10 px-6 py-6 md:grid-cols-3 md:px-10">
          <section>
            <h1 className="font-display text-2xl tracking-wide">File A · Retailer</h1>
            <p className="mt-1 text-sm text-muted">Only Agent A sees the names.</p>
            <p className="mt-3">
              {data.org_a.product}. Batch {data.org_a.batch}.
            </p>
            <ul className="mt-3 list-disc pl-5">
              {data.org_a.private_names.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
          <section className="border-t-2 border-ink pt-4 md:border-t-0 md:pt-0">
            <h2 className="font-display text-2xl tracking-wide">Shared channel</h2>
            <div className="mt-3 space-y-2">
              {data.motions.map(motionLine)}
              {data.public_record?.length ? (
                <p className="font-medium text-field">
                  Released: {data.public_record.map((p) => p.claim).join(" ")}
                </p>
              ) : data.motions.some((m) => m.status === "seconded") ? (
                <p className="text-muted">
                  No shared record yet. A human has to close it.
                </p>
              ) : null}
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl tracking-wide">File B · Supplier</h2>
            <p className="mt-1 text-sm text-muted">Only Agent B sees its factory lots.</p>
            <p className="mt-3">
              {data.org_b.product}. Batch {data.org_b.batch}.
            </p>
            <p>{data.org_b.private_count} lots of this batch in its factory file.</p>
          </section>
        </main>
      )}

      <div className="flex flex-wrap items-center gap-4 px-6 py-8 md:px-10">
        <button
          type="button"
          disabled={!canRelease}
          onClick={closeRecord}
          className="rounded-full bg-accent px-5 py-3 font-medium text-paper disabled:opacity-40"
        >
          Close record
        </button>
        <label className="text-sm text-muted">
          Search context
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ml-2 rounded-full border border-line bg-white px-4 py-2 text-ink"
          />
        </label>
        <span className="font-medium">{hits}</span>
        <span className="text-muted">{msg}</span>
      </div>
    </div>
  );
}
