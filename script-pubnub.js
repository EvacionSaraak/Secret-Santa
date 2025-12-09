// ⚠️ PubNub Configuration ⚠️
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
    console.warn('⚠️ PubNub keys not configured! Please update script-pubnub.js with your keys.');
    console.warn('Get free keys at: https://www.pubnub.com/');
}

// State management
let currentUserName = '';
let selections = {}; // { boxNumber: userName }
const TOTAL_BOXES = 60;
let isConnected = false;
let pubnub = null;
const CHANNEL_NAME = 'secret-santa-boxes';

// Admin configuration
const ADMIN_NAME = 'EvacionSaraak'; // Only admin can see names and manage boxes
let isAdmin = false;

// DOM elements
const nameModal = document.getElementById('nameModal');
const mainContent = document.getElementById('mainContent');
const userNameInput = document.getElementById('userNameInput');
const submitNameBtn = document.getElementById('submitNameBtn');
const currentUserNameSpan = document.getElementById('currentUserName');
const boxGrid = document.getElementById('boxGrid');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const uploadInput = document.getElementById('uploadInput');
const resetBtn = document.getElementById('resetBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const connectionStatus = document.getElementById('connectionStatus');
const syncIndicator = document.querySelector('.sync-indicator');
const syncStatus = document.querySelector('.sync-status');

// Initialize
function init() {
    // Check if user already has a name stored
    const storedName = localStorage.getItem('secretSantaUserName');
    if (storedName) {
        currentUserName = storedName;
        isAdmin = (storedName === ADMIN_NAME);
        showMainContent();
        connectToPubNub();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Generate boxes
    generateBoxes();
}

function setupEventListeners() {
    submitNameBtn.addEventListener('click', handleNameSubmit);
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleNameSubmit();
    });
    
    // Change name button
    const changeNameBtn = document.getElementById('changeNameBtn');
    if (changeNameBtn) {
        changeNameBtn.addEventListener('click', handleChangeName);
    }
    
    downloadBtn.addEventListener('click', downloadJSON);
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', handleUpload);
    resetBtn.addEventListener('click', handleReset);
}

function handleNameSubmit() {
    const name = userNameInput.value.trim();
    if (name === '') {
        alert('Please enter your name');
        return;
    }
    
    currentUserName = name;
    isAdmin = (name === ADMIN_NAME);
    localStorage.setItem('secretSantaUserName', name);
    showMainContent();
}

function showMainContent() {
    nameModal.classList.add('hidden');
    mainContent.classList.remove('hidden');
    currentUserNameSpan.textContent = currentUserName;
    
    // Show/hide admin controls
    updateAdminControls();
    
    connectToPubNub();
}

function updateAdminControls() {
    const actionsDiv = document.querySelector('.actions');
    if (actionsDiv) {
        if (isAdmin) {
            actionsDiv.style.display = 'block';
        } else {
            actionsDiv.style.display = 'none';
        }
    }
    
    // Update welcome message to show admin status
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (isAdmin) {
        welcomeMessage.innerHTML = `Welcome, <span id="currentUserName">${currentUserName}</span>! <span class="admin-badge">👑 Admin</span> <button id="changeNameBtn" class="btn-link">Change Name</button>`;
        // Re-attach event listener after updating innerHTML
        const changeNameBtn = document.getElementById('changeNameBtn');
        if (changeNameBtn) {
            changeNameBtn.addEventListener('click', handleChangeName);
        }
    }
}

function handleChangeName() {
    const newName = prompt('Enter your new name:', currentUserName);
    if (!newName || newName.trim() === '') {
        return;
    }
    
    const trimmedName = newName.trim();
    if (trimmedName === currentUserName) {
        return; // No change
    }
    
    const oldName = currentUserName;
    currentUserName = trimmedName;
    isAdmin = (trimmedName === ADMIN_NAME);
    
    // Update localStorage
    localStorage.setItem('secretSantaUserName', currentUserName);
    
    // Update display
    currentUserNameSpan.textContent = currentUserName;
    
    // Update admin controls
    updateAdminControls();
    
    // Update all boxes that had the old name
    for (let boxNumber in selections) {
        if (selections[boxNumber] === oldName) {
            selections[boxNumber] = currentUserName;
        }
    }
    
    // Broadcast name change to all clients
    publishMessage({
        type: 'name-change',
        oldName: oldName,
        newName: currentUserName
    });
    
    // Regenerate boxes if admin status changed (to add/remove buttons)
    if ((oldName === ADMIN_NAME || currentUserName === ADMIN_NAME)) {
        generateBoxes();
    } else {
        // Update local display
        updateBoxDisplay();
    }
}

function generateBoxes() {
    boxGrid.innerHTML = '';
    
    for (let i = 1; i <= TOTAL_BOXES; i++) {
        const box = document.createElement('div');
        box.className = 'box';
        box.dataset.boxNumber = i;
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'box-number';
        numberDiv.textContent = i;
        
        const ownerDiv = document.createElement('div');
        ownerDiv.className = 'box-owner';
        
        box.appendChild(numberDiv);
        box.appendChild(ownerDiv);
        box.addEventListener('click', () => handleBoxClick(i));
        
        // Add admin remove button for claimed boxes
        if (isAdmin) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'box-remove-btn hidden';
            removeBtn.innerHTML = '×';
            removeBtn.title = 'Remove selection';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent box click
                handleAdminRemove(i);
            });
            box.appendChild(removeBtn);
        }
        
        boxGrid.appendChild(box);
    }
    
    updateBoxDisplay();
}

function handleBoxClick(boxNumber) {
    // Don't allow selection if disconnected
    if (!isConnected) {
        return;
    }
    
    const owner = selections[boxNumber];
    
    if (owner === currentUserName) {
        // User is unselecting their own box
        publishMessage({
            type: 'unselect-box',
            boxNumber,
            userName: currentUserName
        });
    } else if (!owner) {
        // Box is available - select it (server will handle unsetting previous box)
        publishMessage({
            type: 'select-box',
            boxNumber,
            userName: currentUserName
        });
    } else {
        // Box is taken by someone else
        if (isAdmin) {
            alert(`This box is selected by ${owner}`);
        } else {
            alert(`This box is already claimed`);
        }
    }
}

function handleAdminRemove(boxNumber) {
    if (!isAdmin) return;
    
    const owner = selections[boxNumber];
    if (!owner) return;
    
    if (confirm(`Remove ${owner} from box ${boxNumber}?`)) {
        publishMessage({
            type: 'admin-remove-box',
            boxNumber,
            userName: owner,
            adminName: currentUserName
        });
    }
}

function updateBoxDisplay() {
    for (let i = 1; i <= TOTAL_BOXES; i++) {
        const box = document.querySelector(`[data-box-number="${i}"]`);
        const ownerDiv = box.querySelector('.box-owner');
        const removeBtn = box.querySelector('.box-remove-btn');
        const owner = selections[i];
        
        // Reset classes
        box.classList.remove('available', 'selected', 'taken', 'disabled');
        
        if (owner === currentUserName) {
            box.classList.add('selected');
            ownerDiv.textContent = currentUserName;
            if (removeBtn) removeBtn.classList.add('hidden');
        } else if (owner) {
            box.classList.add('taken');
            // Show name for admin, "Claimed" for regular users
            if (isAdmin) {
                ownerDiv.textContent = owner;
                if (removeBtn) removeBtn.classList.remove('hidden');
            } else {
                ownerDiv.textContent = 'Claimed';
            }
        } else {
            box.classList.add('available');
            ownerDiv.textContent = '';
            if (removeBtn) removeBtn.classList.add('hidden');
        }
        
        // Disable all boxes if not connected
        if (!isConnected) {
            box.classList.add('disabled');
        }
    }
}

function connectToPubNub() {
    showLoadingOverlay('Connecting to server...');
    
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
                    console.log('Connected to PubNub');
                    isConnected = true;
                    updateSyncStatus(true);
                    hideLoadingOverlay();
                    updateBoxDisplay();
                    
                    // Request current state
                    requestCurrentState();
                }
            },
            message: function(messageEvent) {
                handleMessage(messageEvent.message);
            }
        });
        
        // Subscribe to the channel
        pubnub.subscribe({
            channels: [CHANNEL_NAME]
        });
        
    } catch (error) {
        console.error('PubNub connection error:', error);
        isConnected = false;
        showLoadingOverlay('Connection error. Please check your PubNub keys.');
    }
}

function handleMessage(message) {
    console.log('Received message:', message);
    
    switch (message.type) {
        case 'state-response':
            // Update selections from server
            selections = message.selections || {};
            updateBoxDisplay();
            break;
        
        case 'select-box':
            // Remove any previous selection by this user
            for (let box in selections) {
                if (selections[box] === message.userName) {
                    delete selections[box];
                }
            }
            // Add new selection
            selections[message.boxNumber] = message.userName;
            updateBoxDisplay();
            break;
        
        case 'unselect-box':
            if (selections[message.boxNumber] === message.userName) {
                delete selections[message.boxNumber];
                updateBoxDisplay();
            }
            break;
        
        case 'admin-remove-box':
            // Admin removing someone's box selection
            if (selections[message.boxNumber] === message.userName) {
                delete selections[message.boxNumber];
                updateBoxDisplay();
            }
            break;
        
        case 'reset-all':
            selections = {};
            updateBoxDisplay();
            break;
        
        case 'upload-selections':
            selections = message.selections || {};
            updateBoxDisplay();
            break;
        
        case 'name-change':
            // Update all boxes that had the old name with the new name
            for (let boxNumber in selections) {
                if (selections[boxNumber] === message.oldName) {
                    selections[boxNumber] = message.newName;
                }
            }
            updateBoxDisplay();
            break;
        
        case 'state-request':
            // Someone is requesting current state, send it if we have selections
            if (Object.keys(selections).length > 0) {
                publishMessage({
                    type: 'state-response',
                    selections
                });
            }
            break;
    }
}

function requestCurrentState() {
    // Request current state from other clients
    publishMessage({
        type: 'state-request'
    });
    
    // If no response after 2 seconds, assume we're first
    setTimeout(() => {
        if (Object.keys(selections).length === 0) {
            console.log('No existing state found');
        }
    }, 2000);
}

function publishMessage(message) {
    if (!pubnub || !isConnected) {
        console.error('Not connected to PubNub');
        return;
    }
    
    pubnub.publish({
        channel: CHANNEL_NAME,
        message: message
    }, function(status, response) {
        if (status.error) {
            console.error('Publish error:', status);
        }
    });
}

function updateSyncStatus(connected) {
    if (!syncIndicator || !syncStatus) return;
    
    if (connected) {
        syncIndicator.style.color = '#4ade80';
        syncStatus.innerHTML = '<span class="sync-indicator">●</span> Live updates enabled';
    } else {
        syncIndicator.style.color = '#f87171';
        syncStatus.innerHTML = '<span class="sync-indicator">●</span> Disconnected';
    }
}

function downloadJSON() {
    const data = {
        selections: selections,
        totalBoxes: TOTAL_BOXES,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `secret-santa-boxes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.selections && typeof data.selections === 'object') {
                // Publish to all clients
                publishMessage({
                    type: 'upload-selections',
                    selections: data.selections
                });
                alert('Successfully loaded selections!');
            } else {
                alert('Invalid file format');
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
}

function handleReset() {
    if (!confirm('Are you sure you want to reset all selections? This cannot be undone.')) {
        return;
    }
    
    // Publish reset to all clients
    publishMessage({ type: 'reset-all' });
}

function showLoadingOverlay(message) {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
    if (connectionStatus) {
        connectionStatus.textContent = message;
    }
}

function hideLoadingOverlay() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Start the application
init();
