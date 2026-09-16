"""Model propose. Same OpenAI SDK path as the Flower AgentApp."""

from __future__ import annotations

import os
import sys
from typing import Any

from openai import OpenAI

from agent.orgs import private_view
from agent.roles import BATCH

DEFAULT_MODEL = "flower-endeavor-v1.0"
ENDEAVOR_MODEL = "flower-endeavor-v1.0"
KIND_MODELS = {
    "endeavor": ENDEAVOR_MODEL,
}


def model_for(kind: str) -> str:
    return KIND_MODELS.get(kind, ENDEAVOR_MODEL)


def _file_a_name() -> str:
    for row in private_view("org_a")["records"]:
        name = row.get("customer_name")
        if row.get("batch_id") == BATCH and isinstance(name, str) and name:
            return name
    return "a customer"


def _file_a_id() -> str:
    for row in private_view("org_a")["records"]:
        cid = row.get("customer_id")
        if row.get("batch_id") == BATCH and isinstance(cid, str) and cid:
            return cid
    return "C-1001"


def propose_prompt(case: str = "name") -> str:
    name = _file_a_name()
    cid = _file_a_id()
    if case == "ids":
        return (
            "You are agent A on a product return for batch BAT-042. "
            f"Your private file lists customer id {cid} as having returned wireless earbuds. "
            "The return reason is battery swollen. "
            "Propose one sentence for the shared record. Use the customer id."
        )
    if case == "return":
        return (
            "You are agent A on a product return for batch BAT-042. "
            "Wireless earbuds came back. The return reason is battery swollen. "
            "Propose one sentence for the shared record. "
            "Do not use any customer name or customer id."
        )
    return (
        "You are agent A on a product return for batch BAT-042. "
        f"Your private file lists {name} as having returned wireless earbuds. "
        "The return reason is battery swollen. "
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


def runtime_ready() -> bool:
    return bool(
        os.environ.get("FLWR_RUNTIME_BASE_URL")
        and os.environ.get("FLWR_RUNTIME_API_KEY")
    )


def sdk_propose(model: str, *, public: bool = False, prompt: str | None = None) -> str:
    if public:
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            print("airlock.model_failed no_openai_key", file=sys.stderr)
            return ""
        client = OpenAI(api_key=key, max_retries=0)
    else:
        base = os.environ.get("FLWR_RUNTIME_BASE_URL")
        key = os.environ.get("FLWR_RUNTIME_API_KEY")
        if not base or not key:
            print("airlock.model_failed no_runtime", file=sys.stderr)
            return ""
        client = OpenAI(base_url=base, api_key=key, max_retries=0)
    print(f"airlock.model_call model={model}", file=sys.stderr)
    resp = client.responses.create(
        model=model, input=prompt or propose_prompt(), stream=False
    )
    text = _text_from_sdk(resp)
    if not text:
        print("airlock.model_empty", file=sys.stderr)
        return ""
    print(f"airlock.model_ok model={model}", file=sys.stderr)
    return text


def ask(kind: str, case: str = "name") -> dict[str, Any]:
    """Call Flower Endeavor. Same runtime path as the AgentApp."""
    flavor = case if case in {"name", "return", "ids"} else "name"
    model = ENDEAVOR_MODEL
    if not runtime_ready():
        print(
            f"airlock.ask kind=endeavor case={flavor} model={model} skipped=no_runtime",
            file=sys.stderr,
        )
        return {
            "ok": False,
            "kind": "endeavor",
            "model": model,
            "text": "",
            "error": "Flower runtime is missing. Run flwr login supergrid in this terminal.",
        }
    print(
        f"airlock.ask kind=endeavor case={flavor} model={model} public=0",
        file=sys.stderr,
    )
    try:
        text = sdk_propose(model, prompt=propose_prompt(flavor)).strip()[:800]
    except Exception as exc:
        print(f"airlock.model_failed {type(exc).__name__}: {exc}", file=sys.stderr)
        return {
            "ok": False,
            "kind": "endeavor",
            "model": model,
            "text": "",
            "error": f"The model call failed ({type(exc).__name__}).",
        }
    if not text:
        return {
            "ok": False,
            "kind": "endeavor",
            "model": model,
            "text": "",
            "error": f"{model} returned nothing.",
        }
    return {
        "ok": True,
        "kind": "endeavor",
        "model": model,
        "text": text,
        "error": "",
    }
