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

## Deployment

### Cloudflare Workers (Recommended)

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
wrangler deploy
```

The application will be deployed with:
- WebSocket support via Durable Objects
- Global edge network for low latency
- Automatic scaling
- Persistent state storage

### Local Development

For local testing with Cloudflare Workers:

```bash
wrangler dev
```

Then open your browser to the URL provided by Wrangler.

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
- **Backend**: Cloudflare Workers
- **Real-time**: WebSocket with Durable Objects
- **Storage**: Durable Objects persistent storage


