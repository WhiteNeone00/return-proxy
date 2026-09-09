# Return Proxy

Cloudflare Worker for returning branded error pages when an upstream request fails.

## Deploy

From this folder:

```sh
npx wrangler deploy
```

That is the normal deploy flow for this project.

## Notes

- The worker checks the upstream once and returns a safe fallback page on failure.
- It handles common statuses like 404, 502, 503, and 504.
- The main config is in `wrangler.toml` and the worker code is in `src/worker.js`.
