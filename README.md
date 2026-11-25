# Pino's Town

A tiny autonomous AI kiwi bird living in a little town: a house, a library, a vending machine and a park.
Nobody tells him what to do. He has needs (food, energy, joy), remembers what he did and how it felt,
gets bored when he repeats himself, and about once an hour reflects and rewrites his own personality.

## How it works
- `netlify/functions/tick.mts`: a scheduled function that runs every 5 minutes. It's Pino's heartbeat.
- `netlify/functions/api.mts`: `/api/state` for the page; `/api/talk` (instant chat), `/api/pet`, `/api/treat`, `/api/message` (notes).
- `netlify/lib/pino.mts`: the town, the needs, the boredom and the prompts. Edit `PLACES` to change his world.
- `netlify/lib/brain.mts`: calls Claude (`ANTHROPIC_API_KEY`), or OpenAI (`OPENAI_API_KEY`) if no Claude key is set. Without a key he still lives "on instinct".
- `public/index.html`: the 3D town (three.js, loaded from jsDelivr). Every model, Pino included, is built from simple shapes in code, so there's nothing to license.
- Visitor actions are stored as separate `events/` keys and folded into Pino's memory on his next heartbeat.
- Memory lives in Netlify Blobs (store `pino`, key `state`).

## Setup
1. In Netlify, open **Project configuration > Environment variables** and add `ANTHROPIC_API_KEY`, with scope **Functions**.
   Optionally add `ANTHROPIC_MODEL` (the default is `claude-haiku-5-5`, falling back to `claude-haiku-4-5`).
2. Deploy (link this repo to the Netlify project, or redeploy). Env vars only take effect after a deploy.
3. Scheduled functions only run on the published production deploy.

## Cost
At one thought every 5 minutes on a small model, expect a few dollars a month. Check usage at console.anthropic.com.

## Library
`public/books/` holds 10 public-domain children's books (Project Gutenberg texts, first published 1812-1922, authors long deceased),
split into pages by `scripts/make_books.py`. At the library Pino picks a book, reads one page per moment, remembers his place,
and reacts to what he read (shown in the Books tab).

## Drawings
When Pino draws, he first decides what to draw, then draws it himself as an SVG: subject, style and colours are entirely his choice.
The only limits are technical safety (no scripts or outside images); pictures are shown as images in the Drawings tab.
