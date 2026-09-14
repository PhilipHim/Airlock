"""Asymmetric private knowledge. Each org agent may see only its own file."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

ORGS = ("org_a", "org_b", "org_c")


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


def intersection_count(org_id: str, batch_id: str, other_ids: list[str]) -> dict[str, Any]:
    """Count IDs that exist in this org and every other listed org. IDs never leave."""
    mine = {
        row["customer_id"]
        for row in load_org(org_id)["records"]
        if row.get("batch_id") == batch_id
    }
    for other in other_ids:
        theirs = {
            row["customer_id"]
            for row in load_org(other)["records"]
            if row.get("batch_id") == batch_id
        }
        mine &= theirs
    return {
        "org_id": org_id,
        "batch_id": batch_id,
        "intersection_count": len(mine),
    }
