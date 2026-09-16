"""Roles for one AgentApp. Fixtures stay in this process. Shared writes go through the gate."""

from __future__ import annotations

import json
from typing import Any

from agent.gate import inspect
from agent.orgs import aggregate_count, intersection_count, private_view

BATCH = "BAT-042"


def empty_state() -> dict[str, Any]:
    return {
        "motions": [],
        "standing_orders": [],
        "public_record": [],
        "events": [],
    }


def _emit(state: dict[str, Any], kind: str, detail: dict[str, Any]) -> None:
    state["events"].append({"type": kind, **detail})


def _audit(state: dict[str, Any]) -> dict[str, int]:
    blob = json.dumps(
        {
            "motions": state["motions"],
            "standing_orders": state["standing_orders"],
            "public_record": state["public_record"],
        },
        ensure_ascii=False,
    ).lower()
    return {
        "Anna Müller": blob.count("anna müller") + blob.count("anna muller"),
        "customer_id": blob.count("c-1001") + blob.count("c-1002") + blob.count("c-1003"),
        "50,000": blob.count("50,000") + blob.count("50000"),
    }


def _name_motion() -> dict[str, Any]:
    # Intentionally leaky payload. Gate must reject it. Name never stored.
    return {
        "id": "m1",
        "from_org": "org_a",
        "customer_name": "Anna Müller",
        "claim": "Anna Müller is affected by BAT-042.",
    }


def _count_motion() -> dict[str, Any]:
    counts = intersection_count("org_a", BATCH, ["org_b", "org_c"])
    return {
        "id": "m2",
        "from_org": "org_a",
        "claim": f"{counts['intersection_count']} customers overlap on batch {BATCH}.",
        **counts,
    }


def gate_model_proposal(state: dict[str, Any], text: str) -> dict[str, Any]:
    """Endeavor may propose. The gate still decides. Name never stored."""
    claim = (text or "").strip()[:800]
    if not claim:
        return state
    raw = {"id": "m0", "from_org": "org_a", "claim": claim}
    decision = inspect(raw)
    if decision.allowed:
        motion = {**decision.payload, "status": "moved", "source": "model"}
        state["motions"].append(motion)
        _emit(state, "moved", {"id": "m0", "source": "model"})
        return state
    blocked = {
        "id": "m0",
        "from_org": "org_a",
        "status": "blocked",
        "reason": decision.reason,
        "allowed_alternative": decision.allowed_alternative,
        "source": "model",
    }
    state["motions"].append(blocked)
    _emit(
        state,
        "blocked",
        {
            "id": "m0",
            "source": "model",
            "reason": decision.reason,
            "allowed_alternative": decision.allowed_alternative,
        },
    )
    return state


def move(state: dict[str, Any]) -> dict[str, Any]:
    """Org A proposes. Private file is read here, never copied into state."""
    private_view("org_a")
    orders = state["standing_orders"]
    skip_names = any(
        "identity" in order.get("blocked", []) for order in orders
    )
    proposals = [] if skip_names else [_name_motion()]
    proposals.append(_count_motion())
    for raw in proposals:
        decision = inspect(raw)
        if decision.allowed:
            motion = {**decision.payload, "status": "moved"}
            state["motions"].append(motion)
            _emit(state, "moved", {"id": motion["id"], "claim": motion.get("claim")})
        else:
            blocked = {
                "id": raw["id"],
                "from_org": raw["from_org"],
                "status": "blocked",
                "reason": decision.reason,
                "allowed_alternative": decision.allowed_alternative,
            }
            state["motions"].append(blocked)
            _emit(
                state,
                "blocked",
                {
                    "id": raw["id"],
                    "reason": decision.reason,
                    "allowed_alternative": decision.allowed_alternative,
                },
            )
            if decision.reason == "IDENTITY_DISCLOSURE":
                state["standing_orders"] = [
                    {
                        "policy": "cross_org_customer_impact",
                        "blocked": ["identity", "address", "customer_id"],
                        "preferred_queries": [
                            "aggregate_count",
                            "aggregate_intersection",
                        ],
                    }
                ]
    return state


def second(state: dict[str, Any]) -> dict[str, Any]:
    """Org B seconds only what it can support from its own file."""
    private_view("org_b")
    local = intersection_count("org_b", BATCH, ["org_a", "org_c"])
    for motion in state["motions"]:
        if motion.get("status") != "moved":
            continue
        theirs = motion.get("intersection_count")
        if theirs == local["intersection_count"] and inspect(motion).allowed:
            motion["status"] = "seconded"
            motion["seconded"] = True
            _emit(state, "seconded", {"id": motion["id"]})
        else:
            motion["status"] = "objected"
            _emit(state, "objected", {"id": motion["id"], "reason": "no local support"})
    return state


def chair(state: dict[str, Any], motion_id: str = "m2") -> dict[str, Any]:
    """Human release. Nothing becomes public without this."""
    for motion in state["motions"]:
        if motion.get("id") != motion_id:
            continue
        if motion.get("status") != "seconded":
            _emit(state, "chair_refused", {"id": motion_id, "reason": "not seconded"})
            return state
        if not inspect(motion).allowed:
            _emit(state, "chair_refused", {"id": motion_id, "reason": "gate"})
            return state
        record = {
            "id": motion["id"],
            "claim": motion["claim"],
            "intersection_count": motion.get("intersection_count"),
            "batch_id": motion.get("batch_id"),
        }
        state["public_record"] = [record]
        _emit(state, "carried", {"id": motion_id})
        return state
    _emit(state, "chair_refused", {"id": motion_id, "reason": "missing"})
    return state


def snapshot(state: dict[str, Any]) -> dict[str, Any]:
    a = private_view("org_a")
    b = private_view("org_b")
    a_names = [
        row["customer_name"]
        for row in a["records"]
        if row.get("batch_id") == BATCH
    ]
    return {
        "org_a": {
            "label": "File A · Retailer",
            "product": a["product_type"],
            "batch": BATCH,
            "private_names": a_names,
            "note": "Only Agent A sees the names.",
        },
        "org_b": {
            "label": "File B · Supplier",
            "product": b["product_type"],
            "batch": BATCH,
            "private_count": sum(
                1 for row in b["records"] if row.get("batch_id") == BATCH
            ),
            "note": "Only Agent B sees its own list.",
        },
        "motions": state["motions"],
        "standing_orders": state["standing_orders"],
        "public_record": state["public_record"],
        "events": state["events"],
        "audit": _audit(state),
        "aggregates": {
            "org_a": aggregate_count("org_a", BATCH),
            "overlap": intersection_count("org_a", BATCH, ["org_b", "org_c"]),
        },
    }
