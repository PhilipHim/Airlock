# Rules

Kleinstes System das den Shared Channel schützt. Morgen gewinnt ein laufender SuperGrid-Pfad, nicht mehr Abstraktion.

## Leiter (Ponytail)

1. Muss das existieren? Sonst weg.
2. Liegt es schon in `agent/` oder `data/`? Dann ändern, nicht neu.
3. Stdlib oder Flower Runtime zuerst.
4. Oberfläche: Next.js in `web/` (`npm run dev`). Gate bleibt Python.
5. Eine Zeile wenn eine Zeile reicht.

Nie streichen: Gate vor jedem Shared-Write. Fixtures nie in `Context`. Isolation ehrlich als Anwendungsebene. Human Release vor öffentlicher Akte.

## Flower

Ein FAB, nur `agentapp`. Rollen über `agent.input` (`move`, `second`, `chair`). Kein Agent-Switch: der löscht die Series. Events mit `agent.events.emit`. Ledger in `Context` `config_records` (`ledger`). `context.locked()` nur wenn die Runtime es hat.

## Text

Deutsch, du. Ein Gedanke pro Satz, Länge wechseln.
Buttons: Verb plus Objekt (`Akte schließen`, `Letzten Lauf laden`).
Kein Gedankenstrich als Stil. Kein „Nicht X, sondern Y“. Kein seamless, unlock, robust, next-gen.
Fehler sagt was passiert ist und was man tun kann.
Keine Title Case. Keine Emoji auf Buttons.

## UI

Tokens aus DESIGN.md. Karo als oranges Band auf Beige, nicht als Haarlinie. Grün selten. Rot nur beim Block.
Karten nur wenn sie eine echte Gruppe bündeln. Animation nur Feedback.

## AI im Produkt

Modell formuliert Anträge. Python entscheidet Shareable vs Private.
Loading sichtbar. Unsicherheit nicht als Fakt.
Nie so tun als wäre Isolation physisch, solange ein Prozess beide Dateien laden könnte.

## Priorität

Correctness, Security, Simplicity, UX, Maintainability.
Modify > create. Kein Drive-by-Rename.
