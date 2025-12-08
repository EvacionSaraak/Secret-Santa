# Quick Setup Instructions for GitHub Pages

## Step-by-Step Setup (5 minutes)

### 1. Get PubNub API Keys (Free)

1. Go to **https://www.pubnub.com/**
2. Click "Sign Up" (or "Get Started")
3. Create a free account
4. Create a new app (name it anything, e.g., "Secret Santa")
5. Copy your **Publish Key** and **Subscribe Key**

### 2. Configure the Application

1. Open `script-pubnub.js` in your code editor
2. Find lines 3-7 (near the top):
   ```javascript
   const PUBNUB_CONFIG = {
       publishKey: 'YOUR_PUBLISH_KEY_HERE',
       subscribeKey: 'YOUR_SUBSCRIBE_KEY_HERE',
       userId: 'user_' + Math.random().toString(36).substring(7)
   };
   ```
3. Replace `YOUR_PUBLISH_KEY_HERE` with your actual Publish Key
4. Replace `YOUR_SUBSCRIBE_KEY_HERE` with your actual Subscribe Key
5. Save the file

### 3. Rename Files (Choose one option)

**Option A: Use as main index (recommended)**
```bash
mv index.html index-websocket.html
mv index-pubnub.html index.html
```

**Option B: Keep both versions**
- Keep files as-is
- Access via: `https://[username].github.io/[repo]/index-pubnub.html`

### 4. Enable GitHub Pages

1. Push your changes to GitHub
2. Go to your repository on GitHub
3. Click **Settings** → **Pages**
4. Under "Source", select your branch (e.g., `main` or current branch)
5. Click **Save**
6. Wait 1-2 minutes for GitHub Pages to build

### 5. Test Your Site

1. Go to: `https://[username].github.io/[repository-name]/`
2. Open in 2+ browser tabs
3. Enter different names
4. Select boxes and watch real-time updates! 🎉

## Example PubNub Configuration

After getting your keys, your `script-pubnub.js` should look like:

```javascript
const PUBNUB_CONFIG = {
    publishKey: 'pub-c-1234abcd-5678-efgh-ijkl-mnopqrstuvwx',
    subscribeKey: 'sub-c-9876zyxw-4321-vusr-qpon-mlkjihgfedcb',
    userId: 'user_' + Math.random().toString(36).substring(7)
};
```

## Troubleshooting

### "Connection error" message
- Check that you've updated BOTH keys in `script-pubnub.js`
- Make sure keys don't have extra quotes or spaces
- Verify keys are valid in PubNub dashboard

### "Not updating across tabs"
- Check browser console (F12) for errors
- Make sure all tabs are using the same PubNub keys
- Try refreshing all tabs

### "GitHub Pages shows old version"
- Wait 2-3 minutes after pushing changes
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache

## Need Help?

- PubNub Documentation: https://www.pubnub.com/docs/
- GitHub Pages Help: https://docs.github.com/en/pages
- Check browser console (F12) for error messages

## What's Included

✅ No npm or build tools needed
✅ Works on any static hosting (GitHub Pages, Netlify, etc.)
✅ Real-time updates using PubNub
✅ Free tier supports up to 200 devices
✅ One box per user enforcement
✅ Mobile-friendly responsive design

Enjoy your Secret Santa! 🎅🎁
