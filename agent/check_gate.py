"""Local proof the gate is policy, not a chatbot. Run: uv run python -m agent.check_gate"""

from __future__ import annotations

import json

from agent.gate import inspect
from agent.orgs import aggregate_count, intersection_count


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
    must_block({"customer_ids": ["C-1001", "C-1002"]}, "RAW_IDENTIFIERS")
    must_block(
        {"customer_address": "Rollbergstraße 12, Berlin"},
        "PROHIBITED_FIELDS",
    )
    must_allow(aggregate_count("org_a", "BAT-042"))
    must_allow(intersection_count("org_a", "BAT-042", ["org_b", "org_c"]))
    from agent.roles import empty_state, gate_model_proposal

    leaked = empty_state()
    gate_model_proposal(leaked, "Anna Müller is affected by BAT-042.")
    assert leaked["motions"][0]["status"] == "blocked"
    assert "Anna Müller" not in json.dumps(leaked)
    print("ok: gate enforces policy")


if __name__ == "__main__":
    main()
