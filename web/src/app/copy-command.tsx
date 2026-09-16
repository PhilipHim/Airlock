"use client";

import { useState } from "react";

export default function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
      <pre className="overflow-x-auto whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-ink">
        {command}
      </pre>
      <button
        type="button"
        onClick={() => void copy()}
        className="w-full border-t border-line bg-accent px-5 py-3 text-sm font-medium text-paper"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
