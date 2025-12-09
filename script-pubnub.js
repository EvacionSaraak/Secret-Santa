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
let participants = []; // Array of participant names loaded from participants.txt
let boxes = {}; // { boxNumber: { picker: userName, assigned: assignedName } }
let TOTAL_BOXES = 0; // Will be set to participants.length
let isConnected = false;
let pubnub = null;
const CHANNEL_NAME = 'secret-santa-boxes';

// Admin configuration
const ADMIN_NAME = 'ADMIN'; // Admin has special account and cannot be a participant
const ADMIN_PASSWORD = 'SecretSanta2025!'; // Admin password (keep secret!)
let isAdmin = false;

// DOM elements
const nameModal = document.getElementById('nameModal');
const changeNameModal = document.getElementById('changeNameModal');
const mainContent = document.getElementById('mainContent');
const userNameInput = document.getElementById('userNameInput');
const changeNameInput = document.getElementById('changeNameInput');
const submitNameBtn = document.getElementById('submitNameBtn');
const submitChangeNameBtn = document.getElementById('submitChangeNameBtn');
const cancelChangeNameBtn = document.getElementById('cancelChangeNameBtn');
const currentUserNameSpan = document.getElementById('currentUserName');
const boxGrid = document.getElementById('boxGrid');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const uploadInput = document.getElementById('uploadInput');
const clearUsersBtn = document.getElementById('clearUsersBtn');
const showParticipantsBtn = document.getElementById('showParticipantsBtn');
const participantsModal = document.getElementById('participantsModal');
const closeParticipantsBtn = document.getElementById('closeParticipantsBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const connectionStatus = document.getElementById('connectionStatus');
const syncIndicator = document.querySelector('.sync-indicator');
const syncStatus = document.querySelector('.sync-status');

// Initialize
async function init() {
    // Load participants from file
    await loadParticipants();
    
    // Check if user already has a name stored
    const storedName = localStorage.getItem('secretSantaUserName');
    if (storedName) {
        currentUserName = storedName;
        isAdmin = (storedName === ADMIN_NAME); // Check if ADMIN account
        showMainContent();
        connectToPubNub();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Generate boxes
    generateBoxes();
}

// Helper function to convert name to Camel Case
function toCamelCase(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Load participants from data/participants.txt
async function loadParticipants() {
    try {
        const response = await fetch('data/participants.txt');
        const text = await response.text();
        participants = text.split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0)
            .map(name => toCamelCase(name)); // Convert all to Camel Case
        
        TOTAL_BOXES = participants.length;
        console.log(`Loaded ${TOTAL_BOXES} participants`);
        
        // Initialize assignments if not already done
        if (Object.keys(boxes).length === 0) {
            initializeAssignments();
        }
    } catch (error) {
        console.error('Error loading participants:', error);
        alert('Error loading participants list. Please make sure data/participants.txt exists.');
        participants = [];
        TOTAL_BOXES = 0;
    }
}

// Initialize random assignments for each box
function initializeAssignments() {
    // Create a shuffled copy of participants for assignments
    const shuffled = [...participants];
    
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Assign each box a recipient
    for (let i = 1; i <= TOTAL_BOXES; i++) {
        boxes[i] = {
            picker: '', // Empty until someone picks this box
            assigned: shuffled[i - 1] // Pre-assigned recipient
        };
    }
    
    console.log('Initialized box assignments:', boxes);
}

function setupEventListeners() {
    submitNameBtn.addEventListener('click', handleNameSubmit);
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleNameSubmit();
    });
    
    // Setup autocomplete for name input
    setupAutocompleteForInput(userNameInput);
    
    // Setup autocomplete for change name input
    setupAutocompleteForInput(changeNameInput);
    
    // Admin login button in modal
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', handleAdminLogin);
    }
    
    // Admin login button in main header
    const adminLoginBtnMain = document.getElementById('adminLoginBtnMain');
    if (adminLoginBtnMain) {
        adminLoginBtnMain.addEventListener('click', handleAdminLogin);
    }
    
    // Admin logout button
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', handleAdminLogout);
    }
    
    // Change name button
    const changeNameBtn = document.getElementById('changeNameBtn');
    if (changeNameBtn) {
        changeNameBtn.addEventListener('click', handleChangeName);
    }
    
    // Change name modal buttons
    submitChangeNameBtn.addEventListener('click', handleChangeNameSubmit);
    cancelChangeNameBtn.addEventListener('click', () => {
        changeNameModal.classList.add('hidden');
        changeNameInput.value = '';
    });
    changeNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChangeNameSubmit();
    });
    
    downloadBtn.addEventListener('click', downloadJSON);
    uploadBtn.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', handleUpload);
    clearUsersBtn.addEventListener('click', handleClearUsers);
    showParticipantsBtn.addEventListener('click', showParticipants);
    closeParticipantsBtn.addEventListener('click', () => {
        participantsModal.classList.add('hidden');
    });
}

// Setup autocomplete functionality for any input element
function setupAutocompleteForInput(input) {
    let currentFocus = -1;
    
    // Create autocomplete container
    const autocompleteDiv = document.createElement('div');
    autocompleteDiv.className = 'autocomplete-items';
    autocompleteDiv.id = `autocomplete-list-${input.id}`;
    input.parentNode.appendChild(autocompleteDiv);
    
    input.addEventListener('input', function() {
        const val = this.value.trim();
        closeList(input);
        if (!val) return;
        
        currentFocus = -1;
        
        // Find matching participants
        const matches = participants.filter(name => 
            name.toLowerCase().includes(val.toLowerCase())
        );
        
        // Show top 5 matches
        matches.slice(0, 5).forEach(match => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            
            // Highlight matching part
            const startIndex = match.toLowerCase().indexOf(val.toLowerCase());
            div.innerHTML = match.substring(0, startIndex) +
                           `<strong>${match.substring(startIndex, startIndex + val.length)}</strong>` +
                           match.substring(startIndex + val.length);
            
            div.addEventListener('click', function() {
                input.value = match;
                closeList(input);
            });
            
            autocompleteDiv.appendChild(div);
        });
    });
    
    input.addEventListener('keydown', function(e) {
        const listId = `autocomplete-list-${input.id}`;
        let items = document.getElementById(listId);
        if (items) items = items.getElementsByClassName('autocomplete-item');
        
        if (e.keyCode === 40) { // Down arrow
            currentFocus++;
            addActive(items);
        } else if (e.keyCode === 38) { // Up arrow
            currentFocus--;
            addActive(items);
        } else if (e.keyCode === 13) { // Enter
            e.preventDefault();
            if (currentFocus > -1 && items) {
                items[currentFocus].click();
            }
        }
    });
    
    function addActive(items) {
        if (!items) return;
        removeActive(items);
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('autocomplete-active');
    }
    
    function removeActive(items) {
        for (let item of items) {
            item.classList.remove('autocomplete-active');
        }
    }
    
    function closeList(inputElement) {
        const listId = `autocomplete-list-${inputElement.id}`;
        const list = document.getElementById(listId);
        if (list) {
            list.innerHTML = '';
        }
    }
    
    // Close autocomplete when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            closeList(input);
        }
    });
}

// Handle admin login with hidden password input
function handleAdminLogin() {
    // Create a password modal
    const passwordModal = document.createElement('div');
    passwordModal.className = 'modal';
    passwordModal.style.display = 'flex';
    passwordModal.innerHTML = `
        <div class="modal-content">
            <h2>🔐 Admin Login</h2>
            <p>Enter admin password:</p>
            <input type="password" id="adminPasswordInput" placeholder="Password" autocomplete="off" style="width: 100%; padding: 0.5rem; margin: 1rem 0; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px;" autofocus />
            <div style="display: flex; gap: 0.5rem; justify-content: center;">
                <button id="adminPasswordSubmit" class="btn btn-primary">Login</button>
                <button id="adminPasswordCancel" class="btn btn-secondary">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(passwordModal);
    
    const passwordInput = document.getElementById('adminPasswordInput');
    const submitBtn = document.getElementById('adminPasswordSubmit');
    const cancelBtn = document.getElementById('adminPasswordCancel');
    
    const handleSubmit = () => {
        const password = passwordInput.value;
        if (!password) {
            alert('Please enter a password');
            return;
        }
        
        if (password === ADMIN_PASSWORD) {
            currentUserName = ADMIN_NAME;
            isAdmin = true;
            localStorage.setItem('secretSantaUserName', ADMIN_NAME);
            document.body.removeChild(passwordModal);
            showMainContent();
        } else {
            alert('Incorrect password!');
            passwordInput.value = '';
            passwordInput.focus();
        }
    };
    
    const handleCancel = () => {
        document.body.removeChild(passwordModal);
    };
    
    submitBtn.addEventListener('click', handleSubmit);
    cancelBtn.addEventListener('click', handleCancel);
    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    });
    
    passwordInput.focus();
}

function handleNameSubmit() {
    const name = userNameInput.value.trim();
    if (name === '') {
        alert('Please select your name from the list');
        return;
    }
    
    // Find closest match in participants list
    const camelCaseName = toCamelCase(name);
    const exactMatch = participants.find(p => p.toLowerCase() === camelCaseName.toLowerCase());
    
    if (!exactMatch) {
        alert('Name not found in participants list. Please select from the suggested names.');
        return;
    }
    
    currentUserName = exactMatch; // Use exact match from participants
    isAdmin = false; // Regular users cannot become admin via normal login
    localStorage.setItem('secretSantaUserName', currentUserName);
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
    const adminActionsDiv = document.querySelector('.admin-actions');
    const adminLoginButtons = document.querySelectorAll('.btn-admin-login');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    
    // Show/hide admin-only actions (Download JSON, Upload JSON, Clear All Users)
    if (adminActionsDiv) {
        if (isAdmin) {
            adminActionsDiv.style.display = 'block';
        } else {
            adminActionsDiv.style.display = 'none';
        }
    }
    
    // Show/hide admin login/logout buttons
    adminLoginButtons.forEach(btn => {
        if (isAdmin) {
            btn.classList.add('hidden');
        } else {
            btn.classList.remove('hidden');
        }
    });
    
    if (adminLogoutBtn) {
        if (isAdmin) {
            adminLogoutBtn.classList.remove('hidden');
        } else {
            adminLogoutBtn.classList.add('hidden');
        }
    }
    
    // Update welcome message to show admin status
    const welcomeMessage = document.getElementById('welcomeMessage');
    const currentUserNameSpan = document.getElementById('currentUserName');
    
    if (currentUserNameSpan) {
        currentUserNameSpan.textContent = currentUserName;
    }
    
    if (isAdmin) {
        // Check if admin badge already exists
        let adminBadge = welcomeMessage.querySelector('.admin-badge');
        if (!adminBadge) {
            adminBadge = document.createElement('span');
            adminBadge.className = 'admin-badge';
            adminBadge.textContent = '👑 Admin';
            currentUserNameSpan.insertAdjacentElement('afterend', adminBadge);
        }
        
        // Re-attach event listener for change name button
        const changeNameBtn = document.getElementById('changeNameBtn');
        if (changeNameBtn) {
            changeNameBtn.addEventListener('click', handleChangeName);
        }
    } else {
        // Remove admin badge if it exists
        const adminBadge = welcomeMessage.querySelector('.admin-badge');
        if (adminBadge) {
            adminBadge.remove();
        }
    }
}

function handleAdminLogout() {
    if (!isAdmin) return;
    
    if (confirm('Are you sure you want to logout as admin?')) {
        isAdmin = false;
        updateAdminControls();
        updateBoxDisplay();
        alert('Logged out from admin mode.');
    }
}

function handleChangeName() {
    // Admin cannot change to participant name (ADMIN is special)
    if (isAdmin) {
        alert('Admin account name cannot be changed. ADMIN is a special account for managing the event only.');
        return;
    }
    
    // Regular users can change their names
    // Show change name modal
    changeNameInput.value = '';
    changeNameModal.classList.remove('hidden');
    changeNameInput.focus();
}

function handleChangeNameSubmit() {
    const newName = changeNameInput.value.trim();
    
    if (!newName) {
        alert('Please select a name from the list.');
        return;
    }
    
    // Validate that the name is in participants list
    const trimmedName = toCamelCase(newName);
    if (!participants.includes(trimmedName)) {
        alert('Please select a valid name from the participants list.');
        return;
    }
    
    if (trimmedName === currentUserName) {
        changeNameModal.classList.add('hidden');
        changeNameInput.value = '';
        return; // No change
    }
    
    const oldName = currentUserName;
    currentUserName = trimmedName;
    
    // Update localStorage
    localStorage.setItem('secretSantaUserName', currentUserName);
    
    // Update display
    currentUserNameSpan.textContent = currentUserName;
    
    // Update admin controls
    updateAdminControls();
    
    // Update all boxes that had the old picker name
    for (let boxNumber in boxes) {
        if (boxes[boxNumber].picker === oldName) {
            boxes[boxNumber].picker = currentUserName;
        }
    }
    
    // Broadcast name change to all clients
    publishMessage({
        type: 'name-change',
        oldName: oldName,
        newName: currentUserName,
        boxes: boxes
    });
    
    // Update display
    updateBoxDisplay();
    
    // Hide modal
    changeNameModal.classList.add('hidden');
    changeNameInput.value = '';
}

function generateBoxes() {
    boxGrid.innerHTML = '';
    
    for (let i = 1; i <= TOTAL_BOXES; i++) {
        // Create Bootstrap column
        const col = document.createElement('div');
        col.className = 'col-4 col-sm-3 col-md-2 col-lg-1';
        
        const box = document.createElement('div');
        box.className = 'box';
        box.dataset.boxNumber = i;
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'box-number';
        numberDiv.textContent = i;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'box-content';
        
        box.appendChild(numberDiv);
        box.appendChild(contentDiv);
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
        
        col.appendChild(box);
        boxGrid.appendChild(col);
    }
    
    updateBoxDisplay();
}

function handleBoxClick(boxNumber) {
    // Don't allow selection if disconnected
    if (!isConnected) {
        return;
    }
    
    // Admin cannot select boxes (ADMIN is not a participant)
    if (currentUserName === ADMIN_NAME) {
        alert('Admin account cannot select boxes. Admin is only for managing the event.');
        return;
    }
    
    // Validate user is in participants list before allowing box selection
    if (!participants.includes(currentUserName)) {
        alert('Your name is not in the participants list. Please contact the admin.');
        return;
    }
    
    const box = boxes[boxNumber];
    if (!box) return;
    
    if (box.picker === currentUserName) {
        // User is clicking their own box
        if (isAdmin) {
            // Admin can unpick (though they shouldn't have boxes)
            if (confirm('Do you want to unselect this box?')) {
                publishMessage({
                    type: 'unselect-box',
                    boxNumber,
                    userName: currentUserName
                });
            }
        } else {
            // Non-admin cannot unpick
            alert('Cannot unpick a box. You already saw who you\'re gifting, it will be unfair to unpick and pick someone else.');
        }
    } else if (!box.picker) {
        // Box is available - select it and show assignment
        publishMessage({
            type: 'select-box',
            boxNumber,
            userName: currentUserName
        });
    } else {
        // Box is taken by someone else
        if (isAdmin) {
            // Admin can remove the claim
            if (confirm(`This box is selected by ${box.picker}\nAssigned: ${box.assigned}\n\nDo you want to remove ${box.picker} from this box?`)) {
                publishMessage({
                    type: 'admin-remove-box',
                    boxNumber,
                    userName: box.picker,
                    adminName: currentUserName
                });
            }
        } else {
            alert(`This box is already claimed`);
        }
    }
}

function handleAdminRemove(boxNumber) {
    if (!isAdmin) return;
    
    const box = boxes[boxNumber];
    if (!box || !box.picker) return;
    
    if (confirm(`Remove ${box.picker} from box ${boxNumber}?`)) {
        publishMessage({
            type: 'admin-remove-box',
            boxNumber,
            userName: box.picker,
            adminName: currentUserName
        });
    }
}

function updateBoxDisplay() {
    for (let i = 1; i <= TOTAL_BOXES; i++) {
        const boxElement = document.querySelector(`[data-box-number="${i}"]`);
        if (!boxElement) continue;
        
        const contentDiv = boxElement.querySelector('.box-content');
        const removeBtn = boxElement.querySelector('.box-remove-btn');
        const box = boxes[i];
        
        if (!box) continue;
        
        // Reset classes
        boxElement.classList.remove('available', 'selected', 'taken', 'disabled');
        
        if (box.picker === currentUserName) {
            // User's own box - show who they're assigned to gift
            boxElement.classList.add('selected');
            contentDiv.innerHTML = `
                <div class="box-picker">You picked this!</div>
                <div class="box-assigned">🎁 Gift to: <strong>${box.assigned}</strong></div>
            `;
            if (removeBtn) removeBtn.classList.add('hidden');
        } else if (box.picker) {
            // Box claimed by someone else
            boxElement.classList.add('taken');
            
            if (isAdmin) {
                // Admin sees picker and assignment
                contentDiv.innerHTML = `
                    <div class="box-picker">Picker: ${box.picker}</div>
                    <div class="box-assigned">Assigned: ${box.assigned}</div>
                `;
                if (removeBtn) removeBtn.classList.remove('hidden');
            } else {
                // Regular users just see "Claimed"
                contentDiv.innerHTML = `<div class="box-claimed">Claimed</div>`;
                if (removeBtn) removeBtn.classList.add('hidden');
            }
        } else {
            // Available box
            boxElement.classList.add('available');
            
            if (isAdmin) {
                // Admin sees who will be assigned
                contentDiv.innerHTML = `<div class="box-available">Available<br><small>Assigned: ${box.assigned}</small></div>`;
            } else {
                contentDiv.innerHTML = `<div class="box-available">Available</div>`;
            }
            if (removeBtn) removeBtn.classList.add('hidden');
        }
        
        // Disable all boxes if not connected
        if (!isConnected) {
            boxElement.classList.add('disabled');
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
            // Update boxes from server
            if (message.boxes && typeof message.boxes === 'object') {
                boxes = message.boxes;
                updateBoxDisplay();
                
                // Save to repository (admin only, automatic)
                if (isAdmin) {
                    saveToRepository();
                }
            }
            break;
        
        case 'select-box':
            // Remove any previous selection by this user
            for (let boxNum in boxes) {
                if (boxes[boxNum].picker === message.userName) {
                    boxes[boxNum].picker = '';
                }
            }
            // Add new selection
            if (boxes[message.boxNumber]) {
                boxes[message.boxNumber].picker = message.userName;
            }
            updateBoxDisplay();
            
            // Save to repository
            if (isAdmin) {
                saveToRepository();
            }
            break;
        
        case 'unselect-box':
            if (boxes[message.boxNumber] && boxes[message.boxNumber].picker === message.userName) {
                boxes[message.boxNumber].picker = '';
                updateBoxDisplay();
                
                // Save to repository
                if (isAdmin) {
                    saveToRepository();
                }
            }
            break;
        
        case 'admin-remove-box':
            // Admin removing someone's box selection
            if (boxes[message.boxNumber] && boxes[message.boxNumber].picker === message.userName) {
                boxes[message.boxNumber].picker = '';
                updateBoxDisplay();
                
                // Save to repository
                if (isAdmin) {
                    saveToRepository();
                }
            }
            break;
        
        case 'clear-users':
            // Clear all users - removes all pickers but keeps assignments
            for (let boxNum in boxes) {
                boxes[boxNum].picker = '';
            }
            updateBoxDisplay();
            
            // Save to repository
            if (isAdmin) {
                saveToRepository();
            }
            break;
        
        case 'upload-boxes':
            boxes = message.boxes || {};
            updateBoxDisplay();
            
            // Save to repository
            if (isAdmin) {
                saveToRepository();
            }
            break;
        
        case 'name-change':
            // Update all boxes that had the old picker name with the new name
            if (message.boxes) {
                boxes = message.boxes;
                updateBoxDisplay();
            }
            break;
        
        case 'state-request':
            // Someone is requesting current state, send it if we have boxes
            if (Object.keys(boxes).length > 0) {
                publishMessage({
                    type: 'state-response',
                    boxes: boxes
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
    
    // If no response after 2 seconds, use initialized state
    setTimeout(() => {
        if (Object.keys(boxes).filter(k => boxes[k].picker).length === 0) {
            console.log('Using initialized assignments');
            updateBoxDisplay();
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
        boxes: boxes,
        participants: participants,
        totalBoxes: TOTAL_BOXES,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `secret-santa-assignments-${new Date().toISOString().split('T')[0]}.json`;
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
            
            if (data.boxes && typeof data.boxes === 'object') {
                // Validate the data
                const isValid = Object.values(data.boxes).every(box => 
                    box.hasOwnProperty('picker') && box.hasOwnProperty('assigned')
                );
                
                if (isValid) {
                    // Publish to all clients
                    publishMessage({
                        type: 'upload-boxes',
                        boxes: data.boxes
                    });
                    alert('Successfully loaded box assignments!');
                } else {
                    alert('Invalid file format: missing picker or assigned fields');
                }
            } else {
                alert('Invalid file format: missing boxes data');
            }
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
}

function handleClearUsers() {
    if (!isAdmin) return;
    
    if (!confirm('Are you sure you want to CLEAR ALL USERS? This will remove all pickers from all boxes but keep the gift assignments intact.\n\nThis is useful for clearing old test data before the real event.')) {
        return;
    }
    
    // Publish clear-users to all clients
    publishMessage({ type: 'clear-users' });
}

// Show participants list in a modal
function showParticipants() {
    const tableContainer = document.getElementById('participantsTableContainer');
    
    // Create Bootstrap table
    let html = '<table class="table table-striped table-hover">';
    html += '<thead class="table-light"><tr>';
    html += '<th scope="col" class="text-center">#</th>';
    html += '<th scope="col">Participant Name</th>';
    
    if (isAdmin) {
        html += '<th scope="col" class="text-center">Box Picked</th>';
        html += '<th scope="col">Gifting To</th>';
    }
    
    html += '</tr></thead><tbody>';
    
    participants.forEach((participant, index) => {
        html += '<tr>';
        html += `<td class="text-center">${index + 1}</td>`;
        html += `<td>${participant}</td>`;
        
        if (isAdmin) {
            // Find which box this participant picked
            let pickedBox = '-';
            let giftingTo = '-';
            
            for (let boxNum in boxes) {
                if (boxes[boxNum].picker === participant) {
                    pickedBox = boxNum;
                    giftingTo = boxes[boxNum].assigned || '-';
                    break;
                }
            }
            
            html += `<td class="text-center"><span class="badge ${pickedBox === '-' ? 'bg-secondary' : 'bg-primary'}">${pickedBox}</span></td>`;
            html += `<td>${giftingTo}</td>`;
        }
        
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    if (!isAdmin) {
        html += '<div class="alert alert-info mt-3" role="alert"><small><i class="bi bi-info-circle"></i> As a participant, you can only see the list of names. Admin can see who picked which box and assignments.</small></div>';
    }
    
    tableContainer.innerHTML = html;
    participantsModal.classList.remove('hidden');
}

// Save current state to repository (manual for GitHub Pages - shows instructions)
function saveToRepository() {
    if (!isAdmin) return;
    
    // Create the JSON data
    const data = {
        boxes: boxes,
        participants: participants,
        totalBoxes: TOTAL_BOXES,
        lastUpdated: new Date().toISOString()
    };
    
    console.log('Repository state to save:', data);
    
    // For GitHub Pages, we can't automatically commit
    // Instead, we'll provide download instructions to admin
    // In a real implementation with server-side code, this would auto-commit
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
