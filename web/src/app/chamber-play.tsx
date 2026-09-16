"use client";

import { useEffect, useState } from "react";

type Scene = "leak" | "clear";
type Beat = 0 | 1 | 2 | 3 | 4;

export default function ChamberPlay() {
  const [scene, setScene] = useState<Scene>("leak");
  const [beat, setBeat] = useState<Beat>(0);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (runId === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const end: Beat = scene === "leak" ? 4 : 3;
    if (reduced) {
      setBeat(end);
      return;
    }
    setBeat(1);
    const timers =
      scene === "leak"
        ? [
            window.setTimeout(() => setBeat(2), 1100),
            window.setTimeout(() => setBeat(3), 2300),
            window.setTimeout(() => setBeat(4), 3600),
          ]
        : [
            window.setTimeout(() => setBeat(2), 1100),
            window.setTimeout(() => setBeat(3), 2300),
          ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [runId, scene]);

  function run() {
    setBeat(0);
    setRunId((n) => n + 1);
  }

  function goClear() {
    setScene("clear");
    setBeat(0);
    setRunId((n) => n + 1);
  }

  function goLeak() {
    setScene("leak");
    setBeat(0);
    setRunId(0);
  }

  const leakOn = scene === "leak" && beat >= 1;
  const orderOn = scene === "leak" && beat >= 2;
  const countOn =
    scene === "leak" ? beat >= 3 : beat >= 1;
  const proofOn = scene === "leak" ? beat >= 4 : beat >= 3;
  const allClear = scene === "clear" && beat >= 2;

  return (
    <section id="incident" className="bg-paper">
      <div className="flex flex-wrap items-end justify-between gap-6 px-6 pt-16 md:px-10">
        <div>
          <h2 className="font-display text-4xl tracking-wide md:text-6xl">
            {scene === "leak" ? "Watch the leak stop." : "No names crossed."}
          </h2>
          <p className="mt-3 max-w-xl text-lg">
            {scene === "leak"
              ? "Agent A tries to send a name. The chamber refuses. The next run sends only the count."
              : "The standing order already holds. Agent A sends only the count. All clear."}
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          className="rounded-full bg-accent px-7 py-4 font-medium text-paper"
        >
          {beat === 0 && runId === 0 ? "Run the incident" : "Run it again"}
        </button>
      </div>

      <div className="relative mt-10">
        <div className="grid md:grid-cols-3">
          <article className="border-t border-line px-6 py-10 md:border-r md:px-10">
            <h3 className="font-display text-3xl tracking-wide">File A</h3>
            <p className="mt-1 text-sm text-muted">Retailer. Private.</p>
            <ul className="mt-5 list-disc pl-5">
              <li>Anna Müller</li>
              <li>Peter Schmidt</li>
              <li>Leila Hassan</li>
            </ul>
            {scene === "leak" ? (
              <p
                className={`slip mt-8 border-2 px-4 py-3 ${
                  leakOn && !countOn
                    ? "slip-gone border-block text-block"
                    : "border-line"
                }`}
              >
                Anna Müller is affected by BAT-042.
              </p>
            ) : (
              <p className="mt-8 text-sm text-muted">
                The name stays in this file. It is not offered.
              </p>
            )}
            <p
              className={`slip mt-3 border-2 border-field px-4 py-3 text-field ${
                countOn ? "slip-gone" : "slip-wait"
              }`}
            >
              2 customers overlap on BAT-042.
            </p>
          </article>

          <article
            className={`border-t border-line px-6 py-10 md:px-10 ${
              allClear
                ? "bg-field text-paper"
                : proofOn
                  ? "bg-ink text-paper"
                  : "bg-accent text-paper"
            }`}
          >
            <h3 className="font-display text-3xl tracking-wide">Chamber</h3>
            <p className="mt-1 text-sm text-paper/80">
              Shared write. Empty until it passes.
            </p>
            <div className="mt-6 min-h-48 space-y-3" aria-live="polite">
              {beat === 0 ? (
                <p className="text-paper/80">
                  {scene === "clear"
                    ? "Standing order already in force."
                    : "Nothing has crossed."}
                </p>
              ) : null}
              {leakOn ? (
                <p className="slip-in border-2 border-paper bg-paper px-4 py-3 font-medium text-block">
                  Stop. Name stays in File A.
                </p>
              ) : null}
              {orderOn ? (
                <p className="slip-in border-2 border-paper/40 px-4 py-3">
                  Standing order: do not send identity again.
                </p>
              ) : null}
              {countOn ? (
                <p className="slip-in border-2 border-paper bg-paper px-4 py-3 font-medium text-field">
                  2 customers overlap on BAT-042. Seconded.
                </p>
              ) : null}
              {allClear ? (
                <p className="slip-in font-medium">No names crossed. All clear.</p>
              ) : null}
              {proofOn ? (
                <p className="font-display text-7xl leading-none tracking-wide">0</p>
              ) : null}
              {proofOn ? <p>Anna Müller in Context: 0 hits.</p> : null}
            </div>
          </article>

          <article className="border-t border-line px-6 py-10 md:px-10">
            <h3 className="font-display text-3xl tracking-wide">File B</h3>
            <p className="mt-1 text-sm text-muted">Supplier. Private.</p>
            <p className="mt-5">3 hits on batch BAT-042 in its own list.</p>
            <p
              className={`mt-8 text-lg font-medium ${
                orderOn
                  ? "text-block"
                  : allClear || countOn
                    ? "text-field"
                    : "text-muted"
              }`}
            >
              {orderOn
                ? "Stop. You sent a name. Never again."
                : allClear || countOn
                  ? "Count matches. Seconded."
                  : "Waiting for a claim it can second."}
            </p>
          </article>
        </div>

        {scene === "leak" ? (
          <button
            type="button"
            onClick={goClear}
            aria-label="Next play. All clear."
            className="absolute right-3 top-[calc(50%+1.5rem)] z-10 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl leading-none text-paper md:-right-2 md:top-1/2 md:-translate-y-1/2"
          >
            →
          </button>
        ) : (
          <button
            type="button"
            onClick={goLeak}
            aria-label="Back to the leak."
            className="absolute left-3 top-[calc(50%+1.5rem)] z-10 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-3xl leading-none text-paper md:-left-2 md:top-1/2 md:-translate-y-1/2"
          >
            ←
          </button>
        )}
      </div>

      <p className="px-6 py-8 text-sm text-muted md:px-10">
        {scene === "leak"
          ? "This replay matches SuperGrid run 13311565059047633796. Endeavor proposed. Python gated. Open the file to search the Context."
          : "The standing order held. No identity left File A. The count still crossed."}
      </p>
    </section>
  );
}
