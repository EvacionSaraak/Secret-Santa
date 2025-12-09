# Secret-Santa
A real-time Secret Santa gift assignment system with live updates across all users.

![Secret Santa Box Picker Preview](https://github.com/user-attachments/assets/7f9685f9-a090-4f55-ab1f-9d8c449fc547)

## Features
- **Real-time synchronization**: See updates immediately when anyone selects a box
- **Gift assignments**: Each box reveals who you should gift to when selected
- **Privacy protection**: Only you and admin can see who you're gifting to
- **One box per user**: Each user can only select one box at a time
- **Participant validation**: Only authorized participants can log in via autocomplete
- **Admin controls**: Full visibility and management for event organizer
- **Autocomplete selection**: Easy name selection from participants list
- **Camel Case formatting**: All names displayed consistently
- **Dynamic box sizing**: Boxes auto-expand for long names
- **Multiple deployment options**: GitHub Pages, Local, or Cloudflare Workers

## Project Structure

```
Secret-Santa/
├── index.html                  # Main application file
├── script-pubnub.js           # PubNub integration script
├── package.json               # NPM configuration
├── README.md                  # This file
├── src/                       # Source files
│   ├── css/                   # Stylesheets
│   │   └── styles.css        # Main styles
│   └── js/                    # JavaScript files
│       └── dev-server.js     # Local development server
├── data/                      # Data files
│   ├── participants.txt      # List of all participants (edit this!)
│   ├── secret-santa-state.json  # Example state structure
│   └── sample-event.json     # Sample event data
├── docs/                      # Documentation
│   ├── DEPLOYMENT.md         # Cloudflare deployment guide
│   ├── SETUP_GITHUB_PAGES.md # Quick GitHub Pages setup
│   ├── GITHUB_PAGES_SETUP.md # Comprehensive Pages guide
│   └── IMPLEMENTATION_SUMMARY.md  # Technical details
├── cloudflare/                # Cloudflare Workers files
│   ├── worker.js             # Worker with Durable Objects
│   ├── build.js              # Build script
│   └── wrangler.toml         # Wrangler configuration
└── backups/                   # Backup/old files
```

## Preview

The application features a beautiful gradient interface where users can see all boxes in a grid layout. Selected boxes are highlighted in purple with the picker's name (for admin) or "Claimed" (for regular users).

![Multi-user real-time updates](https://github.com/user-attachments/assets/51f7f485-2ada-4c64-bf7d-32dbem97fe2d)

## Quick Start Options

### Option 1: GitHub Pages (Recommended - No npm required!)

Perfect if you want to deploy without installing anything:

1. **Get free PubNub API keys**: [https://www.pubnub.com/](https://www.pubnub.com/)
2. **Update** `script-pubnub.js` with your keys (lines 9-10)
3. **Edit** `data/participants.txt` with your participant names (one per line)
4. **Enable GitHub Pages** in repository Settings → Pages
5. **Done!** Your app is live at `https://[username].github.io/[repository]/`

📖 **Detailed guide**: See [docs/SETUP_GITHUB_PAGES.md](docs/SETUP_GITHUB_PAGES.md)

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

3. Open your browser to: `http://localhost:3000`

### Option 3: Cloudflare Workers (Production)

For production deployment with persistent state:

1. Install Wrangler globally:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Build and deploy:
```bash
npm run deploy
```

📖 **Detailed guide**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Customizing Participants

Edit `data/participants.txt` - one name per line:

```
Alice Johnson
Bob Smith
Carol Williams
...
```

- Total boxes will automatically equal total participants
- Names are auto-converted to Camel Case
- Commit changes to repository for GitHub Pages deployment

## Admin Access

**Admin Username:** `EvacionSaraak` (hardcoded)  
**Admin Password:** `SecretSanta2025!` (configurable in script-pubnub.js)

Admin can:
- See all picker names and assignments
- Remove users from boxes
- Download/upload JSON state
- Reset all selections
- Change user names

**Admin Login Button:** Always visible in top-right corner of header

## How It Works

1. **Participants** select their name from autocomplete dropdown
2. **Click a box** to claim it and see gift assignment
3. **Privacy**: Only picker and admin see the assignment
4. **Real-time**: All changes sync instantly via PubNub
5. **One box per user**: Selecting new box auto-unselects previous

## Documentation

- [Quick GitHub Pages Setup](docs/SETUP_GITHUB_PAGES.md) - 5-minute guide
- [Comprehensive GitHub Pages Guide](docs/GITHUB_PAGES_SETUP.md) - Detailed instructions
- [Cloudflare Workers Deployment](docs/DEPLOYMENT.md) - Production deployment
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Technical details

## Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Real-time**: PubNub (GitHub Pages) or WebSocket (Cloudflare Workers)
- **State Management**: Durable Objects (Cloudflare) or in-memory (local)
- **Deployment**: GitHub Pages, Cloudflare Workers, or local Node.js

## License

MIT License - See LICENSE file for details
