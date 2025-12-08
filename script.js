// State management
let currentUserName = '';
let selections = {}; // { boxNumber: userName }
const TOTAL_BOXES = 60;

// Real-time sync
let broadcastChannel = null;
let syncInterval = null;
const SYNC_INTERVAL_MS = 2000;

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

// Initialize
function init() {
    // Check if user already has a name stored
    const storedName = localStorage.getItem('secretSantaUserName');
    if (storedName) {
        currentUserName = storedName;
        showMainContent();
    }
    
    // Load saved selections
    loadSelections();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize real-time sync
    initializeSync();
    
    // Generate boxes
    generateBoxes();
}

function setupEventListeners() {
    submitNameBtn.addEventListener('click', handleNameSubmit);
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleNameSubmit();
    });
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
    localStorage.setItem('secretSantaUserName', name);
    showMainContent();
}

function showMainContent() {
    nameModal.classList.add('hidden');
    mainContent.classList.remove('hidden');
    currentUserNameSpan.textContent = currentUserName;
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
        
        boxGrid.appendChild(box);
    }
    
    updateBoxDisplay();
}

function handleBoxClick(boxNumber) {
    const owner = selections[boxNumber];
    
    if (owner === currentUserName) {
        // User is unselecting their own box
        delete selections[boxNumber];
        saveSelections();
        updateBoxDisplay();
    } else if (!owner) {
        // Box is available
        selections[boxNumber] = currentUserName;
        saveSelections();
        updateBoxDisplay();
    } else {
        // Box is taken by someone else
        alert(`This box is already selected by ${owner}`);
    }
}

function updateBoxDisplay() {
    for (let i = 1; i <= TOTAL_BOXES; i++) {
        const box = document.querySelector(`[data-box-number="${i}"]`);
        const ownerDiv = box.querySelector('.box-owner');
        const owner = selections[i];
        
        // Reset classes
        box.classList.remove('available', 'selected', 'taken');
        
        if (owner === currentUserName) {
            box.classList.add('selected');
            ownerDiv.textContent = currentUserName;
        } else if (owner) {
            box.classList.add('taken');
            ownerDiv.textContent = owner;
        } else {
            box.classList.add('available');
            ownerDiv.textContent = '';
        }
    }
}

function saveSelections() {
    const data = {
        selections: selections,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('secretSantaSelections', JSON.stringify(data));
    
    // Broadcast update to other tabs
    if (broadcastChannel) {
        try {
            broadcastChannel.postMessage({ type: 'selections-updated' });
        } catch (e) {
            console.warn('Failed to broadcast update:', e);
        }
    }
}

function loadSelections() {
    const data = localStorage.getItem('secretSantaSelections');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            if (parsed.selections && typeof parsed.selections === 'object') {
                selections = parsed.selections;
                updateBoxDisplay();
            }
        } catch (e) {
            console.error('Error loading selections:', e);
        }
    }
}

function initializeSync() {
    // BroadcastChannel for cross-tab communication
    try {
        broadcastChannel = new BroadcastChannel('secret-santa-boxes');
        broadcastChannel.onmessage = (event) => {
            if (event.data.type === 'selections-updated') {
                loadSelections();
            }
        };
    } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
    }
    
    // Storage event for cross-window updates
    window.addEventListener('storage', (e) => {
        if (e.key === 'secretSantaSelections' && e.newValue) {
            loadSelections();
        }
    });
    
    // Periodic sync
    syncInterval = setInterval(() => {
        loadSelections();
    }, SYNC_INTERVAL_MS);
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
                selections = data.selections;
                saveSelections();
                updateBoxDisplay();
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
    
    selections = {};
    saveSelections();
    updateBoxDisplay();
}

// Start the application
init();

