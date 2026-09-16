import Board from "./board";
import { loadRun } from "@/lib/run";

export default async function FilePage() {
  const data = await loadRun();
  return <Board initial={data} />;
}
