"""Asymmetric private knowledge. Each org agent may see only its own file."""

from __future__ import annotations

import json
import unicodedata
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

ORGS = ("org_a", "org_b", "org_c")


def _fold_umlaut(text: str) -> str:
    return (
        text.lower()
        .replace("ü", "ue")
        .replace("ö", "oe")
        .replace("ä", "ae")
        .replace("ß", "ss")
    )


def _fold_ascii(text: str) -> str:
    stripped = "".join(
        ch
        for ch in unicodedata.normalize("NFKD", text.lower())
        if not unicodedata.combining(ch)
    )
    return stripped


def _text_variants(value: str, *, last_token: bool) -> list[str]:
    raw = value.strip()
    if not raw:
        return []
    pieces = [raw]
    parts = raw.split()
    if last_token and len(parts) >= 2:
        pieces.append(parts[-1])
    found: list[str] = []
    for piece in pieces:
        for variant in (piece.lower(), _fold_umlaut(piece), _fold_ascii(piece)):
            token = variant.strip()
            if len(token) >= 3:
                found.append(token)
    return found


def identity_markers() -> tuple[str, ...]:
    """Every name and address in the private files. Not a demo-chip list."""
    found: list[str] = []
    for org_id in ORGS:
        for row in load_org(org_id).get("records", []):
            name = row.get("customer_name")
            if isinstance(name, str):
                found.extend(_text_variants(name, last_token=True))
            address = row.get("customer_address")
            if isinstance(address, str):
                found.extend(_text_variants(address, last_token=False))
    return tuple(dict.fromkeys(found))


def raw_id_markers() -> tuple[str, ...]:
    """Every customer id in the private files."""
    found: list[str] = []
    for org_id in ORGS:
        for row in load_org(org_id).get("records", []):
            cid = row.get("customer_id")
            if isinstance(cid, str) and cid.strip():
                found.append(cid.strip().lower())
    return tuple(dict.fromkeys(found))


def load_org(org_id: str) -> dict[str, Any]:
    if org_id not in ORGS:
        raise KeyError(f"unknown org: {org_id}")
    path = DATA_DIR / f"{org_id}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def private_view(org_id: str) -> dict[str, Any]:
    """What a local agent is allowed to know. Never send this through the gate."""
    return load_org(org_id)


def aggregate_count(org_id: str, batch_id: str) -> dict[str, Any]:
    org = load_org(org_id)
    rows = [row for row in org["records"] if row.get("batch_id") == batch_id]
    return {
        "org_id": org_id,
        "batch_id": batch_id,
        "product_type": org["product_type"],
        "aggregate_count": len(rows),
        "risk_level": org.get("risk_level", "unknown"),
    }


def has_batch(org_id: str, batch_id: str | None) -> bool:
    if not batch_id:
        return False
    org = load_org(org_id)
    return any(row.get("batch_id") == batch_id for row in org["records"])


def shareable_return(org_id: str, batch_id: str) -> dict[str, Any]:
    """Return ticket from one file. No names. No look into the other file."""
    org = load_org(org_id)
    rows = [row for row in org["records"] if row.get("batch_id") == batch_id]
    reasons: list[str] = []
    for row in rows:
        reason = row.get("return_reason")
        if isinstance(reason, str) and reason.strip() and reason not in reasons:
            reasons.append(reason.strip())
    reason = reasons[0] if reasons else "return"
    lined = reason[0].upper() + reason[1:]
    return {
        "id": "m2",
        "from_org": org_id,
        "org_id": org_id,
        "batch_id": batch_id,
        "product_type": org["product_type"],
        "risk_level": org.get("risk_level", "unknown"),
        "claim": f"A customer returned the earbuds. {lined}.",
    }
