# Secret-Santa
A real-time Secret Santa box picker with live updates across all users.

![Secret Santa Box Picker Preview](https://github.com/user-attachments/assets/7f9685f9-a090-4f55-ab1f-9d8c449fc547)

## Features
- **Real-time synchronization**: See updates immediately when anyone selects a box
- **One box per user**: Each user can only select one box at a time
- **Live updates**: Changes are reflected instantly on all connected users' screens
- **60 boxes**: Pick from 60 different boxes
- **Multiple deployment options**: GitHub Pages, Local, or Cloudflare Workers

## Preview

The application features a beautiful gradient interface where users can see all 60 boxes in a grid layout. Selected boxes are highlighted in purple with the user's name, while available boxes remain light blue.

![Multi-user real-time updates](https://github.com/user-attachments/assets/51f7f485-2ada-4c64-bf7d-32dbeb97fe2d)

## Quick Start Options

### Option 1: GitHub Pages (No npm required!)

Perfect if you want to deploy without installing anything:

1. **Get free PubNub API keys**: [https://www.pubnub.com/](https://www.pubnub.com/)
2. **Update** `script-pubnub.js` with your keys
3. **Enable GitHub Pages** in repository settings
4. **Done!** Your app is live at `https://[username].github.io/[repository]/`

📖 **Detailed guide**: See [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md)

### Option 2: Local Development

For quick local testing with WebSocket support:

1. Install dependencies:
```bash
npm install
```

2. Run the local development server:
```bash
npm run dev:local
```

3. Open your browser to:
```
http://localhost:3000
```

4. Open multiple browser tabs/windows to test multi-user functionality!

**Note:** The local server (`dev:local`) uses a simple Node.js WebSocket server for testing. For production deployment, use GitHub Pages or Cloudflare Workers.

### Option 3: Cloudflare Workers (Production)

For persistent state and global edge deployment:

```bash
npm install -g wrangler
wrangler login
npm run build
npm run deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

## Deployment Comparison

| Method | Setup | npm Required | Persistent State | Best For |
|--------|-------|--------------|------------------|----------|
| **GitHub Pages + PubNub** | ⭐ Easy | ❌ No | ❌ No | Quick sharing, no setup |
| **Local Development** | ⭐⭐ Moderate | ✅ Yes | ❌ No | Testing |
| **Cloudflare Workers** | ⭐⭐⭐ Advanced | ✅ Yes | ✅ Yes | Production |

## How to Use

1. When you first open the app, enter your name
2. Click on any available box to select it
3. You can only select one box at a time - selecting a new box will automatically unselect your previous choice
4. Click your own box to unselect it
5. See real-time updates as other users select their boxes

## Features

- **Download JSON**: Export all current selections
- **Upload JSON**: Import previously saved selections
- **Reset All**: Clear all selections (use with caution!)

## Technology

- **Frontend**: HTML, CSS, JavaScript
- **Real-time Options**:
  - PubNub (for GitHub Pages)
  - WebSocket with Node.js (for local dev)
  - Durable Objects (for Cloudflare Workers)

## Troubleshooting

### "Unable to connect" error

**For GitHub Pages:**
1. Make sure you've updated your PubNub keys in `script-pubnub.js`
2. Check browser console for error messages
3. Verify GitHub Pages is enabled in repository settings

**For local development:**
1. Make sure you're running `npm run dev:local`
2. Don't just open the HTML file directly

**For Cloudflare:**
1. Run `npm run dev` or `npm run deploy` first

### Port already in use

If port 3000 is already in use, you can change it:
```bash
PORT=8080 npm run dev:local
```



