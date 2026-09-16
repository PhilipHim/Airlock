# Agents

Lies zuerst RULES.md, DESIGN.md, PLAN.md. Dann den kleinsten Diff.

Ponytail: existierender Code zuerst. `gate.py` und `data/` nicht neu erfinden. HTML statt React. Kein web_search. Kein zweites FAB.

Flower: ein `agentapp`. Rollen über `agent.input`. Fixtures nie in Context. Gate vor jedem Shared-Write.

UI-Copy aus DESIGN.md und RULES.md. Kein Gedankenstrich. Kein Lila. Kein Inter.

Nach einer Änderung: `uv run python -m agent.check_gate`. SuperGrid-Run extra nennen wenn er gelaufen ist. Nicht „alles geht“ ohne Check.
