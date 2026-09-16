"""Deterministic policy gate. Not an LLM. Sits before the shared channel."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from agent.orgs import identity_markers, raw_id_markers

ALLOWED_FIELDS = frozenset(
    {
        "org_id",
        "batch_id",
        "product_type",
        "aggregate_count",
        "risk_level",
        "supplier_id",
        "component_id",
        "allowed_alternative",
        "blocked",
        "reason",
        "id",
        "claim",
        "status",
        "from_org",
        "motion_id",
        "seconded",
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

IDENTITY_MARKERS = identity_markers()
RAW_ID_MARKERS = raw_id_markers()

SHAREABLE_ID_PREFIXES = frozenset({"bat", "sup", "cell"})
_NAME_WORD = re.compile(
    r"[A-ZÄÖÜÁÉÍÓÚÀÈÌÒÙÑ][a-zäöüßáéíóúàèìòùñç]+"
    r"(?:['’-][A-Za-zÄÖÜäöüßÁÉÍÓÚáéíóúÑñç]+)*"
)
_ID_TOKEN = re.compile(r"\b([A-Za-z]{1,4})-(\d{3,})\b")
NOT_NAME_WORDS = frozenset(
    {
        "the",
        "and",
        "for",
        "from",
        "with",
        "this",
        "that",
        "returned",
        "return",
        "returns",
        "customer",
        "customers",
        "agent",
        "file",
        "batch",
        "shared",
        "write",
        "wireless",
        "earbuds",
        "battery",
        "swollen",
        "retailer",
        "supplier",
        "product",
        "claim",
        "status",
        "identity",
        "disclosure",
        "private",
        "record",
        "high",
        "medium",
        "low",
        "risk",
        "screen",
        "cracked",
        "items",
    }
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


def _drop_prohibited(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: _drop_prohibited(nested)
            for key, nested in value.items()
            if str(key).lower() not in PROHIBITED_FIELDS
        }
    if isinstance(value, list):
        return [_drop_prohibited(item) for item in value]
    return value


def _has_shareable(payload: dict[str, Any]) -> bool:
    if payload.get("batch_id") or payload.get("product_type") or payload.get("risk_level"):
        return True
    claim = payload.get("claim")
    if isinstance(claim, str) and claim.strip():
        return True
    if payload.get("aggregate_count") is not None:
        return True
    return False


def _identity_reason(prohibited: list[str]) -> str:
    if any(key in {"customer_id", "customer_ids"} for key in prohibited):
        return "RAW_IDENTIFIERS"
    if any(key in {"customer_name", "name", "names", "customers"} for key in prohibited):
        return "IDENTITY_DISCLOSURE"
    return "PROHIBITED_FIELDS"


def _walk_strings(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        found: list[str] = []
        for nested in value.values():
            found.extend(_walk_strings(nested))
        return found
    if isinstance(value, list):
        found = []
        for item in value:
            found.extend(_walk_strings(item))
        return found
    return []


def _name_hits(text: str) -> list[str]:
    hits: list[str] = []
    matches = list(_NAME_WORD.finditer(text))
    index = 0
    while index < len(matches):
        run = [matches[index]]
        cursor = index + 1
        while cursor < len(matches):
            gap = text[run[-1].end() : matches[cursor].start()]
            if gap.strip() != "":
                break
            run.append(matches[cursor])
            cursor += 1
        if len(run) >= 2:
            tokens = [match.group(0) for match in run]
            if not any(token.lower() in NOT_NAME_WORDS for token in tokens):
                hits.append(" ".join(tokens))
        index += len(run)
    return list(dict.fromkeys(hits))


def _id_hits(text: str) -> list[str]:
    hits: list[str] = []
    for match in _ID_TOKEN.finditer(text):
        if match.group(1).lower() in SHAREABLE_ID_PREFIXES:
            continue
        hits.append(match.group(0))
    return list(dict.fromkeys(hits))


def find_identity(value: Any) -> list[str]:
    found: list[str] = []
    blob = _as_text(value)
    for marker in IDENTITY_MARKERS:
        if marker in blob:
            found.append(marker)
    for text in _walk_strings(value):
        for hit in _name_hits(text):
            found.append(hit.lower())
    return list(dict.fromkeys(found))


def find_identifiers(value: Any) -> list[str]:
    found: list[str] = []
    blob = _as_text(value)
    for marker in RAW_ID_MARKERS:
        if marker in blob:
            found.append(marker)
    for text in _walk_strings(value):
        for hit in _id_hits(text):
            found.append(hit.lower())
    return list(dict.fromkeys(found))


def redact_claim(claim: str) -> str:
    """Replace names and customer ids with a generic customer. Keep the rest."""
    slot = "a customer"
    text = claim
    markers = list(
        dict.fromkeys(
            [
                *find_identifiers(claim),
                *find_identity(claim),
                *_id_hits(claim),
                *_name_hits(claim),
            ]
        )
    )
    for marker in sorted(markers, key=len, reverse=True):
        text = re.sub(
            rf"\bcustomer\s+{re.escape(marker)}\b",
            slot,
            text,
            flags=re.IGNORECASE,
        )
        text = re.sub(re.escape(marker), slot, text, flags=re.IGNORECASE)
    text = re.sub(
        rf"(?:{re.escape(slot)})(?:\s+and\s+{re.escape(slot)})+",
        "customers",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        rf"(?:{re.escape(slot)})(?:\s+{re.escape(slot)})+",
        slot,
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([.,;:])", r"\1", text)
    text = text.strip(" ,;:")
    if not text:
        return ""
    return text[0].upper() + text[1:]


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
    cleaned = _drop_prohibited(payload)
    if not isinstance(cleaned, dict):
        cleaned = {}

    if find_identity(cleaned):
        return GateDecision(
            allowed=False,
            reason="IDENTITY_DISCLOSURE",
            allowed_alternative="batch_return",
            payload={},
        )
    if find_identifiers(cleaned):
        return GateDecision(
            allowed=False,
            reason="RAW_IDENTIFIERS",
            allowed_alternative="batch_return",
            payload={},
        )

    extra = [key for key in _walk_keys(cleaned) if key not in ALLOWED_FIELDS]
    if extra:
        return GateDecision(
            allowed=False,
            reason="PROHIBITED_FIELDS",
            allowed_alternative="aggregate_count",
            payload={},
        )

    if prohibited:
        if not _has_shareable(cleaned):
            return GateDecision(
                allowed=False,
                reason=_identity_reason(prohibited),
                allowed_alternative="batch_return",
                payload={},
            )
        return GateDecision(
            allowed=True,
            reason=None,
            allowed_alternative=None,
            payload=cleaned,
        )

    return GateDecision(allowed=True, reason=None, allowed_alternative=None, payload=payload)


def scan(payload: dict[str, Any]) -> dict[str, Any]:
    """Same decision as inspect, plus the fields the demo can draw."""
    decision = inspect(payload)
    keys = _walk_keys(payload) if isinstance(payload, dict) else []
    prohibited = sorted({key for key in keys if key in PROHIBITED_FIELDS})
    extra = sorted(
        {
            key
            for key in keys
            if key not in ALLOWED_FIELDS and key not in PROHIBITED_FIELDS
        }
    )
    identity_hits = find_identity(payload) if isinstance(payload, dict) else []
    identifier_hits = find_identifiers(payload) if isinstance(payload, dict) else []
    kept = sorted(decision.payload.keys()) if decision.allowed else []
    return {
        "allowed": decision.allowed,
        "reason": decision.reason,
        "allowed_alternative": decision.allowed_alternative,
        "payload": decision.payload if decision.allowed else {},
        "keys": keys,
        "prohibited_fields": prohibited,
        "extra_fields": extra,
        "identity_hits": identity_hits,
        "identifier_hits": identifier_hits,
        "dropped_fields": sorted(set(prohibited) | set(extra)),
        "kept_fields": kept,
    }
