# DESIGN.md

**Project:** AIRLOCK  
**One-liner:** Zwei Firmen-Agenten klären einen Vorfall, ohne Rohdaten zu teilen.  
**Audience:** Jury und Team, Screen an der Wand, plus du lokal im Browser.  
**Branche:** tools, gebrochen zu bold brand (Plates Meal Craft, nicht Burger-Copy)  
**Mood:** Schloss, Karo, Blume  
**Status:** shipping  
**Stack:** Next.js + Tailwind in `web/`. `npm run dev`. Python-Gate bleibt in `agent/`.

## Brand premise

**Das Wort:** Kammer  
Die gemeinsame Akte beginnt leer. Du siehst durchs Schloss, nicht durch die Wand.

## Signature element

1. Schlüsselloch mit Blumen (Flower: nur durch die Kammer).  
2. Karo orange auf Beige, breit wie bei Plates Meal, nicht als 16px-Streifen.  
3. Display-Schrift wie das Blob-Alphabet (Bagel Fat One). Headline ist das Plakat.

## Refs

| Ref | Borrow | Nicht auf die Seite |
|-----|--------|---------------------|
| Plates Meal | Riesen-Type, Foto als Objekt, Karo-Band, runder CTA | Burger, Preise, Quick Order, Blau-Weiß |
| Keyhole | Hero-Foto, Flower-Hint | nichts 1:1 als Logo klauen, Bild liegt lokal |
| Blob-Type | Display für AIRLOCK, Kammer, 0 | Body bleibt IBM Plex Sans |
| Aeline | Luft, eine echte große Zahl | 520k, 3D-Karten, Lime, Inter, Testimonials |
| Haven | Foto füllt den ersten Screen | Login-Pills, raised-20k |

Karo-Farben: `#E36B2C` und `#F3EFE6`. Nicht Blau-Weiß.

## Tokens

```
--paper:  #F3EFE6
--ink:    #1C1914
--muted:  #5C564C
--line:   #D9D0BE
--accent: #E36B2C
--field:  #3F7A4A
--block:  #B42318
```

## Routen

- `/` Landing
- `/akte` drei Spalten, Freeze aus `ui/last-run.json`

## Copy

PITCH.md. Kein Gedankenstrich. Kein „Building the future with AI“.

## Entscheidungslog

- 2026-09-14: Statisches HTML war zu dünn und niemand fand die Datei. Web-App unter `web/`, ein Link: localhost:3000.
- 2026-09-14: Karo wird zum Plates-Band in Koralle/Beige. Keyhole wird Hero. Blob-Type für Headlines.
