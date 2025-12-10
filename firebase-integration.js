// ⚠️ Firebase Configuration & Integration ⚠️
// Configure your Firebase project settings here
// Get your config from: https://console.firebase.google.com/

const FIREBASE_CONFIG = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase state
let database = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase with the provided configuration
 */
function initializeFirebase() {
    try {
        if (typeof firebase !== 'undefined' && !firebaseInitialized) {
            firebase.initializeApp(FIREBASE_CONFIG);
            database = firebase.database();
            firebaseInitialized = true;
            console.log('✅ Firebase initialized successfully');
        }
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.warn('⚠️ Falling back to local storage mode');
    }
}

/**
 * Load box assignments from Firebase
 * @returns {Promise<Object|null>} Saved boxes or null if not available
 */
async function loadStateFromFirebase() {
    if (!firebaseInitialized || !database) {
        console.log('ℹ️ Firebase not available, using local initialization');
        return null;
    }
    
    try {
        const snapshot = await database.ref('secretSanta/boxes').once('value');
        const savedBoxes = snapshot.val();
        
        if (savedBoxes && Object.keys(savedBoxes).length > 0) {
            console.log('✅ Loaded box assignments from Firebase');
            return savedBoxes;
        } else {
            console.log('ℹ️ No saved state in Firebase');
            return null;
        }
    } catch (error) {
        console.error('❌ Error loading from Firebase:', error);
        return null;
    }
}

/**
 * Save box assignments to Firebase
 * @param {Object} boxesData - The boxes object to save
 * @param {Array} participantsList - List of participants
 * @param {number} totalBoxes - Total number of boxes
 */
async function saveStateToFirebase(boxesData, participantsList, totalBoxes) {
    if (!firebaseInitialized || !database) {
        console.log('ℹ️ Firebase not available, skipping save');
        return;
    }
    
    try {
        const timestamp = new Date().toISOString();
        
        // Save current state
        await database.ref('secretSanta/boxes').set(boxesData);
        await database.ref('secretSanta/metadata').set({
            totalBoxes: totalBoxes,
            lastUpdated: timestamp,
            participants: participantsList
        });
        
        console.log('✅ State saved to Firebase successfully');
    } catch (error) {
        console.error('❌ Error saving to Firebase:', error);
    }
}

/**
 * Log a state change to Firebase
 * @param {string} actionType - Type of action (e.g., 'select-box', 'unselect-box', 'clear-users')
 * @param {string} userName - User who performed the action
 * @param {Object} details - Additional details about the action
 */
async function logStateChangeToFirebase(actionType, userName, details = {}) {
    if (!firebaseInitialized || !database) {
        return;
    }
    
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: actionType,
            user: userName,
            details: details
        };
        
        // Push log entry to Firebase (creates unique key)
        await database.ref('secretSanta/logs').push(logEntry);
        
        console.log(`📝 Logged action: ${actionType} by ${userName}`);
    } catch (error) {
        console.error('❌ Error logging to Firebase:', error);
    }
}

/**
 * Setup Firebase real-time listeners for live sync
 * @param {Function} onBoxesUpdate - Callback when boxes are updated
 */
function setupFirebaseListeners(onBoxesUpdate) {
    if (!firebaseInitialized || !database) {
        console.log('ℹ️ Firebase not available, skipping listeners');
        return;
    }
    
    try {
        // Listen for changes to box assignments
        database.ref('secretSanta/boxes').on('value', (snapshot) => {
            const updatedBoxes = snapshot.val();
            if (updatedBoxes && onBoxesUpdate) {
                onBoxesUpdate(updatedBoxes);
            }
        });
        
        console.log('✅ Firebase real-time listeners setup successfully');
    } catch (error) {
        console.error('❌ Error setting up Firebase listeners:', error);
    }
}

/**
 * Disconnect Firebase listeners
 */
function disconnectFirebase() {
    if (firebaseInitialized && database) {
        database.ref('secretSanta/boxes').off();
        console.log('🔌 Firebase listeners disconnected');
    }
}
