# Cloudflare Workers Files

This directory contains files for deploying to Cloudflare Workers.

## Files

- **worker.js** - Cloudflare Worker with Durable Objects implementation
  - Handles WebSocket connections
  - Manages state with Durable Objects
  - Provides persistent storage
  
- **build.js** - Build script for bundling static files into worker
  - Inlines HTML, CSS, and JS into the worker
  - Prepares for deployment
  
- **wrangler.toml** - Cloudflare Wrangler configuration
  - Project settings
  - Durable Object bindings

## Deployment

```bash
npm run build
npm run deploy
```

See `docs/DEPLOYMENT.md` for detailed instructions.
