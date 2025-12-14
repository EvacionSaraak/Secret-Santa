// ⚠️ Firebase Configuration & Integration ⚠️
// Configure your Firebase project settings here
// Get your config from: https://console.firebase.google.com/

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA3bhcPNRA3X7R9Ev5FREyiVnCyqbgic_A",
    authDomain: "secret-santa-9ee11.firebaseapp.com",
    databaseURL: "https://secret-santa-9ee11-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "secret-santa-9ee11",
    storageBucket: "secret-santa-9ee11.firebasestorage.app",
    messagingSenderId: "335669780114",
    appId: "1:335669780114:web:debf141b61aec8e1b4904b",
    measurementId: "G-TDCV3KCZ2H"
};

// Validate Firebase configuration to prevent deployment with placeholders
const isFirebaseConfigured = !FIREBASE_CONFIG.apiKey.includes('YOUR_') && 
                              !FIREBASE_CONFIG.projectId.includes('YOUR_');

if (!isFirebaseConfigured) {
    console.warn('⚠️ Firebase not configured! Update FIREBASE_CONFIG in firebase-integration.js');
    console.warn('📖 See FIREBASE_SETUP.md for detailed setup instructions');
}

// Firebase state
let database = null;
let auth = null;
let firebaseInitialized = false;
let currentFirebaseUser = null;

/**
 * Initialize Firebase with the provided configuration
 */
function initializeFirebase() {
    // Skip initialization if config has placeholders
    if (!isFirebaseConfigured) {
        console.log('ℹ️ Firebase not configured - running in local mode');
        return;
    }
    
    try {
        if (typeof firebase !== 'undefined' && !firebaseInitialized) {
            firebase.initializeApp(FIREBASE_CONFIG);
            database = firebase.database();
            auth = firebase.auth();
            firebaseInitialized = true;
            console.log('✅ Firebase initialized successfully');
        }
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        console.warn('⚠️ Falling back to local storage mode');
    }
}

/**
 * Sign in anonymously to Firebase Authentication
 * This is required for Firebase security rules
 * @returns {Promise<Object|null>} User object or null if failed
 */
async function signInAnonymously() {
    if (!firebaseInitialized || !auth) {
        console.log('ℹ️ Firebase not available, skipping anonymous sign-in');
        return null;
    }
    
    try {
        const userCredential = await auth.signInAnonymously();
        currentFirebaseUser = userCredential.user;
        console.log('✅ Signed in anonymously to Firebase:', currentFirebaseUser.uid);
        return currentFirebaseUser;
    } catch (error) {
        console.error('❌ Error signing in anonymously:', error);
        return null;
    }
}

/**
 * Sign out from Firebase Authentication
 */
async function signOutAnonymously() {
    if (!firebaseInitialized || !auth) {
        return;
    }
    
    try {
        await auth.signOut();
        currentFirebaseUser = null;
        console.log('✅ Signed out from Firebase');
    } catch (error) {
        console.error('❌ Error signing out:', error);
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
 * Save box assignments to Firebase with merge protection
 * This function first loads the latest state from Firebase, merges local changes,
 * and then saves to prevent overwriting concurrent updates from other users.
 * @param {Object} boxesData - The boxes object to save
 * @param {Array} participantsList - List of participants
 * @param {number} totalBoxes - Total number of boxes
 * @returns {Promise<{success: boolean, mergedBoxes: Object|null}>} Success status and merged boxes
 */
async function saveStateToFirebase(boxesData, participantsList, totalBoxes, actionType = 'state-update') {
    if (!firebaseInitialized || !database) {
        console.log('ℹ️ Firebase not available, skipping save');
        return { success: false, mergedBoxes: null };
    }
    
    try {
        const timestamp = new Date().toISOString();
        
        // First, load the latest state from Firebase to avoid overwriting concurrent updates
        const currentSnapshot = await database.ref('secretSanta/boxes').once('value');
        const currentBoxes = currentSnapshot.val();
        
        // If there's existing data, merge it with our local changes
        // This ensures we don't overwrite boxes that were claimed by others
        let mergedBoxes = boxesData;
        
        // Skip merge protection for admin actions that intentionally clear/modify boxes
        const skipMergeActions = ['admin-remove-box', 'clear-users', 'scramble-boxes', 'upload-boxes'];
        const shouldSkipMerge = skipMergeActions.includes(actionType);
        
        if (shouldSkipMerge) {
            console.log(`ℹ️ Skipping merge protection for admin action: ${actionType}`);
        }
        
        if (currentBoxes && !shouldSkipMerge) {
            mergedBoxes = { ...boxesData };
            
            // For each box in the current Firebase state, check if it has a picker
            // that we don't have locally (concurrent claim by another user)
            for (const boxNum in currentBoxes) {
                if (currentBoxes[boxNum] && currentBoxes[boxNum].picker) {
                    // If Firebase has a picker but our local state doesn't, use Firebase's version
                    if (!boxesData[boxNum] || !boxesData[boxNum].picker) {
                        mergedBoxes[boxNum] = currentBoxes[boxNum];
                        console.log(`⚠️ Merged concurrent claim for box ${boxNum} from Firebase`);
                    }
                }
            }
        }
        
        // Save merged state
        await database.ref('secretSanta/boxes').set(mergedBoxes);
        await database.ref('secretSanta/metadata').set({
            totalBoxes: totalBoxes,
            lastUpdated: timestamp,
            participants: participantsList
        });
        
        console.log('✅ State saved to Firebase successfully with merge protection');
        return { success: true, mergedBoxes: mergedBoxes };
    } catch (error) {
        console.error('❌ Error saving to Firebase:', error);
        return { success: false, mergedBoxes: null };
    }
}

/**
 * Log a state change to Firebase
 * @param {string} actionType - Type of action (e.g., 'select-box', 'unselect-box', 'clear-users')
 * @param {string} userName - User who performed the action
 * @param {Object} details - Additional details about the action
 * 
 * Note: In production, consider adding:
 * - Rate limiting to prevent log spam
 * - Log size limits or automatic cleanup
 * - Validation of action types
 * - Timestamp-based indexing for queries
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
        // TODO: Add rate limiting and log rotation for production
        await database.ref('secretSanta/logs').push(logEntry);
        
        console.log(`📝 Logged action: ${actionType} by ${userName}`);
    } catch (error) {
        console.error('❌ Error logging to Firebase:', error);
    }
}

/**
 * Load a single box from Firebase
 * @param {number} boxNumber - The box number to load
 * @returns {Promise<Object|null>} Box data or null if not available
 */
async function loadSingleBoxFromFirebase(boxNumber) {
    if (!firebaseInitialized || !database) {
        console.log('ℹ️ Firebase not available');
        return null;
    }
    
    try {
        const snapshot = await database.ref(`secretSanta/boxes/${boxNumber}`).once('value');
        const boxData = snapshot.val();
        
        if (boxData) {
            console.log(`✅ Loaded box ${boxNumber} from Firebase`);
            return boxData;
        } else {
            console.log(`ℹ️ No data for box ${boxNumber} in Firebase`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error loading box ${boxNumber} from Firebase:`, error);
        return null;
    }
}

/**
 * Atomically claim a box using Firebase transaction to prevent race conditions
 * @param {number} boxNumber - The box number to claim
 * @param {string} userName - User attempting to claim the box
 * @returns {Promise<{success: boolean, message: string, assigned?: string}>}
 */
async function claimBoxAtomic(boxNumber, userName) {
    if (!firebaseInitialized || !database) {
        console.log('ℹ️ Firebase not available, skipping atomic claim');
        return { success: false, message: 'Firebase not available' };
    }
    
    try {
        const boxRef = database.ref(`secretSanta/boxes/${boxNumber}`);
        
        // Use transaction to ensure atomic update
        const result = await boxRef.transaction((currentBox) => {
            if (!currentBox) {
                // Box doesn't exist yet
                return undefined; // Abort transaction
            }
            
            if (currentBox.picker && currentBox.picker !== '') {
                // Box is already claimed by someone
                return undefined; // Abort transaction - keep existing value
            }
            
            // Box is available, claim it
            return {
                picker: userName,
                assigned: currentBox.assigned
            };
        });
        
        if (result.committed) {
            // Successfully claimed the box
            const assigned = result.snapshot.val().assigned;
            console.log(`✅ Box ${boxNumber} claimed successfully by ${userName}`);
            return { 
                success: true, 
                message: 'Box claimed successfully',
                assigned: assigned
            };
        } else {
            // Transaction was aborted - box already claimed
            console.log(`⚠️ Box ${boxNumber} claim failed - already taken`);
            
            // Get the current state to see who claimed it
            const snapshot = await boxRef.once('value');
            const currentBox = snapshot.val();
            
            if (currentBox && currentBox.picker) {
                return { 
                    success: false, 
                    message: `Box already claimed by someone else. Please select another box.`
                };
            }
            
            return { 
                success: false, 
                message: 'Box claim failed. Please try again.'
            };
        }
    } catch (error) {
        console.error('❌ Error claiming box atomically:', error);
        return { 
            success: false, 
            message: 'Error claiming box. Please try again.'
        };
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
