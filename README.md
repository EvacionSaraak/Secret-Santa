# 🎅 Secret Santa Box Picker

A fun and easy way to organize your Secret Santa gift exchange! Pick a box, discover who you're gifting to, and enjoy the surprise with your friends and family.

![Secret Santa Box Picker Preview](https://github.com/user-attachments/assets/7f9685f9-a090-4f55-ab1f-9d8c449fc547)

## ✨ What is this?

A real-time Secret Santa gift assignment system where everyone picks a box and discovers who they'll be buying a gift for! All selections are synchronized instantly across all devices, so everyone sees updates in real-time.

## 🎁 How It Works (For Participants)

1. **Open the link** your event organizer shared with you
2. **Type your name** in the box - autocomplete will help you find it
3. **Click any available box** to claim it
4. **See your assignment!** You'll instantly see who you're buying a gift for
5. **Keep it secret!** Only you (and the organizer) can see your assignment

That's it! Super simple. 🎉

## 🌟 Features

- ✅ **Instant updates**: See when others pick boxes in real-time
- ✅ **Secret assignments**: Only you see who you're gifting to
- ✅ **Easy to use**: Just type your name and click a box
- ✅ **Fair play**: Can't unpick once you see your assignment
- ✅ **Works everywhere**: Phone, tablet, or computer
- ✅ **No installation**: Just click the link and go!

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

## 📱 Preview

The application features a beautiful purple gradient interface where you can see all boxes in a grid layout. When you pick a box, it highlights in purple with your name!

![Multi-user real-time updates](https://github.com/user-attachments/assets/51f7f485-2ada-4c64-bf7d-32dbem97fe2d)

---

## 🚀 For Event Organizers: Setup Guide

### Quick Setup (No technical skills needed!)

**What you'll need:** A free PubNub account (takes 2 minutes to set up)

1. **Get PubNub API keys** (free): [https://www.pubnub.com/](https://www.pubnub.com/)
   - Sign up for a free account
   - Create a new app
   - Copy your Publish Key and Subscribe Key

2. **Update the keys in your code**:
   - Open `script-pubnub.js` in a text editor
   - Find lines 9-10
   - Paste your keys there

3. **Add your participants**:
   - Open `data/participants.txt` in a text editor
   - Add one name per line (e.g., "Alice Johnson")
   - **Important**: The number of participant names must equal the number of boxes
   - The app will create one box for each participant
   - Save the file
   - Commit the changes to your repository

4. **Enable GitHub Pages**:
   - Go to your repository Settings → Pages
   - Select your branch (usually `main` or `copilot/add-live-updates-feature`)
   - Click Save
   - Wait 1-2 minutes

5. **Share the link!**
   - Your Secret Santa is live at: `https://[your-username].github.io/[repository]/`
   - Share this link with all participants

### 🔥 Firebase Setup (Recommended for Permanent Storage)

**Firebase provides unlimited data retention and real-time sync!**

Instead of PubNub's 7-day limit, Firebase stores your data permanently:
- ✅ **Persistent Storage**: Assignments saved forever, not just 7 days
- ✅ **Real-time Sync**: All users see updates instantly
- ✅ **Free Tier**: Generous limits perfect for Secret Santa
- ✅ **No Re-randomization**: Assignments persist across page refreshes

**Quick Setup:**
1. Create a free Firebase account at [firebase.google.com](https://firebase.google.com/)
2. Create a new project and enable Realtime Database
3. Copy your config values
4. Update `FIREBASE_CONFIG` in `script-pubnub.js`

📖 **Detailed guide**: See [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

### ⏰ Data Retention (PubNub Mode)

**If not using Firebase**, your selections are saved for 7 days with PubNub Message Persistence (free tier).

**Important:** Since the free PubNub tier keeps data for 7 days:
- Run your event within 7 days of the first selection
- Admin should download JSON backups regularly (just in case)
- Perfect for events running through the holiday season

**Backing up your data:**
1. Login as admin
2. Click "Download JSON" button
3. Save the file to your computer
4. If data is lost, use "Upload JSON" to restore

### 👑 Admin Powers

As the event organizer, you have special admin access:

**Login:** Click "Admin Login" button (top-right) and enter password: `SecretSanta2025!`

**What you can do:**
- **View Participants**: Click "Show Participants" to see everyone in a table
  - As admin: See who picked which box and their assignments
  - Regular users only see the list of names (no assignment info)
- See who everyone is gifting to (for troubleshooting)
- Remove people from boxes if they picked wrong
- Download/upload the complete state as JSON
- Clear all users (useful before the real event starts)
- Change your name or any participant's name

**Tip:** Change the admin password in `script-pubnub.js` (line 32) for better security!

### 📝 Managing Participants

**To update the participant list:**

1. Open `data/participants.txt` in a text editor
2. Add or remove names (one per line)
3. **Important**: The number of names must match the number of boxes you want
4. Save the file
5. Commit and push changes to your repository
6. Refresh the application

**Example participants.txt:**
```
Alice Johnson
Bob Smith
Carol Davis
David Wilson
```

This creates 4 boxes with 4 random gift assignments.

**Note:** If you change participants after boxes are selected, you may need to "Reset All" or "Clear All Users" to avoid mismatches.

---

## 🛠️ Advanced Options (Optional)

### Local Development (For Testing)

Test the app on your computer before deploying:

```bash
npm install
npm run dev:local
```

Open `http://localhost:3000` in your browser.

### Cloudflare Workers (Permanent Storage)

For production deployment with unlimited data retention:

```bash
npm install -g wrangler
wrangler login
npm run deploy
```

📖 **Full guide**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📚 Documentation

- [Quick Setup Guide](docs/SETUP_GITHUB_PAGES.md) - Step-by-step with screenshots
- [Cloudflare Deployment](docs/DEPLOYMENT.md) - Advanced production setup
- [Technical Details](docs/IMPLEMENTATION_SUMMARY.md) - For developers

## 💡 Frequently Asked Questions

**Q: How long does my data last?**  
A: Your selections are saved for 7 days with the free PubNub plan. Download a JSON backup for longer storage.

**Q: Can people cheat and see multiple assignments?**  
A: Nope! Once you pick a box, you can't unpick it. Fair play is enforced.

**Q: What if someone picks the wrong box?**  
A: The admin can remove them using the × button on their box, or participants can click "Change Name" to update their identity.

**Q: Can participants change their names?**  
A: Yes! Any participant can click "Change Name" to select a different name from the participants list. This updates their box automatically.

**Q: How do I view all participants?**  
A: Click the "Show Participants" button. Regular users see just the list of names. Admin sees who picked which box and their gift assignments in a detailed table.

**Q: How do I add or remove participants?**  
A: Edit the `data/participants.txt` file, add or remove names (one per line), then commit the changes to your repository. The number of names must equal the number of boxes.

**Q: Can I use this for a large group?**  
A: Yes! It works with any number of participants. Just add all names to `data/participants.txt`.

**Q: Is my data secure?**  
A: The app uses PubNub's encrypted channels. Only participants in your list can access the event.

**Q: Do I need to pay anything?**  
A: Nope! The free PubNub tier works perfectly for Secret Santa events.

---

## 🎄 Project Structure (For Developers)

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

## 🔧 Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Real-time**: PubNub (GitHub Pages) or WebSocket (Cloudflare Workers)
- **Data Persistence**: PubNub Message Persistence (7 days, free tier)
- **State Management**: Durable Objects (Cloudflare) or in-memory (local)
- **Deployment**: GitHub Pages, Cloudflare Workers, or local Node.js

## 📝 License

MIT License - Feel free to use this for your Secret Santa events!

---

**Made with ❤️ for spreading holiday cheer! 🎅🎁**
