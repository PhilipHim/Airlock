# AIRLOCK

Company agents resolve an incident without sharing raw files. A sentence reaches the shared record only if the other side can second it, the gate allows the fields, and a human closes the record.

Hackathon: Flower Collaborative Agents, Berlin, 16 September 2026.

Judging: Impact, Innovation, Flower, Execution, Presentation, Safety. Bonus: Flower Endeavor.

## Web app

```bash
cd ~/Desktop/jph/projects/airlock
uv run python -m agent.demo
cd web
npm run dev
```

- Landing: [http://localhost:3000](http://localhost:3000)
- File (show this to the jury): [http://localhost:3000/file](http://localhost:3000/file)

## GitHub

Share the repo with the teammate. Do not commit `.venv`, `web/node_modules`, `web/.next`, `*.fab`, or any API keys.

## Flower + Endeavor

Default model in `pyproject.toml`: `endeavor-1.0`. If Slack gives another id, override it.

```bash
uv run flwr login supergrid
uv run flwr run . supergrid --federation @philiphimmeroeder/workspace --run-config 'agent.model="endeavor-1.0" agent.input="move"' --stream
uv run flwr run . supergrid --federation @philiphimmeroeder/workspace --run-config 'agent.input="second"' --stream
uv run flwr run . supergrid --federation @philiphimmeroeder/workspace --run-config 'agent.input="chair m2"' --stream
```

Target `@philiphimmeroeder/workspace` (simulation). `@philiphimmeroeder/personal` is deployment and will deny StartRun. Do not add SuperNodes.

Keep the same run series. Do not switch agents.

Endeavor may propose a sentence. Python still gates it. If `StartRun` is denied, use the freeze UI and say so.

Table talk: see `PITCH.md` (2 minutes + 1 minute questions).
