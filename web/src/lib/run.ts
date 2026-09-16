import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LastRun } from "./types";

export async function loadRun(): Promise<LastRun | null> {
  const file = path.join(process.cwd(), "..", "ui", "last-run.json");
  try {
    return JSON.parse(await readFile(file, "utf8")) as LastRun;
  } catch {
    return null;
  }
}
