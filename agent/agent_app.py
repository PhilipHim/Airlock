"""Flower AgentApp. Same roles as agent.demo, persisted in Context."""

from __future__ import annotations

import json
import os
from typing import Any

from openai import OpenAI
from flwr.agentapp import AgentApp, AgentSession
from flwr.app import ConfigRecord, Context

from agent.orgs import private_view
from agent.roles import BATCH, chair, empty_state, gate_model_proposal, move, second, snapshot

app = AgentApp()
LEDGER = "ledger"
DEFAULT_MODEL = "flower-endeavor-v1.0"


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


def _file_a_name() -> str:
    for row in private_view("org_a")["records"]:
        name = row.get("customer_name")
        if row.get("batch_id") == BATCH and isinstance(name, str) and name:
            return name
    return "a customer"


def _propose_prompt() -> str:
    name = _file_a_name()
    return (
        "You are agent A on a product incident for batch BAT-042. "
        f"Your private file lists {name} as affected. "
        "Propose one sentence for the shared record. Use the customer name."
    )


def _output_text(payload: Any) -> str:
    if not isinstance(payload, dict):
        return ""
    direct = payload.get("output_text")
    if isinstance(direct, str) and direct.strip():
        return direct.strip()
    chunks: list[str] = []
    output = payload.get("output")
    if isinstance(output, list):
        for item in output:
            if not isinstance(item, dict):
                continue
            content = item.get("content")
            if isinstance(content, list):
                for part in content:
                    if isinstance(part, dict) and isinstance(part.get("text"), str):
                        chunks.append(part["text"])
            elif isinstance(item.get("text"), str):
                chunks.append(item["text"])
    return "".join(chunks).strip()


def _text_from_sdk(resp: Any) -> str:
    text = getattr(resp, "output_text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()
    dump = resp.model_dump() if hasattr(resp, "model_dump") else None
    return _output_text(dump)


def _sdk_propose(model: str) -> str:
    base = os.environ.get("FLWR_RUNTIME_BASE_URL")
    key = os.environ.get("FLWR_RUNTIME_API_KEY")
    if not base or not key:
        print("airlock.model_failed no_runtime")
        return ""
    client = OpenAI(base_url=base, api_key=key, max_retries=0)
    print(f"airlock.model_call model={model}")
    resp = client.responses.create(
        model=model, input=_propose_prompt(), stream=False
    )
    text = _text_from_sdk(resp)
    if not text:
        print("airlock.model_empty")
        return ""
    print(f"airlock.model_ok model={model}")
    return text


def _propose(context: Context) -> str:
    model = _model_id(context)
    try:
        return _sdk_propose(model)
    except Exception as exc:
        print(f"airlock.model_failed {type(exc).__name__}: {exc}")
        return ""


@app.main()
def main(agent: AgentSession, context: Context) -> None:
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
