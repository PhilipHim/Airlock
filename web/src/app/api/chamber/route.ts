import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";
import { previewBody } from "@/lib/preview";

export const runtime = "nodejs";
export const maxDuration = 90;

function previewPython(body: unknown, timeoutMs: number): Promise<unknown> {
  const root = path.resolve(process.cwd(), "..");
  return new Promise((resolve, reject) => {
    const child = spawn("uv", ["run", "python", "-m", "agent.live"], {
      cwd: root,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("gate timeout"));
    }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => {
      out += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      err += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(err.trim() || `gate exit ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error("gate returned invalid json"));
      }
    });
    child.stdin.write(JSON.stringify(body));
    child.stdin.end();
  });
}

async function preview(body: unknown, timeoutMs: number): Promise<unknown> {
  if (!process.env.VERCEL) {
    try {
      return await previewPython(body, timeoutMs);
    } catch {
      // Local uv missing: same door in TypeScript.
    }
  }
  if (!body || typeof body !== "object") {
    throw new Error("Send a JSON body.");
  }
  return previewBody(body as Record<string, unknown>);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body." }, { status: 400 });
  }
  try {
    const asked =
      body && typeof body === "object" && "ask" in body && Boolean((body as { ask?: unknown }).ask);
    const data = await preview(body, asked ? 90000 : 20000);
    if (asked && data && typeof data === "object") {
      const meta = data as { ask?: string; model?: string; ask_error?: string | null };
      console.log(
        `chamber.ask ${meta.ask ?? "?"} model=${meta.model || "-"} error=${meta.ask_error || "none"}`,
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "gate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
