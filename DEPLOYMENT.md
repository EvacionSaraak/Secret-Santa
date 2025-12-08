# Deployment Guide

## Cloudflare Workers Deployment

This application uses Cloudflare Workers with Durable Objects for real-time WebSocket support.

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

### Local Development

To test locally with Wrangler:

```bash
npm run dev
```

This will:
- Build the worker bundle
- Start a local development server
- Open the application in your browser
- Enable hot-reload for development

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
