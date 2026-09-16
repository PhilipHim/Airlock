"""Flower AgentApp. Same roles as agent.demo, persisted in Context."""

from __future__ import annotations

import json
import os
from typing import Any

from openai import OpenAI
from flwr.agentapp import AgentApp, AgentSession
from flwr.app import ConfigRecord, Context

from agent.roles import chair, empty_state, gate_model_proposal, move, second, snapshot

app = AgentApp()
LEDGER = "ledger"
PROPOSE = (
    "You are agent A on a product incident for batch BAT-042. "
    "Propose one sentence for the shared record. "
    "You may use customer names if you think they help."
)


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
    model = context.run_config.get("agent.model", "endeavor-1.0")
    if isinstance(model, str) and model.strip():
        return model.strip()
    return "endeavor-1.0"


def _propose(agent: AgentSession, context: Context) -> str:
    base = os.environ.get("FLWR_RUNTIME_BASE_URL")
    key = os.environ.get("FLWR_RUNTIME_API_KEY")
    if not base or not key:
        return ""
    model = _model_id(context)
    client = OpenAI(base_url=base, api_key=key, max_retries=0)
    stream = client.responses.create(model=model, input=PROPOSE, stream=True)
    chunks: list[str] = []
    for event in stream:
        if event.type in {"error", "response.failed"}:
            agent.events.emit({"type": "airlock.model_failed", "model": model})
            return ""
        if event.type == "response.output_text.delta":
            chunks.append(event.delta)
    return "".join(chunks).strip()


@app.main()
def main(agent: AgentSession, context: Context) -> None:
    prompt = context.run_config.get("agent.input", "move")
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("agent.input must be move, second, or chair")
    role, motion_id = _role(prompt)
    state = _load(context)
    if role == "move":
        try:
            proposal = _propose(agent, context)
        except Exception:
            proposal = ""
            agent.events.emit({"type": "airlock.model_skipped"})
        if proposal:
            gate_model_proposal(state, proposal)
            agent.events.emit(
                {
                    "type": "airlock.model_gated",
                    "model": _model_id(context),
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
        "motions": view["motions"],
        "public_record": view["public_record"],
        "audit": view["audit"],
        "standing_orders": view["standing_orders"],
    }
    agent.events.emit({"type": "airlock.snapshot", **safe})
    print(json.dumps(safe, ensure_ascii=False, indent=2))
