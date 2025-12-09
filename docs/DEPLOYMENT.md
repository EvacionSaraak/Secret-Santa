# Deployment Guide

## Local Development (Quick Start)

The easiest way to test the application locally is using the development server:

### Prerequisites

- Node.js installed (v16 or higher)

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev:local
   ```

3. **Open your browser**:
   ```
   http://localhost:3000
   ```

4. **Test with multiple users**:
   - Open multiple browser tabs or windows
   - Enter different names in each
   - Watch real-time updates across all tabs!

### How it works

The `dev:local` command runs a simple Node.js server (`dev-server.js`) that:
- Serves the static HTML, CSS, and JavaScript files
- Provides a WebSocket server for real-time communication
- Stores selections in memory (resets when server restarts)

**Note:** This is for development/testing only. For production, deploy to Cloudflare Workers.

---

## Cloudflare Workers Deployment

This application is designed to run on Cloudflare Workers with Durable Objects for real-time WebSocket support.

### Prerequisites

1. A Cloudflare account (free tier works)
2. Node.js installed (v16 or higher)
3. Wrangler CLI installed globally

### Step-by-Step Deployment

1. **Install Wrangler globally** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```
   This will open a browser window for authentication.

3. **Build the worker**:
   ```bash
   npm run build
   ```
   This bundles the HTML, CSS, and JavaScript files into the worker.

4. **Deploy to Cloudflare**:
   ```bash
   npm run deploy
   ```
   or directly:
   ```bash
   wrangler deploy
   ```

5. **Access your application**:
   After deployment, Wrangler will output a URL like:
   ```
   https://secret-santa-box-picker.<your-subdomain>.workers.dev
   ```

### Local Development with Cloudflare Workers

To test locally with Wrangler (simulates Cloudflare environment):

```bash
npm run dev
```

This will:
- Build the worker bundle
- Start a local development server with Wrangler
- Simulate Durable Objects locally
- Enable hot-reload for development

**Advantages:**
- Tests the exact production environment
- Verifies Durable Objects behavior
- Catches deployment issues early

**Note:** The first time you run this, Wrangler might need to set up local development dependencies.

### Features

- **Global Edge Network**: Your application runs on Cloudflare's edge network for low latency worldwide
- **Durable Objects**: Persistent WebSocket connections and state storage
- **Auto-scaling**: Automatically handles any number of concurrent users
- **Zero Cold Starts**: WebSocket connections remain active on Durable Objects

### Cost

- Free tier includes:
  - 100,000 requests/day
  - 10ms CPU time per request
  - Durable Objects with reasonable limits
  
This is sufficient for most Secret Santa events!

### Troubleshooting

**Issue**: `Error: No durable object namespace found`
- **Solution**: Make sure you've deployed the worker at least once to create the Durable Object namespace

**Issue**: `WebSocket connection failed`
- **Solution**: Ensure you're using HTTPS (required for WebSocket in production)

**Issue**: Build fails
- **Solution**: Run `npm install` first, then `npm run build`

**Issue**: "Unable to connect" in browser
- **Solution**: 
  - For local testing: Use `npm run dev:local` or `npm run dev`
  - For production: Deploy with `npm run deploy` first
  - Don't just open `index.html` directly in the browser

### Configuration

The application is configured via `wrangler.toml`:

```toml
name = "secret-santa-box-picker"
main = "dist/worker.js"
compatibility_date = "2024-12-01"

[durable_objects]
bindings = [
  { name = "SECRET_SANTA_ROOM", class_name = "SecretSantaRoom" }
]
```

You can customize:
- `name`: Change the worker name (affects the URL)
- `compatibility_date`: Update for newer Cloudflare features

### Monitoring

After deployment, you can monitor your application:

1. Visit the Cloudflare dashboard
2. Navigate to Workers & Pages
3. Click on your worker
4. View metrics, logs, and analytics

---

## Comparison: Local vs Production

| Feature | Local Dev (`dev:local`) | Cloudflare Workers |
|---------|------------------------|-------------------|
| Setup | Simple, just `npm install` | Requires Cloudflare account |
| WebSocket | Node.js `ws` package | Durable Objects |
| State | In-memory (temporary) | Persistent storage |
| Scaling | Single server | Global edge network |
| Cost | Free | Free tier available |
| Best for | Testing, development | Production use |

## Next Steps

1. Test locally with `npm run dev:local`
2. Deploy to Cloudflare with `npm run deploy`
3. Share the URL with your Secret Santa participants!

