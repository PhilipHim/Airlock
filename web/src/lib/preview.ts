import { inspect, redactClaim, scan, SHAREABLE_RETURN } from "./gate";
import type { ChamberPreview } from "./chamber";

const BATCH = "BAT-042";

const DRAFTS: Record<string, string> = {
  name: "Anna Müller returned the earbuds. Battery swollen.",
  ids: "Customer C-1001 returned the earbuds. Battery swollen.",
  return: "A customer returned the earbuds. Battery swollen.",
};

function aboutThisIncident(payload: Record<string, unknown>) {
  if ("customer_ids" in payload || "customer_name" in payload) return true;
  const blob = JSON.stringify(payload).toLowerCase();
  return blob.includes(BATCH.toLowerCase()) || blob.includes("return") || blob.includes("battery swollen");
}

function fileReturn(
  payload: Record<string, unknown>,
  alternative: string | null,
): Record<string, unknown> | null {
  if (alternative !== "batch_return" && alternative !== "aggregate_count") return null;
  const base = { ...SHAREABLE_RETURN };
  const claim = payload.claim;
  if (typeof claim === "string" && claim.trim()) {
    const redacted = redactClaim(claim);
    if (redacted) {
      const ticket = { ...base, claim: redacted };
      if (inspect(ticket).allowed) return ticket;
    }
  }
  return base;
}

export function previewBody(body: Record<string, unknown>): ChamberPreview {
  let payload: Record<string, unknown>;
  let asked: "endeavor" | null = null;
  let draft = "";
  let model = "";

  if (body.ask) {
    const flavor = String(body.case || "name");
    draft = DRAFTS[flavor] || DRAFTS.name;
    payload = { id: "live", from_org: "org_a", claim: draft };
  } else if (body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)) {
    payload = body.payload as Record<string, unknown>;
  } else {
    const text = String(body.text || body.claim || "").trim().slice(0, 800);
    payload = { id: "live", from_org: "org_a", claim: text };
  }

  const decision = inspect(payload);
  const result = scan(payload);
  const claim = payload.claim;
  const claimOnly = Object.keys(payload).every((key) =>
    ["id", "from_org", "claim"].includes(key),
  );
  let blockedMotion: Record<string, unknown> | null = null;
  if (claimOnly && typeof claim === "string" && claim.trim() && !decision.allowed) {
    blockedMotion = {
      id: "m0",
      from_org: "org_a",
      status: "blocked",
      reason: decision.reason,
      allowed_alternative: decision.allowed_alternative,
      source: undefined,
    };
  }

  const allowedPayload = result.allowed ? result.payload : {};
  const batchId = allowedPayload.batch_id;
  const canSecond = result.allowed && batchId === BATCH;

  if (body.ask) asked = "endeavor";

  return {
    ...result,
    decision: decision.allowed
      ? { blocked: false, ...decision.payload }
      : {
          blocked: true,
          reason: decision.reason,
          allowed_alternative: decision.allowed_alternative,
        },
    outgoing: payload,
    blocked_motion: blockedMotion,
    file_return:
      decision.allowed || !aboutThisIncident(payload)
        ? null
        : fileReturn(payload, decision.allowed_alternative),
    agent_b_can_second: canSecond,
    agent_b_has_batch: true,
    ask: asked,
    model,
    draft,
    ask_error: null,
  };
}
