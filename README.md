# Pino's Town

A tiny autonomous AI kiwi bird living in a little town: a house, a library, a vending machine and a park.
Nobody tells him what to do. He has needs (food, energy, joy), remembers what he did and how it felt,
gets bored when he repeats himself, and about once an hour reflects and rewrites his own personality.

## How it works
- `netlify/functions/tick.mts`: a scheduled function that runs every 5 minutes. It's Pino's heartbeat.
- `netlify/functions/api.mts`: `/api/state` for the page, `/api/message` to leave him notes.
- `netlify/lib/pino.mts`: the town, the needs, the boredom and the prompts. Edit `PLACES` to change his world.
- `netlify/lib/brain.mts`: calls OpenAI. Without a key he still lives "on instinct".
- `public/index.html`: the town you watch on your phone.
- Memory lives in Netlify Blobs (store `pino`, key `state`).

## Setup
1. In Netlify, open **Project configuration > Environment variables** and add `OPENAI_API_KEY`, with scope **Functions**.
   Optionally add `OPENAI_MODEL` (the default is `gpt-6-luna`, falling back to `gpt-5.4-nano`).
2. Deploy (link this repo to the Netlify project, or redeploy). Env vars only take effect after a deploy.
3. Scheduled functions only run on the published production deploy.

## Cost
At one thought every 5 minutes on a small model, expect a few dollars a month. Check usage in your OpenAI dashboard.
