"""Flower AgentApp. Same roles as agent.demo, persisted in Context."""

from __future__ import annotations

import json
from typing import Any

from flwr.agentapp import AgentApp, AgentSession
from flwr.app import ConfigRecord, Context

from agent.propose import DEFAULT_MODEL, FLOWER_PROOF, sdk_propose
from agent.roles import chair, empty_state, gate_model_proposal, move, second, snapshot

app = AgentApp()
LEDGER = "ledger"


def _load(context: Context) -> dict[str, Any]:
    record = context.state.config_records.get(LEDGER)
    if record is None:
        return empty_state()
    raw = record.get("json", "{}")
    if not isinstance(raw, str) or not raw.strip():
        return empty_state()
    data = json.loads(raw)
    data.setdefault("motions", [])
    data.setdefault("standing_orders", [])
    data.setdefault("public_record", [])
    data.setdefault("events", [])
    return data


def _save(context: Context, state: dict[str, Any]) -> None:
    def write() -> None:
        record = context.state.config_records.setdefault(
            LEDGER, ConfigRecord({"json": "{}"})
        )
        record["json"] = json.dumps(state, ensure_ascii=False)

    lock = getattr(context, "locked", None)
    if callable(lock):
        with lock():
            write()
            return
    write()


def _role(raw: str) -> tuple[str, str]:
    text = raw.strip().lower()
    if text.startswith("chair"):
        parts = text.replace(":", " ").split()
        motion_id = parts[1] if len(parts) > 1 else "m2"
        return "chair", motion_id
    if text == "second":
        return "second", ""
    return "move", ""


def _model_id(context: Context) -> str:
    model = context.run_config.get("agent.model", DEFAULT_MODEL)
    if isinstance(model, str) and model.strip():
        return model.strip()
    return DEFAULT_MODEL


def _propose(context: Context) -> str:
    # SuperGrid injects FLWR_RUNTIME. This is the Flower model call.
    model = _model_id(context)
    try:
        return sdk_propose(model)
    except Exception as exc:
        print(f"airlock.model_failed {type(exc).__name__}: {exc}")
        return ""


@app.main()
def main(agent: AgentSession, context: Context) -> None:
    # One AgentApp. Roles on agent.input. Gate before every Context write.
    prompt = context.run_config.get("agent.input", "move")
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("agent.input must be move, second, or chair")
    role, motion_id = _role(prompt)
    state = _load(context)
    if role == "move":
        proposal = _propose(context)
        if proposal:
            gate_model_proposal(state, proposal)
            agent.events.emit(
                {
                    "type": "airlock.model_gated",
                    "model": _model_id(context),
                    "flower": FLOWER_PROOF,
                }
            )
        move(state)
    elif role == "second":
        second(state)
    else:
        chair(state, motion_id)
    _save(context, state)
    view = snapshot(state)
    safe = {
        "role": role,
        "flower": FLOWER_PROOF,
        "motions": view["motions"],
        "public_record": view["public_record"],
        "audit": view["audit"],
        "standing_orders": view["standing_orders"],
    }
    agent.events.emit({"type": "airlock.snapshot", **safe})
    print(json.dumps(safe, ensure_ascii=False, indent=2))
