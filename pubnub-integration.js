// ⚠️ PubNub Configuration & Integration ⚠️
// API keys configured for Secret Santa Box Picker
// Get free API keys from: https://www.pubnub.com/

const PLACEHOLDER_PUBLISH_KEY = 'YOUR_PUBLISH_KEY_HERE';
const PLACEHOLDER_SUBSCRIBE_KEY = 'YOUR_SUBSCRIBE_KEY_HERE';

const PUBNUB_CONFIG = {
    publishKey: 'pub-c-a582deb0-1131-41f5-9701-904d7ff5f864',
    subscribeKey: 'sub-c-e0c62c1e-5f36-4373-8765-b00f28f5ab1b',
    userId: 'user_' + Math.random().toString(36).substring(7)
};

// Check if keys are configured
if (PUBNUB_CONFIG.publishKey === PLACEHOLDER_PUBLISH_KEY || 
    PUBNUB_CONFIG.subscribeKey === PLACEHOLDER_SUBSCRIBE_KEY) {
    console.warn('⚠️ PubNub keys not configured! Please update pubnub-integration.js with your keys.');
    console.warn('Get free keys at: https://www.pubnub.com/');
}

// PubNub state
let pubnub = null;
let isConnected = false;
const CHANNEL_NAME = 'secret-santa-boxes';

/**
 * Initialize PubNub connection
 * @param {Function} onStatusChange - Callback for connection status changes
 * @param {Function} onMessage - Callback for incoming messages
 */
function initializePubNub(onStatusChange, onMessage) {
    try {
        // Initialize PubNub
        pubnub = new PubNub({
            publishKey: PUBNUB_CONFIG.publishKey,
            subscribeKey: PUBNUB_CONFIG.subscribeKey,
            userId: PUBNUB_CONFIG.userId
        });
        
        // Add listeners
        pubnub.addListener({
            status: function(statusEvent) {
                if (statusEvent.category === "PNConnectedCategory") {
                    console.log('✅ Connected to PubNub');
                    isConnected = true;
                    if (onStatusChange) {
                        onStatusChange(true);
                    }
                }
            },
            message: function(messageEvent) {
                if (onMessage) {
                    onMessage(messageEvent.message);
                }
            }
        });
        
        // Subscribe to the channel
        pubnub.subscribe({
            channels: [CHANNEL_NAME]
        });
        
        console.log('✅ PubNub initialized successfully');
        
    } catch (error) {
        console.error('❌ PubNub connection error:', error);
        isConnected = false;
        if (onStatusChange) {
            onStatusChange(false);
        }
    }
}

/**
 * Publish a message to PubNub channel
 * @param {Object} message - The message object to publish
 */
function publishMessage(message) {
    if (!pubnub || !isConnected) {
        console.error('❌ Not connected to PubNub');
        return;
    }
    
    pubnub.publish({
        channel: CHANNEL_NAME,
        message: message
    }, function(status, response) {
        if (status.error) {
            console.error('❌ Publish error:', status);
        }
    });
}

/**
 * Disconnect from PubNub
 */
function disconnectPubNub() {
    if (pubnub) {
        pubnub.unsubscribeAll();
        isConnected = false;
        console.log('🔌 PubNub disconnected');
    }
}

/**
 * Check if PubNub is connected
 * @returns {boolean}
 */
function isPubNubConnected() {
    return isConnected;
}
