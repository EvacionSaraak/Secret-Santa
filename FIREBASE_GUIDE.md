# 🎅 Secret Santa Firebase Setup Guide

## Quick Start Summary

Your Secret Santa app uses Firebase for:

### ✅ Key Features
1. **Box Selection Prevention** - Non-admin users can't change selections
2. **Autocomplete Preview** - Translucent text preview when typing names
3. **Improved UI** - Better modals, prominent "Change Name" button
4. **Admin Logout Fix** - Properly clears state and shows name picker
5. **Firebase Integration** - Persistent storage with real-time sync
6. **Modular Architecture** - Clean separation of Firebase and app logic
7. **Activity Logging** - Every state change logged to Firebase

### 📁 Files

**Integration Module:**
- `firebase-integration.js` - All Firebase functionality
- `script.js` - Main application logic

**Documentation:**
- `FIREBASE_SETUP.md` - Detailed Firebase setup guide for users
- `README.md` - Project overview and quick start guide

### 🔧 What You Need to Do

1. **Get Your Firebase Config**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Realtime Database
   - Copy your configuration values

2. **Update Configuration**
   Edit `firebase-integration.js` and replace:
   ```javascript
   const FIREBASE_CONFIG = {
       apiKey: "YOUR_FIREBASE_API_KEY",              // Replace this
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace this
       databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com", // Replace this
       projectId: "YOUR_PROJECT_ID",                  // Replace this
       storageBucket: "YOUR_PROJECT_ID.appspot.com",  // Replace this
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace this
       appId: "YOUR_APP_ID"                           // Replace this
   };
   ```

3. **Set Up Security Rules**
   In Firebase Console → Realtime Database → Rules:
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

4. **Deploy Your App**
   Options:
   - Use GitHub Pages (recommended for simplicity)
   - Switch to Firebase Hosting (better integration)
   - Use both (recommended for learning)

## 🔧 Firebase Configuration Help

If you need help with specific Firebase tasks, refer to the [Firebase documentation](https://firebase.google.com/docs/database) or use these resources:

**For Configuration:**
- [Firebase Console Setup Guide](https://firebase.google.com/docs/web/setup)
- [Getting Firebase Config Values](https://support.google.com/firebase/answer/7015592)

**For Security Rules:**
- [Firebase Security Rules Documentation](https://firebase.google.com/docs/database/security)
- [Get Started with Security Rules](https://firebase.google.com/docs/database/security/get-started)

**For Deployment:**
- [GitHub Pages Deployment](https://pages.github.com/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

**For Testing:**
- [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)

## 📊 Firebase Database Structure

Your app will create this structure:

```
secretSanta/
├── boxes/
│   ├── 1/
│   │   ├── picker: "John Doe"        (who picked this box)
│   │   └── assigned: "Jane Smith"    (who they're gifting to)
│   ├── 2/
│   │   ├── picker: ""                (empty = available)
│   │   └── assigned: "Bob Johnson"
│   └── ... (55 boxes total)
│
├── metadata/
│   ├── totalBoxes: 55
│   ├── lastUpdated: "2025-12-10T06:30:00.000Z"
│   └── participants: ["Name 1", "Name 2", ...]
│
└── logs/
    ├── {auto-generated-id-1}/
    │   ├── timestamp: "2025-12-10T06:30:00.000Z"
    │   ├── action: "select-box"
    │   ├── user: "John Doe"
    │   └── details: {boxNumber: 5, assigned: "Jane Smith"}
    │
    ├── {auto-generated-id-2}/
    │   ├── timestamp: "2025-12-10T06:31:00.000Z"
    │   ├── action: "admin-remove-box"
    │   ├── user: "ADMIN"
    │   └── details: {boxNumber: 3, removedUser: "Bob"}
    │
    └── ... (all state changes logged)
```

## 🎯 Success Checklist

After Firebase setup, verify:

- [ ] Firebase initializes without errors (check browser console)
- [ ] Box assignments persist after page refresh
- [ ] Multiple users see updates in real-time
- [ ] Logs appear in Firebase Console under `secretSanta/logs`
- [ ] Admin can clear users and it's logged
- [ ] Data survives across sessions (no re-randomization)

## 🆘 Troubleshooting

**Firebase not initializing?**
→ Check browser console for errors
→ Verify your config values are correct
→ Make sure Firebase SDKs are loaded in `index.html`

**Data not persisting?**
→ Check Firebase Console → Realtime Database → Data
→ Verify security rules allow read/write
→ Check browser console for permission errors

**Real-time sync not working?**
→ Verify Firebase is properly configured
→ Check that Firebase is initialized without errors
→ Look for connection errors in console
→ Ensure Firebase listeners are set up correctly

## 💡 Pro Tips

1. **Test locally first** - Use `npm run dev:local` to test before deploying
2. **Monitor usage** - Check Firebase Console → Usage tab regularly
3. **Backup data** - Admin can download JSON, but also export from Firebase Console
4. **Read the logs** - Firebase Console → Realtime Database → Data → secretSanta → logs
5. **Stay in free tier** - 55 participants × moderate usage = well within limits

## 📞 Need More Help?

1. **Read the detailed guide**: `FIREBASE_SETUP.md`
2. **Check Firebase docs**: https://firebase.google.com/docs/database
3. **Firebase Support**: https://firebase.google.com/support
4. **Ask in GitHub Discussions**: Create an issue in your repository

---

**Good luck with your Secret Santa event! 🎄🎁**
