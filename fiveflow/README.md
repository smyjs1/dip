# GOGYO · 五行

A bilingual English/Japanese hackathon prototype that turns the traditional Five Elements into a small, personalized city experience. Enter a birthday, choose a destination by voice or text, and receive a location and suggested activity based on your day element and today's element.

## How it works

1. The browser computes a simplified day-stem element from the birthday and the current Japanese date. This is a cultural experience, not a complete Four Pillars reading. The birthday stays in the browser.
2. Tavily searches for relevant, real visitor destinations in the chosen area.
3. An Ollama model suggests an activity and symbolic intention using the search results. The response retains a source link; the UI displays an embedded Google map.
4. The interface can be switched between English and Japanese. Voice recognition uses the browser's speech service when supported.

## Repository layout

- `dist/` — static HTML, CSS and JavaScript; includes the Three.js visual scene.
- `worker/recommend.js` — Tavily search, venue screening and Ollama recommendation.
- `worker/translate.js` — translates an existing recommendation without changing its source.
- `scripts/build.mjs` — packages the frontend and API handlers into a single Cloudflare Worker at `dist/server/index.js`.

## Run and deploy

For a frontend-only preview, run `python3 -m http.server 8000 --directory dist` from this directory and open `http://localhost:8000`. The API is not available in this static preview, so live searches require a Worker deployment.

Run `node scripts/build.mjs` to build the Worker. Deploy `dist/server/index.js` to a Cloudflare Worker-compatible hosting environment, and set these runtime environment variables there:

- `TAVILY_API_KEY` — Tavily API key, stored as a secret.
- `GPU_ORIGIN` — HTTPS origin of an Ollama server, stored as a secret when the endpoint is private or unauthenticated.
- `GPU_MODEL` — optional Ollama model name; defaults to `qwen3.5:9b`.

No API credentials belong in this repository. The Three.js scene loads the library from a pinned CDN version and falls back to a static illustration when unavailable. Browsers vary in their Web Speech support; manual location entry is always available.

Recommendations are generated from third-party search snippets and may be incomplete or inaccurate. Check the linked source for location, opening times and availability before visiting.
