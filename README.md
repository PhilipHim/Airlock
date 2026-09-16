# AIRLOCK

Company agents resolve an incident without sharing raw files. A sentence reaches the shared record only if the other side can second it, the gate allows the fields, and a human closes the record.

Hackathon: Flower Collaborative Agents, Berlin, 16 September 2026.

Judging: Impact, Innovation, Flower, Execution, Presentation, Safety. Bonus: Flower Endeavor.

Repo: https://github.com/PhilipHim/Airlock

Table talk: `PITCH.md`.

## Split today

**Talk person:** rehearse `PITCH.md`. Start on http://localhost:3000. Press Live demo. Search `Anna Müller`.

**Flower person:** no more debug runs. The live Endeavor propose already exists.

## Two surfaces

Terminal SuperGrid is the Flower proof. The live door on `/` shows the run id. `ui/last-run.json` is the freeze. It does not stream SuperGrid live.

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

- Landing: http://localhost:3000 (press Live demo)

Search `Anna Müller`. It must read 0 hits in the shared record. The caption shows SuperGrid run 13311565059047633796.

## How this matches Flower's AgentApp tutorial

Same shape as [Write your first AgentApp](https://flower.ai/docs/agent/tutorials/write-your-first-agentapp.html):

- `agentapp = "agent.agent_app:app"`
- OpenAI SDK with `FLWR_RUNTIME_BASE_URL` and `FLWR_RUNTIME_API_KEY`
- `flwr run . supergrid --stream`

AIRLOCK then sends the model sentence through the Python gate before it can enter the Context ledger. SuperGrid streaming of the SDK itself failed here (`'type'`), so the model call uses `stream=False`. The model id is `flower-endeavor-v1.0`, not the tutorial default `openai/gpt-5.6-sol`.

## Flower Chat (Claude Code path)

Flower 1.36 chat commands: `/help`, `/quit`, `/new`, `/federation`, `/history`. There is no `/load`.

```bash
uv run flwr login supergrid
uv run flwr chat
```

Footer must say `@philiphimmeroeder/workspace`. Never `@philiphimmeroeder/personal`.

## AIRLOCK on SuperGrid

```bash
uv run flwr run . supergrid --federation @philiphimmeroeder/workspace --run-config 'agent.model="flower-endeavor-v1.0" agent.input="move"' --stream
```

Known good Endeavor move: `13311565059047633796`. Logs: `airlock.model_ok model=flower-endeavor-v1.0`. Snapshot: `m0` blocked IDENTITY_DISCLOSURE `source: model`, `m1` blocked, `m2` moved, Anna Müller 0.

Do not use `endeavor-1.0`. SuperGrid rejects that id.

## Proof checklist

- `uv run python -m agent.check_gate` prints BLOCK on the name and ALLOW on the count.
- SuperGrid snapshot: model `m0` blocked, count 2, audit Anna Müller 0.
- Context search on the live door: 0.
- Talker may say: Endeavor proposed, Python gated.

If StartRun is denied: freeze UI, say so, do not debug at the table.

## GitHub

Share https://github.com/PhilipHim/Airlock with the teammate. Do not commit `.venv`, `web/node_modules`, `web/.next`, `*.fab`, or API keys.
