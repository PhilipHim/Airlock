"""Deterministic policy gate. Not an LLM. Sits before the shared channel."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

ALLOWED_FIELDS = frozenset(
    {
        "org_id",
        "batch_id",
        "product_type",
        "aggregate_count",
        "intersection_count",
        "risk_level",
        "supplier_id",
        "component_id",
        "allowed_alternative",
        "blocked",
        "reason",
    }
)

PROHIBITED_FIELDS = frozenset(
    {
        "customer_name",
        "customer_address",
        "customer_id",
        "email",
        "phone",
        "name",
        "address",
        "names",
        "addresses",
        "customer_ids",
        "customers",
    }
)

IDENTITY_MARKERS = (
    "anna müller",
    "anna muller",
    "peter schmidt",
    "müller",
    "mueller",
)


@dataclass(frozen=True)
class GateDecision:
    allowed: bool
    reason: str | None
    allowed_alternative: str | None
    payload: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        if self.allowed:
            return {"blocked": False, **self.payload}
        return {
            "blocked": True,
            "reason": self.reason,
            "allowed_alternative": self.allowed_alternative,
        }


def _walk_keys(value: Any) -> list[str]:
    keys: list[str] = []
    if isinstance(value, dict):
        for key, nested in value.items():
            keys.append(str(key).lower())
            keys.extend(_walk_keys(nested))
    elif isinstance(value, list):
        for item in value:
            keys.extend(_walk_keys(item))
    return keys


def _as_text(value: Any) -> str:
    if isinstance(value, str):
        return value.lower()
    if isinstance(value, (int, float, bool)):
        return ""
    return str(value).lower()


def inspect(payload: dict[str, Any]) -> GateDecision:
    """Allow only policy-shareable fields onto the shared channel."""
    if not isinstance(payload, dict):
        return GateDecision(
            allowed=False,
            reason="INVALID_PAYLOAD",
            allowed_alternative="aggregate_count",
            payload={},
        )

    keys = _walk_keys(payload)
    prohibited = [key for key in keys if key in PROHIBITED_FIELDS]
    if prohibited:
        reason = (
            "IDENTITY_DISCLOSURE"
            if any(key in {"customer_name", "name", "names", "customers"} for key in prohibited)
            else "PROHIBITED_FIELDS"
        )
        if any(key in {"customer_id", "customer_ids"} for key in prohibited):
            reason = "RAW_IDENTIFIERS"
        return GateDecision(
            allowed=False,
            reason=reason,
            allowed_alternative="aggregate_intersection",
            payload={},
        )

    blob = _as_text(payload)
    if any(marker in blob for marker in IDENTITY_MARKERS):
        return GateDecision(
            allowed=False,
            reason="IDENTITY_DISCLOSURE",
            allowed_alternative="aggregate_intersection",
            payload={},
        )

    extra = [key for key in keys if key not in ALLOWED_FIELDS]
    if extra:
        return GateDecision(
            allowed=False,
            reason="PROHIBITED_FIELDS",
            allowed_alternative="aggregate_count",
            payload={},
        )

    return GateDecision(allowed=True, reason=None, allowed_alternative=None, payload=payload)
