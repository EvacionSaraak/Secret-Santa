// ===========================================================================
// Secret Santa Box Picker - Main Application Script
// ===========================================================================
// This is the main application logic. Configuration is in separate files:
// - firebase-integration.js: Firebase database integration
// - pubnub-integration.js: PubNub real-time messaging
// ===========================================================================

// State management
let currentUserName = '';
let participants = []; // Array of participant names loaded from participants.txt
let boxes = {}; // { boxNumber: { picker: userName, assigned: assignedName } }
let TOTAL_BOXES = 0; // Will be set to participants.length

// Admin configuration
const ADMIN_NAME = 'ADMIN'; // Admin has special account and cannot be a participant
const ADMIN_PASSWORD = 'SecretSanta2025!'; // Admin password (keep secret!)
let isAdmin = false;

// Box display configuration
const LONG_NAME_THRESHOLD = 15; // Names longer than this will trigger wider box display

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
const scrambleBtn = document.getElementById('scrambleBtn');
const showParticipantsBtn = document.getElementById('showParticipantsBtn');
const participantsModal = document.getElementById('participantsModal');
const closeParticipantsBtn = document.getElementById('closeParticipantsBtn');
const downloadNonPickersBtn = document.getElementById('downloadNonPickersBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const connectionStatus = document.getElementById('connectionStatus');
const syncIndicator = document.querySelector('.sync-indicator');
const syncStatus = document.querySelector('.sync-status');

// Initialize
async function init() {
    console.log('🎅 === SECRET SANTA APPLICATION STARTING ===');
    
    try {
        // Initialize Firebase
        console.log('🔥 Initializing Firebase...');
        initializeFirebase();
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
    }
    
    try {
        // Load participants from file
        console.log('📂 Loading participants from file...');
        await loadParticipants();
        console.log(`✅ Loaded ${participants.length} participants`);
    } catch (error) {
        console.error('❌ Failed to load participants:', error);
        alert('Failed to load participants list. The app may not work correctly.');
    }
    
    try {
        // Load saved state from Firebase (if available)
        console.log('💾 Loading saved state from Firebase...');
        await loadBoxesFromFirebase();
    } catch (error) {
        console.error('❌ Failed to load from Firebase:', error);
    }
    
    try {
        // Check if user already has a name stored
        const storedName = localStorage.getItem('secretSantaUserName');
        console.log(`🔍 Checking localStorage for saved name: ${storedName || 'none'}`);
        
        if (storedName) {
            currentUserName = storedName;
            isAdmin = (storedName === ADMIN_NAME); // Check if ADMIN account
            console.log(`👤 User found in storage: ${storedName} (Admin: ${isAdmin})`);
            showMainContent();
            connectToPubNub();
        } else {
            console.log('👤 No saved user - showing name modal');
        }
    } catch (error) {
        console.error('❌ Failed to check stored user:', error);
    }
    
    try {
        // Setup event listeners
        console.log('🎧 Setting up event listeners...');
        setupEventListeners();
        console.log('✅ Event listeners setup complete');
    } catch (error) {
        console.error('❌ CRITICAL: Failed to setup event listeners:', error);
        alert('Failed to setup event listeners. Buttons may not work. Error: ' + error.message);
    }
    
    try {
        // Generate boxes
        console.log('📦 Generating boxes...');
        generateBoxes();
    } catch (error) {
        console.error('❌ Failed to generate boxes:', error);
    }
    
    console.log('🎅 === INITIALIZATION COMPLETE ===');
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

// Load state from Firebase
// Wrapper function to load state from Firebase
async function loadBoxesFromFirebase() {
    const savedBoxes = await loadStateFromFirebase();
    
    if (savedBoxes && Object.keys(savedBoxes).length > 0) {
        // Validate saved boxes match current participants count
        if (Object.keys(savedBoxes).length === TOTAL_BOXES) {
            boxes = savedBoxes;
            console.log('✅ Using saved box assignments from Firebase');
        } else {
            console.log('⚠️ Saved boxes count mismatch, reinitializing');
            initializeAssignments();
            await saveBoxesToFirebase();
        }
    } else {
        console.log('ℹ️ No saved state in Firebase, initializing new assignments');
        initializeAssignments();
        await saveBoxesToFirebase();
    }
}

// Wrapper function to save state to Firebase with logging
async function saveBoxesToFirebase(actionType = 'state-update', userName = 'system', details = {}) {
    const saveSuccess = await saveStateToFirebase(boxes, participants, TOTAL_BOXES);
    await logStateChangeToFirebase(actionType, userName, details);
    return saveSuccess;
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
    
    console.log('🎲 Initialized box assignments:', boxes);
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
    scrambleBtn.addEventListener('click', handleScramble);
    showParticipantsBtn.addEventListener('click', showParticipants);
    closeParticipantsBtn.addEventListener('click', () => {
        participantsModal.classList.add('hidden');
    });
    
    if (downloadNonPickersBtn) {
        downloadNonPickersBtn.addEventListener('click', downloadNonPickers);
    }
}

// Setup autocomplete functionality for any input element
function setupAutocompleteForInput(input) {
    console.log(`🔧 Setting up autocomplete for input: ${input.id}`);
    console.log(`📊 Participants loaded: ${participants.length} names`);
    
    let currentFocus = -1;
    
    // Create autocomplete container
    const autocompleteDiv = document.createElement('div');
    autocompleteDiv.className = 'autocomplete-items';
    autocompleteDiv.id = `autocomplete-list-${input.id}`;
    input.parentNode.appendChild(autocompleteDiv);
    console.log(`✅ Created autocomplete dropdown container: autocomplete-list-${input.id}`);
    
    // Create preview element for translucent auto-fill
    const previewDiv = document.createElement('div');
    previewDiv.className = 'autocomplete-preview';
    previewDiv.id = `autocomplete-preview-${input.id}`;
    input.parentNode.insertBefore(previewDiv, input);
    console.log(`✅ Created preview element: autocomplete-preview-${input.id}`);
    
    // Function to update preview text
    function updatePreview(inputValue) {
        if (!inputValue) {
            previewDiv.textContent = '';
            return;
        }
        
        // Find the best matching participant (starting with the input)
        // Note: Uses startsWith() for more relevant preview (only shows completion for prefix matches)
        const matches = participants.filter(name => 
            name.toLowerCase().startsWith(inputValue.toLowerCase())
        );
        
        console.log(`🔍 Preview search for "${inputValue}": found ${matches.length} matches`);
        
        if (matches.length > 0) {
            const bestMatch = matches[0];
            // Show the remaining part of the match
            const previewText = bestMatch.substring(inputValue.length);
            previewDiv.textContent = inputValue + previewText;
            console.log(`💡 Preview showing: "${bestMatch}"`);
        } else {
            previewDiv.textContent = '';
            console.log(`⚠️ No preview matches found`);
        }
    }
    
    input.addEventListener('input', function() {
        const val = this.value.trim();
        console.log(`⌨️ Input event - value: "${val}"`);
        
        closeList(input);
        updatePreview(val);
        if (!val) {
            console.log(`⚠️ Empty input - skipping dropdown`);
            return;
        }
        
        currentFocus = -1;
        
        // Find matching participants
        // Note: Uses includes() for broader search in dropdown (shows any partial matches)
        const matches = participants.filter(name => 
            name.toLowerCase().includes(val.toLowerCase())
        );
        
        console.log(`🔍 Dropdown search for "${val}": found ${matches.length} matches`);
        console.log(`📋 Matches:`, matches.slice(0, 5));
        
        // Show top 5 matches
        const displayMatches = matches.slice(0, 5);
        console.log(`📦 Creating ${displayMatches.length} dropdown items`);
        
        displayMatches.forEach((match, index) => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            
            // Highlight matching part
            const startIndex = match.toLowerCase().indexOf(val.toLowerCase());
            div.innerHTML = match.substring(0, startIndex) +
                           `<strong>${match.substring(startIndex, startIndex + val.length)}</strong>` +
                           match.substring(startIndex + val.length);
            
            console.log(`  ✨ Created dropdown item ${index + 1}: "${match}"`);
            
            div.addEventListener('click', function() {
                console.log(`👆 Clicked on: "${match}"`);
                input.value = match;
                closeList(input);
                updatePreview('');
            });
            
            autocompleteDiv.appendChild(div);
        });
        
        console.log(`✅ Dropdown populated with ${autocompleteDiv.children.length} items`);
        console.log(`📍 Dropdown element ID: ${autocompleteDiv.id}`);
        console.log(`📍 Dropdown parent:`, autocompleteDiv.parentNode);
        console.log(`📍 Dropdown visible:`, !autocompleteDiv.classList.contains('hidden'));
    });
    
    input.addEventListener('keydown', function(e) {
        const listId = `autocomplete-list-${input.id}`;
        let items = document.getElementById(listId);
        if (items) items = items.getElementsByClassName('autocomplete-item');
        
        if (e.key === 'Tab' && previewDiv.textContent) { // Tab key - accept preview
            e.preventDefault();
            input.value = previewDiv.textContent;
            updatePreview('');
            closeList(input);
        } else if (e.key === 'ArrowRight' && previewDiv.textContent) { // Right arrow - accept preview
            const cursorAtEnd = input.selectionStart === input.value.length;
            if (cursorAtEnd) {
                e.preventDefault();
                input.value = previewDiv.textContent;
                updatePreview('');
                closeList(input);
            }
        } else if (e.key === 'ArrowDown') { // Down arrow
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') { // Up arrow
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') { // Enter
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
        console.log(`🎯 Active item set to index: ${currentFocus}`);
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
            console.log(`🗑️ Clearing dropdown list: ${listId} (had ${list.children.length} items)`);
            list.innerHTML = '';
        }
    }
    
    // Close autocomplete when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target !== input) {
            console.log(`👆 Clicked outside input - closing dropdown`);
            closeList(input);
        }
    });
}

// Handle admin login with hidden password input
function handleAdminLogin() {
    // Create a password modal
    const passwordModal = document.createElement('div');
    passwordModal.className = 'custom-modal modal-fade-in';
    passwordModal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden modal-scale-in">
                <div class="modal-header bg-gradient text-white border-0 py-4">
                    <div class="w-100 text-center">
                        <div class="modal-icon-small mb-2">🔐</div>
                        <h5 class="modal-title mb-0 fw-bold">Admin Login</h5>
                    </div>
                </div>
                <div class="modal-body p-4 p-md-5">
                    <p class="text-muted mb-4">Enter your admin password to continue:</p>
                    <div class="mb-4">
                        <label for="adminPasswordInput" class="form-label fw-semibold">
                            <i class="bi bi-key me-2"></i>Password
                        </label>
                        <input type="password" id="adminPasswordInput" class="form-control form-control-lg rounded-3 shadow-sm" placeholder="Enter admin password" autocomplete="off" autofocus />
                    </div>
                </div>
                <div class="modal-footer border-0 bg-light p-4">
                    <button id="adminPasswordSubmit" class="btn btn-primary px-5 rounded-3">
                        <i class="bi bi-check-circle me-2"></i>Login
                    </button>
                    <button id="adminPasswordCancel" class="btn btn-outline-secondary px-4 rounded-3">
                        <i class="bi bi-x-circle me-2"></i>Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(passwordModal);
    
    const passwordInput = document.getElementById('adminPasswordInput');
    const submitBtn = document.getElementById('adminPasswordSubmit');
    const cancelBtn = document.getElementById('adminPasswordCancel');
    
    const handleSubmit = async () => {
        const password = passwordInput.value;
        if (!password) {
            alert('Please enter a password');
            return;
        }
        
        if (password === ADMIN_PASSWORD) {
            currentUserName = ADMIN_NAME;
            isAdmin = true;
            localStorage.setItem('secretSantaUserName', ADMIN_NAME);
            
            // Sign in anonymously to Firebase
            await signInAnonymously();
            
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

async function handleNameSubmit() {
    const name = userNameInput.value.trim();
    console.log(`📝 Name submit clicked - input value: "${name}"`);
    
    if (name === '') {
        console.log('⚠️ Empty name - showing alert');
        alert('Please select your name from the list');
        return;
    }
    
    // Find closest match in participants list
    const camelCaseName = toCamelCase(name);
    console.log(`🔄 Converted to camel case: "${camelCaseName}"`);
    
    const exactMatch = participants.find(p => p.toLowerCase() === camelCaseName.toLowerCase());
    console.log(`🔍 Searching for exact match in ${participants.length} participants...`);
    
    if (!exactMatch) {
        console.log(`❌ No match found for: "${camelCaseName}"`);
        console.log(`📋 Available participants:`, participants.slice(0, 10));
        alert('Name not found in participants list. Please select from the suggested names.');
        return;
    }
    
    console.log(`✅ Match found: "${exactMatch}"`);
    currentUserName = exactMatch; // Use exact match from participants
    isAdmin = false; // Regular users cannot become admin via normal login
    localStorage.setItem('secretSantaUserName', currentUserName);
    console.log(`💾 Saved to localStorage: "${currentUserName}"`);
    
    // Sign in anonymously to Firebase
    await signInAnonymously();
    
    console.log(`🚀 Showing main content...`);
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

async function handleAdminLogout() {
    if (!isAdmin) return;
    
    if (confirm('Are you sure you want to logout as admin?')) {
        // Clear admin status
        isAdmin = false;
        
        // Clear current user name
        currentUserName = '';
        
        // Remove from localStorage
        localStorage.removeItem('secretSantaUserName');
        
        // Sign out from Firebase
        await signOutAnonymously();
        
        // Disconnect from PubNub and Firebase using modular functions
        disconnectPubNub();
        disconnectFirebase();
        isConnected = false;
        
        // Hide main content and show name modal
        mainContent.classList.add('hidden');
        nameModal.classList.remove('hidden');
        
        // Reset and focus on name input
        userNameInput.value = '';
        userNameInput.focus();
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

async function handleChangeNameSubmit() {
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
    
    // Check if the target name already has a claimed box
    for (let boxNum in boxes) {
        if (boxes[boxNum] && boxes[boxNum].picker === trimmedName) {
            // Silently prevent name change - just close the modal
            changeNameModal.classList.add('hidden');
            changeNameInput.value = '';
            return;
        }
    }
    
    const oldName = currentUserName;
    currentUserName = trimmedName;
    
    // Update localStorage
    localStorage.setItem('secretSantaUserName', currentUserName);
    
    // Sign out and sign in again with new identity
    await signOutAnonymously();
    await signInAnonymously();
    
    // Update display
    currentUserNameSpan.textContent = currentUserName;
    
    // Update admin controls
    updateAdminControls();
    
    // Update all boxes that had the old picker name
    for (let boxNumber in boxes) {
        if (boxes[boxNumber] && boxes[boxNumber].picker === oldName) {
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
        
        // Add admin remove button for claimed boxes (always create it, show/hide based on admin status)
        const removeBtn = document.createElement('button');
        removeBtn.className = 'box-remove-btn hidden';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Remove selection';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent box click
            handleAdminRemove(i);
        });
        box.appendChild(removeBtn);
        
        boxGrid.appendChild(box);
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
        // Check if non-admin user already has a box selected
        if (!isAdmin) {
            for (let boxNum in boxes) {
                if (boxes[boxNum] && boxes[boxNum].picker === currentUserName) {
                    alert('You have already selected a box. You cannot change your selection.');
                    return;
                }
            }
        }
        
        // Box is available - show loading state and select it
        showBoxLoadingState(boxNumber);
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

function showBoxLoadingState(boxNumber) {
    const boxElement = document.querySelector(`[data-box-number="${boxNumber}"]`);
    if (!boxElement) return;
    
    const contentDiv = boxElement.querySelector('.box-content');
    boxElement.classList.remove('available', 'selected', 'taken');
    boxElement.classList.add('loading');
    contentDiv.innerHTML = `
        <div class="box-loading">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <div>Claiming box...</div>
        </div>
    `;
}

function hideBoxLoadingState(boxNumber) {
    const boxElement = document.querySelector(`[data-box-number="${boxNumber}"]`);
    if (boxElement) {
        boxElement.classList.remove('loading');
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
        boxElement.classList.remove('available', 'selected', 'taken', 'disabled', 'box-wide');
        
        if (box.picker === currentUserName) {
            // User's own box - show who they're assigned to gift
            boxElement.classList.add('selected');
            contentDiv.innerHTML = `
                <div class="box-picker">You picked this!</div>
                <div class="box-assigned">🎁 Gift to: <strong>${box.assigned}</strong></div>
            `;
            // Make box wider if name is long
            if (box.assigned && box.assigned.length > LONG_NAME_THRESHOLD) {
                boxElement.classList.add('box-wide');
            }
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
                // Make box wider if names are long
                if ((box.picker && box.picker.length > LONG_NAME_THRESHOLD) || (box.assigned && box.assigned.length > LONG_NAME_THRESHOLD)) {
                    boxElement.classList.add('box-wide');
                }
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
                // Make box wider if name is long
                if (box.assigned && box.assigned.length > LONG_NAME_THRESHOLD) {
                    boxElement.classList.add('box-wide');
                }
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
    
    // Setup Firebase real-time listeners using the modular function
    setupFirebaseListeners((updatedBoxes) => {
        if (updatedBoxes && JSON.stringify(updatedBoxes) !== JSON.stringify(boxes)) {
            console.log('🔄 Firebase update detected, syncing boxes');
            boxes = updatedBoxes;
            updateBoxDisplay();
        }
    });
    
    // Initialize PubNub using the modular function
    initializePubNub(
        // onStatusChange callback
        (connected) => {
            isConnected = connected;
            updateSyncStatus(connected);
            if (connected) {
                hideLoadingOverlay();
                updateBoxDisplay();
                requestCurrentState();
            } else {
                showLoadingOverlay('Connection error. Please check your PubNub keys.');
            }
        },
        // onMessage callback
        (message) => {
            handleMessage(message);
        }
    );
}

// Remove duplicate setupFirebaseListeners function - now using modular version


function handleMessage(message) {
    console.log('Received message:', message);
    
    switch (message.type) {
        case 'state-response':
            // Update boxes from server
            if (message.boxes && typeof message.boxes === 'object') {
                boxes = message.boxes;
                updateBoxDisplay();
                
                // Save to Firebase with logging
                if (isAdmin) {
                    saveBoxesToFirebase('state-response', currentUserName, { source: 'pubnub' });
                }
            }
            break;
        
        case 'select-box':
            // Handle the selection - but wait for Firebase confirmation before updating UI
            (async () => {
                // Remove any previous selection by this user
                for (let boxNum in boxes) {
                    if (boxes[boxNum] && boxes[boxNum].picker === message.userName) {
                        boxes[boxNum].picker = '';
                    }
                }
                // Add new selection
                if (boxes[message.boxNumber]) {
                    boxes[message.boxNumber].picker = message.userName;
                }
                
                // Save to Firebase with logging (save from all users, not just admin)
                const saveSuccess = await saveBoxesToFirebase('select-box', message.userName, {
                    boxNumber: message.boxNumber,
                    assigned: boxes[message.boxNumber]?.assigned
                });
                
                // Only update UI after Firebase confirms save (or if Firebase not available)
                hideBoxLoadingState(message.boxNumber);
                updateBoxDisplay();
                
                if (!saveSuccess) {
                    console.warn('⚠️ Firebase save failed, but showing selection anyway (PubNub sync)');
                }
            })();
            break;
            saveBoxesToFirebase('select-box', message.userName, {
                boxNumber: message.boxNumber,
                assigned: boxes[message.boxNumber]?.assigned
            });
            break;
        
        case 'unselect-box':
            if (boxes[message.boxNumber] && boxes[message.boxNumber].picker === message.userName) {
                boxes[message.boxNumber].picker = '';
                updateBoxDisplay();
                
                // Save to Firebase with logging (save from all users, not just admin)
                saveBoxesToFirebase('unselect-box', message.userName, {
                    boxNumber: message.boxNumber
                });
            }
            break;
        
        case 'admin-remove-box':
            // Admin removing someone's box selection
            console.log(`🗑️ Admin remove request for box ${message.boxNumber}, user: ${message.userName}`);
            console.log(`📦 Current box state:`, boxes[message.boxNumber]);
            
            if (boxes[message.boxNumber]) {
                if (boxes[message.boxNumber].picker === message.userName) {
                    console.log(`✅ Removing ${message.userName} from box ${message.boxNumber}`);
                    boxes[message.boxNumber].picker = '';
                    updateBoxDisplay();
                    
                    // Save to Firebase with logging
                    saveBoxesToFirebase('admin-remove-box', message.adminName || currentUserName, {
                        boxNumber: message.boxNumber,
                        removedUser: message.userName
                    });
                } else {
                    console.log(`⚠️ Picker mismatch! Box has: "${boxes[message.boxNumber].picker}", message has: "${message.userName}"`);
                }
            } else {
                console.log(`❌ Box ${message.boxNumber} does not exist in boxes object`);
            }
            break;
        
        case 'clear-users':
            // Clear all users - removes all pickers but keeps assignments
            for (let boxNum in boxes) {
                if (boxes[boxNum]) {
                    boxes[boxNum].picker = '';
                }
            }
            updateBoxDisplay();
            
            // Save to Firebase with logging
            saveBoxesToFirebase('clear-users', currentUserName, {
                totalCleared: Object.keys(boxes).length
            });
            break;
        
        case 'upload-boxes':
            boxes = message.boxes || {};
            updateBoxDisplay();
            
            // Save to Firebase with logging
            saveBoxesToFirebase('upload-boxes', currentUserName, {
                totalBoxes: Object.keys(boxes).length
            });
            break;
        
        case 'scramble-boxes':
            // Scramble assignments - update box assignments from admin
            boxes = message.boxes || {};
            updateBoxDisplay();
            
            // Save to Firebase with logging
            saveBoxesToFirebase('scramble-boxes', currentUserName, {
                totalBoxes: Object.keys(boxes).length
            });
            
            alert('🔀 Admin has scrambled the box assignments! Your assignment may have changed.');
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
        if (Object.keys(boxes).filter(k => boxes[k] && boxes[k].picker).length === 0) {
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

// Helper function to get participant's box details
function getParticipantBoxDetails(participantName) {
    for (const [boxNum, box] of Object.entries(boxes)) {
        if (box && box.picker === participantName) {
            return {
                hasPicked: true,
                boxNumber: boxNum,
                giftingTo: box.assigned || '-'
            };
        }
    }
    return {
        hasPicked: false,
        boxNumber: '-',
        giftingTo: '-'
    };
}

// Helper function to sanitize CSV content to prevent formula injection
function sanitizeCSVField(field) {
    // Prevent CSV injection by escaping formula characters
    const str = String(field);
    if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
        return `'${str}`;  // Prefix with single quote to prevent formula execution
    }
    return str;
}

// Download list of participants who haven't picked a box
function downloadNonPickers() {
    if (!isAdmin) return;
    
    // Find participants who haven't picked
    const nonPickers = [];
    
    participants.forEach(participant => {
        const details = getParticipantBoxDetails(participant);
        if (!details.hasPicked) {
            nonPickers.push(participant);
        }
    });
    
    if (nonPickers.length === 0) {
        // Don't show alert - user already saw the success message in the modal
        return;
    }
    
    // Create CSV content with sanitized fields
    const csvContent = 'Name\n' + nonPickers.map(name => `"${sanitizeCSVField(name)}"`).join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `non-pickers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleUpload(event) {
    if (!isAdmin) {
        event.target.value = '';
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    // Prompt for admin password
    const password = prompt('⚠️ ADMIN PASSWORD REQUIRED\n\nEnter the admin password to upload new box assignments:');
    if (password !== ADMIN_PASSWORD) {
        alert('❌ Incorrect password. Upload cancelled.');
        event.target.value = '';
        return;
    }
    
    // Confirm action
    if (!confirm('⚠️ WARNING: This will replace all current box assignments!\n\nAre you sure you want to continue?')) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.boxes && typeof data.boxes === 'object') {
                // Validate the data - check each box entry is either null or has required fields
                const isValid = Object.values(data.boxes).every(box => 
                    box === null || (box && box.hasOwnProperty('picker') && box.hasOwnProperty('assigned'))
                );
                
                if (isValid) {
                    // Publish to all clients
                    publishMessage({
                        type: 'upload-boxes',
                        boxes: data.boxes
                    });
                    alert('✅ Successfully loaded box assignments!');
                } else {
                    alert('❌ Invalid file format: missing picker or assigned fields');
                }
            } else {
                alert('❌ Invalid file format: missing boxes data');
            }
        } catch (error) {
            alert('❌ Error reading file: ' + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
}

function handleClearUsers() {
    if (!isAdmin) return;
    
    // Prompt for admin password
    const password = prompt('⚠️ ADMIN PASSWORD REQUIRED\n\nEnter the admin password to clear all users:');
    if (password !== ADMIN_PASSWORD) {
        alert('❌ Incorrect password. Action cancelled.');
        return;
    }
    
    if (!confirm('Are you sure you want to CLEAR ALL USERS? This will remove all pickers from all boxes but keep the gift assignments intact.\n\nThis is useful for clearing old test data before the real event.')) {
        return;
    }
    
    // Publish clear-users to all clients
    publishMessage({ type: 'clear-users' });
}

// Handle scramble button - reshuffles box assignments (admin only)
function handleScramble() {
    if (!isAdmin) return;
    
    // Prompt for admin password
    const password = prompt('⚠️ ADMIN PASSWORD REQUIRED\n\nEnter the admin password to scramble assignments:');
    if (password !== ADMIN_PASSWORD) {
        alert('❌ Incorrect password. Action cancelled.');
        return;
    }
    
    if (!confirm('🔀 SCRAMBLE ASSIGNMENTS\n\nThis will completely re-randomize who is assigned to each box number.\n\n⚠️ WARNING: This will affect EVERYONE\'s assignments!\n\nAre you absolutely sure you want to do this?')) {
        return;
    }
    
    // Create a fresh shuffled list of participants
    const shuffled = [...participants];
    
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Re-assign each box while keeping who picked it
    for (let i = 1; i <= TOTAL_BOXES; i++) {
        if (boxes[i]) {
            boxes[i].assigned = shuffled[i - 1]; // New assignment
            // Keep the picker as-is
        }
    }
    
    console.log('🔀 Scrambled box assignments:', boxes);
    
    // Publish scramble message to all clients
    publishMessage({ 
        type: 'scramble-boxes',
        boxes: boxes
    });
    
    // Save to Firebase with logging
    saveBoxesToFirebase('scramble-boxes', currentUserName, {
        totalBoxes: TOTAL_BOXES
    });
    
    alert('✅ Box assignments have been scrambled! All users will see the new assignments.');
}

// Show participants list in a modal
function showParticipants() {
    const tableContainer = document.getElementById('participantsTableContainer');
    
    // Track non-pickers for the download button
    const nonPickers = [];
    
    // Create Bootstrap table
    let html = '<table class="table table-striped table-hover">';
    html += '<thead class="table-light"><tr>';
    html += '<th scope="col" class="text-center">#</th>';
    html += '<th scope="col">Participant Name</th>';
    
    if (isAdmin) {
        html += '<th scope="col" class="text-center">Box Picked</th>';
        html += '<th scope="col">Gifting To</th>';
        html += '<th scope="col" class="text-center">Status</th>';
    }
    
    html += '</tr></thead><tbody>';
    
    participants.forEach((participant, index) => {
        // Get participant's box details
        const details = getParticipantBoxDetails(participant);
        
        // Track non-pickers for admin
        if (isAdmin && !details.hasPicked) {
            nonPickers.push(participant);
        }
        
        // Highlight row for non-pickers in admin view
        const rowClass = isAdmin && !details.hasPicked ? 'table-warning' : '';
        html += `<tr class="${rowClass}">`;
        html += `<td class="text-center">${index + 1}</td>`;
        html += `<td>${participant}</td>`;
        
        if (isAdmin) {
            html += `<td class="text-center"><span class="badge ${details.boxNumber === '-' ? 'bg-secondary' : 'bg-primary'}">${details.boxNumber}</span></td>`;
            html += `<td>${details.giftingTo}</td>`;
            html += `<td class="text-center">`;
            if (details.hasPicked) {
                html += '<span class="badge bg-success" aria-label="Picked"><i class="bi bi-check-circle" aria-hidden="true"></i> Picked</span>';
            } else {
                html += '<span class="badge bg-warning text-dark" aria-label="Not Picked"><i class="bi bi-exclamation-circle" aria-hidden="true"></i> Not Picked</span>';
            }
            html += '</td>';
        }
        
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    if (!isAdmin) {
        html += '<div class="alert alert-info mt-3" role="alert"><small><i class="bi bi-info-circle"></i> As a participant, you can only see the list of names. Admin can see who picked which box and assignments.</small></div>';
    } else if (nonPickers.length > 0) {
        html += `<div class="alert alert-warning mt-3" role="alert">`;
        html += `<i class="bi bi-exclamation-triangle"></i> <strong>${nonPickers.length} participant(s) haven't picked a box yet.</strong>`;
        html += `<br><small>Highlighted rows show participants who haven't made their selection.</small>`;
        html += `</div>`;
    } else {
        html += '<div class="alert alert-success mt-3" role="alert"><i class="bi bi-check-circle"></i> <strong>All participants have picked their boxes!</strong></div>';
    }
    
    tableContainer.innerHTML = html;
    
    // Show/hide download button for admin
    if (downloadNonPickersBtn) {
        if (isAdmin && nonPickers.length > 0) {
            downloadNonPickersBtn.classList.remove('hidden');
        } else {
            downloadNonPickersBtn.classList.add('hidden');
        }
    }
    
    participantsModal.classList.remove('hidden');
}

// Save current state to repository (manual for GitHub Pages - shows instructions)
// This function is kept for backward compatibility but is now deprecated
// The actual Firebase saving is handled in firebase-integration.js
function saveToRepository() {
    // Legacy function - no longer used
    console.log('ℹ️ Legacy saveToRepository called - using Firebase instead');
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
(function() {
    console.log('🚀 === SCRIPT LOADED - ATTEMPTING TO START APPLICATION ===');
    
    // Check if required functions exist
    console.log('Checking dependencies:');
    console.log('  - init function exists:', typeof init === 'function');
    console.log('  - participants array exists:', typeof participants !== 'undefined');
    console.log('  - firebase object exists:', typeof firebase !== 'undefined');
    console.log('  - PubNub object exists:', typeof PubNub !== 'undefined');
    
    try {
        init();
    } catch (error) {
        console.error('❌ CRITICAL ERROR during initialization:', error);
        console.error('Stack trace:', error.stack);
        alert('Application failed to start. Check console for details. Error: ' + error.message);
    }
})();
