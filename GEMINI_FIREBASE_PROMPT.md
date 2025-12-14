# Prompt for Gemini: Firebase Setup for Secret Santa Application

## Context
I have a Secret Santa web application that needs Firebase Realtime Database integration. The application is already partially set up with Firebase configuration files, but I need help completing the Firebase setup and deploying it properly.

## Current Application Structure

### Files Already in Place:
1. **firebase-integration.js** - Contains Firebase initialization and data management functions
2. **script.js** - Main application logic with Firebase integration
3. **index.html** - HTML structure with Firebase SDK already included
4. **FIREBASE_SETUP.md** - Detailed Firebase setup documentation

### What the Application Does:
- Secret Santa box picker where participants select numbered boxes
- Each box contains a pre-assigned recipient name (randomized once)
- Real-time synchronization across multiple users via Firebase Realtime Database
- Persistent storage of box assignments and selections via Firebase
- Activity logging for all state changes (select, unselect, clear, etc.)

### Firebase Integration Features:
1. **Persistent Storage**: Box assignments stored in `secretSanta/boxes`
2. **Metadata Storage**: Participant list and totals in `secretSanta/metadata`
3. **Activity Logging**: All state changes logged in `secretSanta/logs`
4. **Real-time Sync**: Firebase listeners automatically sync changes across devices

## What I Need Help With

### 1. Firebase Project Setup
Please guide me through:
- Creating a new Firebase project in the Firebase Console
- Enabling Firebase Realtime Database
- Setting up security rules that allow read/write access (I understand this needs improvement for production)
- Getting my Firebase configuration values

### 2. Configuration
I need to replace these placeholder values in `firebase-integration.js`:
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

### 3. Database Structure
The application expects this structure:
```
secretSanta/
├── boxes/
│   ├── 1/
│   │   ├── picker: "John Doe" (empty string if not selected)
│   │   └── assigned: "Jane Smith" (pre-assigned recipient)
│   ├── 2/
│   │   ├── picker: ""
│   │   └── assigned: "Bob Johnson"
│   └── ... (up to 55 boxes based on participants)
├── metadata/
│   ├── totalBoxes: 55
│   ├── lastUpdated: "2025-12-10T06:30:00.000Z"
│   └── participants: ["Name 1", "Name 2", ...]
└── logs/
    ├── {pushId1}/
    │   ├── timestamp: "2025-12-10T06:30:00.000Z"
    │   ├── action: "select-box"
    │   ├── user: "John Doe"
    │   └── details: {boxNumber: 5, assigned: "Jane Smith"}
    ├── {pushId2}/
    │   ├── timestamp: "2025-12-10T06:31:00.000Z"
    │   ├── action: "clear-users"
    │   ├── user: "ADMIN"
    │   └── details: {totalCleared: 55}
    └── ...
```

### 4. Security Rules
Help me set up proper security rules. Currently using:
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

But I'd like:
- Anyone can read the data
- Only authenticated admins can write to boxes and metadata
- Logs should be write-only (append-only)
- Consider rate limiting

### 5. Hosting Options
I'm currently using GitHub Pages. Should I:
- Continue with GitHub Pages and just use Firebase for database?
- Switch to Firebase Hosting for better integration?
- Use both (Firebase Hosting for the app, GitHub for code repository)?

### 6. Testing and Deployment
Help me with:
- How to test Firebase connectivity locally
- How to view data in Firebase Console
- How to backup/export data
- How to monitor usage and stay within free tier limits

### 7. Optional Enhancements
If possible, suggest improvements for:
- Firebase Authentication (currently using a hardcoded admin password)
- Better security rules
- Analytics to track event usage
- Performance monitoring
- Error handling and retry logic

## Current Code Functions

### Firebase Functions Available:
- `initializeFirebase()` - Initializes Firebase app
- `loadStateFromFirebase()` - Loads saved box assignments
- `saveStateToFirebase(boxes, participants, totalBoxes)` - Saves current state
- `logStateChangeToFirebase(actionType, userName, details)` - Logs state changes
- `setupFirebaseListeners(onBoxesUpdate)` - Sets up real-time sync
- `disconnectFirebase()` - Disconnects listeners

### Key Actions That Generate Logs:
- `select-box` - User selects a box
- `unselect-box` - User unselects their box
- `admin-remove-box` - Admin removes a user's selection
- `clear-users` - Admin clears all selections
- `upload-boxes` - Admin uploads JSON data
- `scramble-boxes` - Admin scrambles assignments
- `name-change` - User changes their name

## Questions for You (Gemini)

1. What's the best way to structure the security rules for this use case?
2. Should I add Firebase Authentication, and if so, what's the simplest approach?
3. How can I set up automated backups of the Firebase data?
4. What monitoring should I enable to track usage and errors?
5. Are there any Firebase features I'm missing that would improve this app?
6. How do I set up Firebase Hosting to deploy this application?
7. What's the best way to handle the transition from local development to production?
8. How can I view and analyze the activity logs in Firebase Console?

## Expected Deliverables

Please provide:
1. **Step-by-step setup guide** - Detailed instructions for Firebase Console
2. **Configuration values** - Help me get the right values for my config
3. **Security rules** - Production-ready security rules
4. **Deployment guide** - How to deploy to Firebase Hosting
5. **Testing checklist** - What to test to ensure everything works
6. **Monitoring setup** - How to set up alerts and tracking
7. **Backup strategy** - How to regularly backup data
8. **Cost optimization tips** - How to stay within free tier

## Additional Context

### Participants Data
- The app loads 55 participants from `data/participants.txt`
- Each participant gets a random box assignment on first initialization
- Assignments persist forever once created (no re-randomization)

### Admin Features
- Admin password: `SecretSanta2025!` (hardcoded, needs improvement)
- Admin can see all assignments
- Admin can remove user selections
- Admin can download/upload JSON backups
- Admin can clear all selections

### Technical Stack
- Plain JavaScript (no frameworks)
- Bootstrap 5.3.2 for UI
- Firebase Realtime Database (for storage and real-time sync)
- GitHub Pages for hosting (currently)

## Success Criteria

The Firebase integration is successful when:
1. ✅ Box assignments persist across page refreshes
2. ✅ Multiple users see updates in real-time
3. ✅ All state changes are logged
4. ✅ Data is secure from unauthorized writes
5. ✅ App works offline (graceful fallback)
6. ✅ Admin can view logs in Firebase Console
7. ✅ Usage stays within Firebase free tier
8. ✅ Backups can be created and restored

---

**Please help me set up Firebase properly for this Secret Santa application!**
