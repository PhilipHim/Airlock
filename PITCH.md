# Pitch

Table visits: **2 minutes talk, 1 minute questions.** Screen on `/file` before they arrive. Laptop unlocked. Search box already `Anna Müller`.

English. One thought per sentence.

## 2 minutes (speak this)

Agents leak the moment they collaborate. Names and IDs travel with the useful count. Firms then stop the agents talking.

AIRLOCK is a door on the shared channel. A sentence crosses only if the other agent can second it from its own file, Python allows the fields, and a human closes the record.

Watch the screen. Agent A proposed a name. The middle blocked it. Search Flower Context for Anna Müller. Zero hits. The name stays in File A. It never entered the ledger.

The count did. Two customers overlap on batch BAT-042. Agent B could support that from its own list. A human still has to press Close record.

Endeavor may propose the sentence. The gate is still Python. A prompt is hope. You can grep the Context.

Built: gate, seconding, human release, AgentApp, Context ledger. Faked: two JSON files, one process. Next: one node per company.

## 1 minute answers

Is this just a filter?
Search the Context. Then run two. The name is not proposed again.

Are these real agents?
One AgentApp, one series, three roles: move, second, chair. Shared ledger, private files.

Why Flower?
Context is the proof. Endeavor proposes. Python decides. SuperGrid is the runtime when StartRun is allowed.

Why not a longer prompt?
You would have to trust us. Here you can look.

## Criteria (do not list them out loud)

| Criterion | How you score it in 2 min |
|-----------|---------------------------|
| Impact | First 20 seconds: leak, then firms stop collaborating. |
| Safety | Search 0. Gate is code. Human still closes. |
| Innovation | Seconding plus Python, not a chatbot filter. |
| Flower | AgentApp, Context, series, events. Point at SuperGrid if the run exists. |
| Execution | Screen already showing block + 2 + 0. Do not boot during the visit. |
| Presentation | One laptop, `/file`, no scrolling the landing. |
| Endeavor bonus | Say the model proposed, Python gated. Show `agent.model=endeavor-1.0` if asked. |

Do not claim long-horizon reliability, alignment-complete, or physical isolation.

## Team split

**Talk + screen (Philip):** 2 min script. Mouse on search. Close record only if they ask to see the human step.

**Flower + GitHub (teammate):** Access lands: `flwr login`, `flwr run` with Endeavor, keep the same series. Repo public, no `.venv`, no `.env`, no keys. If StartRun still denied: say freeze, do not debug in front of the jury.

Both: 1 min Q&A. Talk person takes Safety/Impact. Flower person takes Flower/Endeavor.

## When access arrives

Ask Slack for the exact Endeavor model id if `endeavor-1.0` fails.

```bash
cd ~/Desktop/jph/projects/airlock
uv run flwr login supergrid
uv run flwr run . supergrid --federation @philiphimmeroeder/workspace --run-config 'agent.model="endeavor-1.0" agent.input="move"' --stream
# same series, do not switch agent
uv run flwr run . supergrid --federation @philiphimmeroeder/workspace --run-config 'agent.input="second"' --stream
uv run flwr run . supergrid --federation @philiphimmeroeder/workspace --run-config 'agent.input="chair m2"' --stream
```

Use **workspace** (simulation). Do not use **personal** (deployment). That one returns StartRun denied. Skip SuperNodes.

If the Orga UI looks like Claude Code: pick **Endeavor**, same three roles. The gate still runs in our FAB.

## Freeze backup

```bash
uv run python -m agent.demo
cd web && npm run dev
```

Open http://localhost:3000/file
