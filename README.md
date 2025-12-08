# Secret-Santa
A real-time Secret Santa box picker with live updates across all users.

![Secret Santa Box Picker Preview](https://github.com/user-attachments/assets/7f9685f9-a090-4f55-ab1f-9d8c449fc547)

## Features
- **Real-time synchronization**: See updates immediately when anyone selects a box
- **One box per user**: Each user can only select one box at a time
- **Live updates**: Changes are reflected instantly on all connected users' screens
- **60 boxes**: Pick from 60 different boxes
- **Persistent selections**: Selections are maintained with Cloudflare Durable Objects

## Preview

The application features a beautiful gradient interface where users can see all 60 boxes in a grid layout. Selected boxes are highlighted in purple with the user's name, while available boxes remain light blue.

![Multi-user real-time updates](https://github.com/user-attachments/assets/51f7f485-2ada-4c64-bf7d-32dbeb97fe2d)

## Quick Start (Local Development)

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

**Note:** The local server (`dev:local`) uses a simple Node.js WebSocket server for testing. For production deployment, use Cloudflare Workers (see below).

## Deployment

### Cloudflare Workers (Production)

This application is designed to run on Cloudflare Workers with Durable Objects for real-time WebSocket support.

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

The application will be deployed with:
- WebSocket support via Durable Objects
- Global edge network for low latency
- Automatic scaling
- Persistent state storage

### Local Development with Wrangler

To test with Cloudflare Workers locally:

```bash
npm run dev
```

This uses Wrangler's local development mode which simulates the Cloudflare Workers environment.

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
- **Backend**: Cloudflare Workers (production) or Node.js (development)
- **Real-time**: WebSocket with Durable Objects (production) or ws package (development)
- **Storage**: Durable Objects persistent storage (production) or in-memory (development)

## Troubleshooting

### "Unable to connect" error

If you see a connection error:

1. **For local development**: Make sure you're running `npm run dev:local` (not just opening the HTML file)
2. **For Cloudflare deployment**: Run `npm run dev` or `npm run deploy` first
3. **Check the console**: Open browser DevTools to see detailed error messages

### Port already in use

If port 3000 is already in use, you can change it:
```bash
PORT=8080 npm run dev:local
```



