# AIRLOCK table pitch

**Format:** 2 minutes talk, 1 minute questions.  
**Language:** English. One thought per sentence.  
**Screen:** http://localhost:3000/file  
**Not the screen:** landing, SuperGrid, terminal, this file.

Jury criteria: Impact, Innovation, Flower, Execution, Presentation, Safety. Bonus: Flower Endeavor.

## Before they reach the table

Laptop unlocked. Browser on `/file`, not `/`. Search box already `Anna Müller`. Result already `0 hits in Context`. Do not start the server while they stand there. Do not open SuperGrid during the visit.

What the screen must already show:

- File A has names. File B has a count. Shared channel has a block and a count.
- Block: `m1` IDENTITY_DISCLOSURE.
- Released: `2 customers overlap on batch BAT-042.`
- Search `Anna Müller`: 0.

If the page is empty: `uv run python -m agent.demo` then `cd web && npm run dev`. Then stop talking and wait.

## Speak this (about 2 minutes)

Agents leak the moment they collaborate. Names and IDs travel with the useful count. Firms then stop the agents talking.

AIRLOCK is a door on the shared channel. A sentence crosses only if three checks pass. The other agent can second it from its own file. Python allows the fields. A human closes the record.

Watch the screen. Agent A proposed a name. The middle blocked it. Search Flower Context for Anna Müller. Zero hits. The name stays in File A. It never entered the ledger.

The count did. Two customers overlap on batch BAT-042. Agent B could support that from its own list. A human still had to press Close record.

The model may propose the sentence. The gate is still Python. A prompt is hope. You can grep the Context.

Built today: gate, seconding, human release, AgentApp, Context ledger. Honest limit: two JSON files, one process. Next: one Flower node per company.

## If they ask (1 minute)

**Is this just a filter?**  
Search the Context. Then run two. The name is not proposed again. That is policy memory, not a regex in the chat window.

**Are these real agents?**  
One AgentApp, one series, three roles: move, second, chair. Shared ledger. Private files.

**Why Flower?**  
Context is the proof. SuperGrid is the runtime. Endeavor may propose. Python decides.

**Why not a longer prompt?**  
You would have to trust us. Here you can look.

**Is the isolation physical?**  
No. Application-level today. Production would be one node per org.

**Did Endeavor actually run?**  
If Flower person confirmed a live propose before the visit: yes, Endeavor proposed, Python gated, name still 0. If not: the gate is proven locally and on SuperGrid. The model call is next, not the claim.

## How each criterion is scored (do not read this aloud)

| Criterion | How the 2 minutes earn it |
|-----------|---------------------------|
| Impact | First 20 seconds: leak, then firms stop collaborating. |
| Safety | Search 0. Gate is code. Human still closes. |
| Innovation | Seconding plus Python. Not a chatbot filter. |
| Flower | AgentApp, Context, series, events. Point at `/file`, not the docs. |
| Execution | Screen already showing block + 2 + 0. Do not boot during the visit. |
| Presentation | One laptop. `/file`. No scrolling the landing. |
| Endeavor bonus | Only if the live propose is confirmed. Then: model proposed, Python gated. `agent.model=endeavor-1.0`. |

## Do not say

Do not claim long-horizon reliability.  
Do not claim alignment is solved.  
Do not claim physical isolation.  
Do not claim Cambridge winners.  
Do not claim this is the biggest AI compliance problem.  
Do not debug in front of the jury. Freeze UI is the backup.

## Who does what at the table

**Talk + screen:** this script. Mouse on the search box. Stay on `/file`. Close record only if they ask and the button is live.

**Flower:** stay quiet unless they ask about SuperGrid, AgentApp, or Endeavor. Then: workspace federation, one series, three roles, Context search. If StartRun is denied, say freeze. Do not open a terminal.

Both take Q&A. Talk person takes Safety and Impact. Flower person takes Flower and Endeavor.

## Who does what until then

**Talk person:** rehearse this out loud once with a timer. Keep `/file` ready. Clone is https://github.com/PhilipHim/Airlock

**Flower person:** prove Endeavor and finish the live series. Exact commands are in README.md. Use `@philiphimmeroeder/workspace`. Never `@philiphimmeroeder/personal`.
