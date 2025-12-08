# Secret-Santa
A real-time Secret Santa box picker with live updates across all users.

## Features
- **Real-time synchronization**: See updates immediately when anyone selects a box
- **One box per user**: Each user can only select one box at a time
- **Live updates**: Changes are reflected instantly on all connected users' screens
- **60 boxes**: Pick from 60 different boxes
- **Persistent selections**: Selections are maintained on the server

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser to:
```
http://localhost:3000
```

4. Enter your name and start selecting boxes!

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
- **Backend**: Node.js, Express
- **Real-time**: Socket.IO for WebSocket communication

