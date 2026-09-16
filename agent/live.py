"""Live demo helper. Gate still decides. Private files stay in this process."""

from __future__ import annotations

import json
import sys
from typing import Any

from agent.gate import inspect, redact_claim, scan
from agent.orgs import aggregate_count, has_batch, shareable_return
from agent.propose import ask as ask_model
from agent.roles import BATCH, empty_state, gate_model_proposal


def _about_this_incident(payload: dict[str, Any]) -> bool:
    if "customer_ids" in payload or "customer_name" in payload:
        return True
    blob = json.dumps(payload, ensure_ascii=False).lower()
    if BATCH.lower() in blob:
        return True
    return "return" in blob or "battery swollen" in blob


def _strip_flagged(claim: str) -> str:
    return redact_claim(claim)


def _next_shareable(alternative: str | None) -> dict[str, Any] | None:
    if alternative == "batch_return":
        return shareable_return("org_a", BATCH)
    if alternative == "aggregate_count":
        return aggregate_count("org_a", BATCH)
    return None


def _file_return(
    payload: dict[str, Any], alternative: str | None
) -> dict[str, Any] | None:
    base = _next_shareable(alternative)
    if not base:
        return None
    claim = payload.get("claim")
    if isinstance(claim, str) and claim.strip():
        redacted = _strip_flagged(claim)
        if redacted:
            ticket = {**base, "claim": redacted}
            if inspect(ticket).allowed:
                return ticket
    return base


def _ask_failed(kind: str, model: str, error: str) -> dict[str, Any]:
    return {
        "allowed": False,
        "reason": None,
        "allowed_alternative": None,
        "payload": {},
        "keys": [],
        "prohibited_fields": [],
        "extra_fields": [],
        "identity_hits": [],
        "identifier_hits": [],
        "dropped_fields": [],
        "kept_fields": [],
        "outgoing": {},
        "blocked_motion": None,
        "file_return": None,
        "decision": {"blocked": True},
        "agent_b_can_second": False,
        "agent_b_has_batch": has_batch("org_b", BATCH),
        "ask": kind,
        "model": model,
        "draft": "",
        "ask_error": error,
    }


def preview(body: dict[str, Any]) -> dict[str, Any]:
    asked = body.get("ask")
    draft = ""
    model = ""
    if asked:
        result = ask_model("endeavor", case=str(body.get("case") or "name"))
        asked = "endeavor"
        model = str(result.get("model") or "")
        if not result.get("ok"):
            return _ask_failed(
                str(asked),
                model,
                str(result.get("error") or "The model call failed."),
            )
        draft = str(result.get("text") or "").strip()
        payload = {"id": "live", "from_org": "org_a", "claim": draft}
    else:
        raw = body.get("payload")
        if isinstance(raw, dict):
            payload = raw
        else:
            text = str(body.get("text") or body.get("claim") or "").strip()[:800]
            payload = {"id": "live", "from_org": "org_a", "claim": text}

    decision = inspect(payload)
    result = scan(payload)

    blocked_motion = None
    claim = payload.get("claim")
    claim_only = set(payload.keys()) <= {"id", "from_org", "claim"}
    if claim_only and isinstance(claim, str) and claim.strip():
        state = empty_state()
        gate_model_proposal(state, claim)
        if state["motions"]:
            blocked_motion = state["motions"][0]

    allowed_payload = result["payload"] if result["allowed"] else {}
    batch_id = allowed_payload.get("batch_id")
    can_second = result["allowed"] and has_batch(
        "org_b", batch_id if isinstance(batch_id, str) else None
    )
    return {
        **result,
        "decision": decision.to_dict(),
        "outgoing": payload,
        "blocked_motion": blocked_motion,
        "file_return": (
            None
            if decision.allowed or not _about_this_incident(payload)
            else _file_return(payload, decision.allowed_alternative)
        ),
        "agent_b_can_second": can_second,
        "agent_b_has_batch": has_batch("org_b", BATCH),
        "ask": "endeavor" if asked else None,
        "model": model,
        "draft": draft,
        "ask_error": None,
    }


def main() -> None:
    body = json.loads(sys.stdin.read() or "{}")
    if not isinstance(body, dict):
        raise SystemExit("expected a JSON object")
    json.dump(preview(body), sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
