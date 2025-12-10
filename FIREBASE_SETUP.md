# Firebase Setup Guide for Secret Santa

This guide explains how to set up Firebase Realtime Database for persistent storage of Secret Santa assignments.

## Why Firebase?

Firebase provides:
- **Persistent Storage**: Box assignments are saved permanently, not just for 1 week
- **Real-time Sync**: All users see updates instantly across devices
- **Free Tier**: Generous free tier that's perfect for Secret Santa events
- **No Randomization**: Assignments are created once and persist across sessions

## Setup Steps

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "secret-santa-2025")
4. Disable Google Analytics (optional for this project)
5. Click "Create project"

### 2. Enable Realtime Database

1. In your Firebase project, click "Realtime Database" in the left menu
2. Click "Create Database"
3. Choose a location (select the one closest to your users)
4. Start in **test mode** for now (we'll secure it later)
5. Click "Enable"

### 3. Get Your Configuration

1. Click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (`</>`) to add a web app
5. Give your app a nickname (e.g., "Secret Santa Web")
6. Don't check "Firebase Hosting" unless you want to use it
7. Click "Register app"
8. Copy the `firebaseConfig` object

### 4. Update Your Code

Open `script-pubnub.js` and find the `FIREBASE_CONFIG` section at the top:

```javascript
const FIREBASE_CONFIG = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

Replace the placeholder values with your actual Firebase configuration.

### 5. Set Up Security Rules (Important!)

1. In Firebase Console, go to "Realtime Database"
2. Click on the "Rules" tab
3. Replace the default rules with:

```json
{
  "rules": {
    "secretSanta": {
      ".read": true,
      ".write": true
    }
  }
}
```

**For production**, you should add authentication and more restrictive rules.

### 6. Test Your Setup

1. Open your Secret Santa app
2. Check the browser console for "Firebase initialized successfully"
3. Select some boxes
4. Refresh the page - your selections should persist!
5. Open the app in another browser/device - you should see the same state

## Database Structure

Firebase stores data in this structure:

```
secretSanta/
├── boxes/
│   ├── 1/
│   │   ├── picker: "John Doe"
│   │   └── assigned: "Jane Smith"
│   ├── 2/
│   │   ├── picker: ""
│   │   └── assigned: "Bob Johnson"
│   └── ...
└── metadata/
    ├── totalBoxes: 55
    ├── lastUpdated: "2025-12-10T06:30:00.000Z"
    └── participants: [...]
```

## Viewing Your Data

1. Go to Firebase Console → Realtime Database
2. Click on the "Data" tab
3. You'll see your `secretSanta` node with all box assignments

## Troubleshooting

### Firebase not initializing
- Check that the Firebase scripts are loaded in `index.html`
- Verify your Firebase config values are correct
- Check browser console for errors

### Data not persisting
- Verify Firebase Database is created and in test mode
- Check security rules allow read/write
- Check console for Firebase errors

### Data not syncing across devices
- Make sure Firebase real-time listeners are working
- Check that PubNub is also properly configured
- Verify both devices have network connectivity

## Cost Considerations

Firebase Realtime Database free tier includes:
- **1 GB stored**: More than enough for Secret Santa data
- **10 GB/month downloaded**: Plenty for typical usage
- **100 simultaneous connections**: Perfect for group events

For a typical Secret Santa event with 50-100 participants, you'll stay well within the free tier limits.

## Security Best Practices

For production use:
1. Enable Firebase Authentication
2. Update database rules to require authentication
3. Add rate limiting to prevent abuse
4. Consider using environment variables for sensitive config
5. Monitor usage in Firebase Console

## Backup and Export

To backup your data:
1. Go to Firebase Console → Realtime Database
2. Click the three dots menu on your data node
3. Select "Export JSON"
4. Save the file for backup

To restore:
1. Click "Import JSON" 
2. Select your backup file
3. Confirm the import

## Switching Between Storage Methods

The app works with or without Firebase:
- **With Firebase**: Persistent storage, survives page refreshes
- **Without Firebase**: Falls back to session-based randomization

To disable Firebase without removing the code:
- Simply don't configure the Firebase keys
- The app will automatically fall back to local mode
