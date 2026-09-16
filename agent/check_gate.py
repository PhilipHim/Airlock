"""Local proof the gate is policy, not a chatbot. Run: uv run python -m agent.check_gate"""

from __future__ import annotations

import json

from agent.gate import inspect, scan
from agent.live import preview
from agent.orgs import aggregate_count, shareable_return


def must_block(payload: dict, reason: str) -> None:
    decision = inspect(payload)
    assert not decision.allowed, payload
    assert decision.reason == reason, (decision.reason, payload)
    print(f"BLOCK  {reason:24}  alternative={decision.allowed_alternative}")


def must_allow(payload: dict) -> None:
    decision = inspect(payload)
    assert decision.allowed, decision.to_dict()
    print(f"ALLOW  {payload}")


def main() -> None:
    must_block({"customer_name": "Anna Müller"}, "IDENTITY_DISCLOSURE")
    must_block({"text": "Anna Müller is affected."}, "IDENTITY_DISCLOSURE")
    must_block(
        {"claim": "Leila Hassan returned the earbuds. Battery swollen."},
        "IDENTITY_DISCLOSURE",
    )
    must_block(
        {"claim": "Jonas Weber returned the earbuds. Battery swollen."},
        "IDENTITY_DISCLOSURE",
    )
    must_block({"customer_ids": ["C-1001", "C-1002"]}, "RAW_IDENTIFIERS")
    must_block(
        {"claim": "Customer C-1001 returned the earbuds. Battery swollen."},
        "RAW_IDENTIFIERS",
    )
    must_block(
        {"customer_address": "Rollbergstraße 12, Berlin"},
        "PROHIBITED_FIELDS",
    )
    must_allow(aggregate_count("org_a", "BAT-042"))
    must_allow(shareable_return("org_a", "BAT-042"))

    mixed = inspect(
        {
            "id": "m1",
            "from_org": "org_a",
            "customer_name": "Anna Müller",
            "batch_id": "BAT-042",
            "claim": "Returned wireless earbuds. Battery swollen.",
        }
    )
    assert mixed.allowed, mixed.to_dict()
    assert "customer_name" not in mixed.payload
    assert mixed.payload["batch_id"] == "BAT-042"
    assert "Anna" not in json.dumps(mixed.payload)
    print("STRIP  customer_name dropped, return kept")

    from agent.roles import empty_state, gate_model_proposal

    leaked = empty_state()
    gate_model_proposal(leaked, "Anna Müller returned the earbuds. Battery swollen.")
    assert leaked["motions"][0]["status"] == "blocked"
    assert "Anna Müller" not in json.dumps(leaked)

    named = scan({"customer_name": "Anna Müller"})
    assert named["allowed"] is False
    assert "customer_name" in named["prohibited_fields"]
    live = preview({"text": "Anna Müller returned the earbuds. Battery swollen."})
    assert live["allowed"] is False
    assert "Anna Müller" not in json.dumps(live["payload"])
    assert live["file_return"] and "Anna Müller" not in json.dumps(live["file_return"])
    assert live["file_return"]["claim"] == "A customer returned the earbuds. Battery swollen."
    assert "wireless" not in live["file_return"]["claim"]
    custom = preview({"text": "Anna Müller bought 5 items for 99.89"})
    assert custom["allowed"] is False
    assert custom["decision"]["blocked"] is True
    assert custom["decision"]["reason"] == "IDENTITY_DISCLOSURE"
    assert custom["file_return"] is None
    assert custom["blocked_motion"]["status"] == "blocked"
    assert "Anna Müller" not in json.dumps(custom["blocked_motion"])
    assert "99.89" not in json.dumps(custom["blocked_motion"])
    ticket = preview({"payload": shareable_return("org_a", "BAT-042")})
    assert ticket["allowed"] is True
    assert ticket["agent_b_can_second"] is True
    assert "intersection_count" not in ticket["payload"]
    raw_id = preview(
        {"text": "Customer C-1001 returned the earbuds. Battery swollen."}
    )
    assert raw_id["allowed"] is False
    assert raw_id["reason"] == "RAW_IDENTIFIERS"
    assert "C-1001" in json.dumps(raw_id["outgoing"])
    assert "C-1001" not in json.dumps(raw_id["payload"])
    assert raw_id["file_return"]["claim"] == "A customer returned the earbuds. Battery swollen."
    assert "C-1001" not in raw_id["file_return"]["claim"]
    assert "wireless" not in raw_id["file_return"]["claim"]
    leila = preview(
        {"text": "Leila Hassan returned the earbuds. Battery swollen."}
    )
    assert leila["allowed"] is False
    assert leila["reason"] == "IDENTITY_DISCLOSURE"
    assert "Leila Hassan" in json.dumps(leila["outgoing"])
    assert "Leila" not in json.dumps(leila["payload"])
    assert leila["file_return"]["claim"] == (
        "A customer returned the earbuds. Battery swollen."
    )
    assert "Hassan" not in leila["file_return"]["claim"]

    sofia = preview(
        {"text": "Sofia Berg returned the earbuds. Battery swollen."}
    )
    assert sofia["allowed"] is False
    assert sofia["reason"] == "IDENTITY_DISCLOSURE"
    assert "Sofia Berg" in json.dumps(sofia["outgoing"])
    assert "Sofia" not in json.dumps(sofia["payload"])
    assert sofia["file_return"]["claim"] == (
        "A customer returned the earbuds. Battery swollen."
    )
    kenji = preview(
        {"text": "Kenji Nakamura returned the earbuds. Battery swollen."}
    )
    assert kenji["allowed"] is False
    assert "Nakamura" not in kenji["file_return"]["claim"]
    assert kenji["file_return"]["claim"] == (
        "A customer returned the earbuds. Battery swollen."
    )
    priya = preview(
        {"text": "Priya Shah returned the earbuds. Screen cracked."}
    )
    assert priya["allowed"] is False
    assert priya["file_return"]["claim"] == (
        "A customer returned the earbuds. Screen cracked."
    )
    assert "Shah" not in priya["file_return"]["claim"]
    pair = preview(
        {
            "text": (
                "Sofia Berg and Kenji Nakamura returned the earbuds. "
                "Battery swollen."
            )
        }
    )
    assert pair["file_return"]["claim"] == (
        "Customers returned the earbuds. Battery swollen."
    )
    fresh_id = preview(
        {"text": "Customer R-2204 returned the earbuds. Battery swollen."}
    )
    assert fresh_id["allowed"] is False
    assert fresh_id["reason"] == "RAW_IDENTIFIERS"
    assert "R-2204" in json.dumps(fresh_id["outgoing"])
    assert "R-2204" not in fresh_id["file_return"]["claim"]
    assert fresh_id["file_return"]["claim"] == (
        "A customer returned the earbuds. Battery swollen."
    )
    must_allow({"claim": "Return on batch BAT-042."})
    must_allow({"claim": "A customer returned the earbuds. Battery swollen."})

    from agent.propose import (
        ENDEAVOR_MODEL,
        OPENAI_MODEL,
        ask as ask_model,
        model_for,
        propose_prompt,
    )

    assert model_for("endeavor") == ENDEAVOR_MODEL == "flower-endeavor-v1.0"
    assert model_for("openai") == OPENAI_MODEL == "openai/gpt-5.6-sol"
    assert "Anna Müller" in propose_prompt("name")
    assert "C-1001" in propose_prompt("ids")
    assert "Do not use any customer name" in propose_prompt("return")
    import os

    saved = {
        "FLWR_RUNTIME_BASE_URL": os.environ.get("FLWR_RUNTIME_BASE_URL"),
        "FLWR_RUNTIME_API_KEY": os.environ.get("FLWR_RUNTIME_API_KEY"),
        "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY"),
    }
    os.environ.pop("FLWR_RUNTIME_BASE_URL", None)
    os.environ.pop("FLWR_RUNTIME_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    missed = ask_model("endeavor")
    assert missed["ok"] is False
    assert missed["model"] == ENDEAVOR_MODEL
    assert "runtime" in missed["error"].lower()
    assert "openai" not in missed["error"].lower()
    forced = ask_model("openai")
    assert forced["ok"] is False
    assert forced["model"] == ENDEAVOR_MODEL
    assert "openai" not in forced["error"].lower()
    for key, value in saved.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value
    print("ASK    live path is Flower Endeavor")
    print("ok: gate enforces policy")


if __name__ == "__main__":
    main()
