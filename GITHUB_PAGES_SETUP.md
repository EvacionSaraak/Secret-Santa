# GitHub Pages Deployment Guide

This guide shows how to deploy the Secret Santa Box Picker to GitHub Pages **without using npm or any build tools**.

## Option 1: PubNub (Recommended for GitHub Pages)

PubNub is a free real-time messaging service that works perfectly with static sites like GitHub Pages.

### Setup Steps

1. **Get Free PubNub API Keys**:
   - Go to [https://www.pubnub.com/](https://www.pubnub.com/)
   - Sign up for a free account
   - Create a new app
   - Copy your **Publish Key** and **Subscribe Key**

2. **Configure the Application**:
   - Open `script-pubnub.js` in your repository
   - Find this section at the top:
     ```javascript
     const PUBNUB_CONFIG = {
         publishKey: 'YOUR_PUBLISH_KEY_HERE',
         subscribeKey: 'YOUR_SUBSCRIBE_KEY_HERE',
         userId: 'user_' + Math.random().toString(36).substring(7)
     };
     ```
   - Replace `YOUR_PUBLISH_KEY_HERE` with your actual Publish Key
   - Replace `YOUR_SUBSCRIBE_KEY_HERE` with your actual Subscribe Key

3. **Rename Files** (Optional - to use as main version):
   - Rename `index-pubnub.html` to `index.html` (backup the old one first)
   - Or update your GitHub Pages settings to use `index-pubnub.html` as the main file

4. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Under "Source", select your branch (usually `main` or `copilot/add-live-updates-feature`)
   - Click "Save"
   - Your site will be available at: `https://[username].github.io/[repository-name]/`

5. **Test Your Deployment**:
   - Open the GitHub Pages URL in multiple browser tabs
   - Enter different names in each tab
   - Select boxes and watch them update in real-time across all tabs!

### Features

✅ **No npm required** - Just HTML, CSS, and JavaScript  
✅ **No build step** - Works directly on GitHub Pages  
✅ **Real-time updates** - Powered by PubNub  
✅ **Free tier** - Up to 200 devices and 1M messages/month  
✅ **One box per user** - Automatically enforced  
✅ **Works everywhere** - Any modern browser  

### File Structure for GitHub Pages

```
your-repository/
├── index-pubnub.html      # Main HTML file (rename to index.html)
├── script-pubnub.js       # PubNub-powered JavaScript
├── styles.css             # Styling (unchanged)
└── README.md              # Documentation
```

### Limitations

- **State persistence**: Selections are only stored in-memory. If all users close their browsers, the state is lost.
- **Concurrent limit**: Free tier supports up to 200 concurrent users
- **Message history**: Limited message history on free tier

### Troubleshooting

**Problem**: "Unable to connect" error  
**Solution**: Check that you've correctly updated the API keys in `script-pubnub.js`

**Problem**: Updates not syncing  
**Solution**: Open browser console and check for errors. Verify your PubNub keys are valid.

**Problem**: GitHub Pages not updating  
**Solution**: GitHub Pages can take a few minutes to update. Try clearing your browser cache.

---

## Option 2: Firebase Realtime Database (Alternative)

If you prefer Firebase over PubNub, follow these steps:

1. **Create Firebase Project**:
   - Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Create a new project (free tier)
   - Enable Realtime Database

2. **Get Configuration**:
   - In Firebase Console, go to Project Settings
   - Copy your Firebase configuration

3. **Update HTML**:
   - Add Firebase SDK to your HTML:
     ```html
     <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-database-compat.js"></script>
     ```

4. **Configure Rules** (in Firebase Console):
   ```json
   {
     "rules": {
       "selections": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```

---

## Option 3: Cloudflare Workers (For Advanced Users)

If you want persistent state and need more than the free tier limits:

1. Follow the instructions in `DEPLOYMENT.md`
2. Deploy to Cloudflare Workers
3. Point your GitHub Pages to use the Cloudflare Worker URL

---

## Comparison

| Feature | PubNub | Firebase | Cloudflare Workers |
|---------|--------|----------|-------------------|
| Setup Complexity | ⭐ Easy | ⭐⭐ Moderate | ⭐⭐⭐ Advanced |
| npm Required | ❌ No | ❌ No | ✅ Yes |
| GitHub Pages Compatible | ✅ Yes | ✅ Yes | ⚠️ External |
| Persistent State | ❌ No | ✅ Yes | ✅ Yes |
| Free Tier | 200 devices | Unlimited | 100K requests/day |
| Best For | Quick setup | Persistent storage | Production use |

---

## Recommended Approach

**For GitHub Pages without npm**: Use **PubNub** (Option 1)  
**For persistent storage**: Use **Firebase** (Option 2)  
**For production**: Use **Cloudflare Workers** (Option 3)

---

## Support

If you need help:
1. Check the browser console for error messages
2. Verify your API keys are correct
3. Make sure GitHub Pages is enabled in repository settings
4. Try opening the page in an incognito window
