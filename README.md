# AIRLOCK

Company agents resolve an incident without sharing raw files. A sentence reaches the shared record only if the other side can second it, the gate allows the fields, and a human closes the record.

Hackathon: Flower Collaborative Agents, Berlin, 16 September 2026.

Judging: Impact, Innovation, Flower, Execution, Presentation, Safety. Bonus: Flower Endeavor.

Repo: https://github.com/PhilipHim/Airlock

Table talk: `PITCH.md`.

## Split today

**Talk person:** rehearse `PITCH.md`. Keep http://localhost:3000/file open. Do not change product scope.

**Flower person:** login, workspace, Endeavor in the terminal, then finish the AIRLOCK series. Commands below.

## Jury screen (freeze)

```bash
git clone https://github.com/PhilipHim/Airlock.git
cd Airlock
uv sync
uv run python -m agent.demo
cd web
npm install
npm run dev
```

- Landing: http://localhost:3000
- File (show this): http://localhost:3000/file

Search `Anna Müller`. It must read 0 hits in Context.

## Flower Chat (this is the Claude Code path)

Flower Chat is the terminal UI. Default agent talks like a coding agent. AIRLOCK is a separate loaded AgentApp. Do not mix them in one series.

```bash
cd Airlock
uv run flwr login supergrid
uv run flwr federation list supergrid
uv run flwr chat
```

Inside `flwr chat`:

1. `/federation @philiphimmeroeder/workspace`
2. Ask anything. That is the default Flower Agent. Use this to feel Endeavor / the Flower runtime in the terminal.
3. `/load .` loads AIRLOCK from this folder.
4. Type `move`, wait until it finishes.
5. Type `second`. Same agent. Do not pick another `@agent`.
6. Type `chair m2`. Same series.
7. `/quit`

Never use `@philiphimmeroeder/personal`. That federation is deployment and denies StartRun. Skip SuperNodes.

`@` at an empty prompt lists agents. Picking a different agent starts a new series and drops the ledger.

## Same series from the CLI

Use this if Chat is awkward. Each command without a series ID starts a new series. Prefer Chat for second and chair after the first move.

```bash
uv run flwr run . supergrid --federation @philiphimmeroeder/workspace --run-config 'agent.model="endeavor-1.0" agent.input="move"' --stream
uv run flwr list supergrid --limit 5
uv run flwr log <run-id> supergrid --show
```

Known good move: `5756721645464008460` on workspace. `m1` blocked, `m2` moved, Anna Müller 0. No `m0` yet, so Endeavor propose was empty on that run. Flower person must get a live propose before the talker claims the Endeavor bonus.

If Slack gives another model id, override `agent.model`.

## Proof checklist

- `uv run python -m agent.check_gate` prints BLOCK on the name and ALLOW on the count.
- SuperGrid snapshot: name blocked, count 2, audit Anna Müller 0.
- Context search on `/file`: 0.
- Live propose: events `airlock.model_gated` or a motion `m0`. Then the talker may say Endeavor proposed, Python gated.

If StartRun is denied: freeze UI, say so, do not debug at the table.

## GitHub

Share https://github.com/PhilipHim/Airlock with the teammate. Do not commit `.venv`, `web/node_modules`, `web/.next`, `*.fab`, or API keys.
