"""Run move -> second -> chair locally and freeze the demo board."""

from __future__ import annotations

import json
from pathlib import Path

from agent.roles import chair, empty_state, move, second, snapshot

UI_DIR = Path(__file__).resolve().parent.parent / "ui"


def main() -> None:
    state = empty_state()
    move(state)
    second(state)
    chair(state, "m2")
    view = snapshot(state)
    UI_DIR.mkdir(exist_ok=True)
    (UI_DIR / "last-run.json").write_text(
        json.dumps(view, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (UI_DIR / "last-run.js").write_text(
        "window.LAST_RUN = " + json.dumps(view, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    audit = view["audit"]
    print("blocked", [m["id"] for m in view["motions"] if m.get("status") == "blocked"])
    print("public", view["public_record"])
    print("audit", audit)
    if audit.get("Anna Müller", 0) != 0:
        raise SystemExit("name leaked into shared ledger")
    print("ok: ui/last-run.js written")


if __name__ == "__main__":
    main()
