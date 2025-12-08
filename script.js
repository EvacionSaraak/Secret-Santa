// State management
let currentUserName = '';
let selections = {}; // { boxNumber: userName }
const TOTAL_BOXES = 60;

// WebSocket connection
let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 30000; // 30 seconds max
let isConnected = false;

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
const connectionProgress = document.getElementById('connectionProgress');

// Initialize
function init() {
    // Check if user already has a name stored
    const storedName = localStorage.getItem('secretSantaUserName');
    if (storedName) {
        currentUserName = storedName;
        showMainContent();
        connectToServer();
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
    connectToServer();
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
    // Don't allow selection if disconnected
    if (!isConnected) {
        return;
    }
    
    const owner = selections[boxNumber];
    
    if (owner === currentUserName) {
        // User is unselecting their own box
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
                type: 'unselect-box', 
                boxNumber, 
                userName: currentUserName 
            }));
        }
    } else if (!owner) {
        // Box is available - select it (server will handle unsetting previous box)
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
                type: 'select-box', 
                boxNumber, 
                userName: currentUserName 
            }));
        }
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
        box.classList.remove('available', 'selected', 'taken', 'disabled');
        
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
        
        // Disable all boxes if not connected
        if (!isConnected) {
            box.classList.add('disabled');
        }
    }
}

function connectToServer() {
    // Show loading overlay
    showLoadingOverlay('Connecting to server...');
    
    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
        console.log('Connected to server');
        isConnected = true;
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        // Identify user to server
        socket.send(JSON.stringify({ 
            type: 'user-identified', 
            userName: currentUserName 
        }));
        
        updateSyncStatus(true);
        hideLoadingOverlay();
        updateBoxDisplay(); // Update boxes to enable them
    };
    
    socket.onclose = () => {
        console.log('Disconnected from server');
        isConnected = false;
        updateSyncStatus(false);
        updateBoxDisplay(); // Update boxes to disable them
        
        // Exponential backoff: delay = min(2^attempts * 1000, MAX_DELAY)
        const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, MAX_RECONNECT_DELAY);
        reconnectAttempts++;
        const delaySeconds = Math.round(delay / 1000);
        
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})...`);
        showLoadingOverlay(`Reconnecting in ${delaySeconds}s... (attempt ${reconnectAttempts})`);
        
        setTimeout(() => {
            if (currentUserName) {
                connectToServer();
            }
        }, delay);
    };
    
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnected = false;
        showLoadingOverlay('Connection error. Retrying...');
    };
    
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'initial-state':
                selections = data.selections;
                updateBoxDisplay();
                break;
            
            case 'selections-updated':
                selections = data.selections;
                updateBoxDisplay();
                break;
            
            case 'selection-error':
                alert(data.message);
                break;
            
            case 'users-count':
                console.log(`Connected users: ${data.count}`);
                break;
        }
    };
}

function updateSyncStatus(connected) {
    const syncIndicator = document.querySelector('.sync-indicator');
    const syncStatus = document.querySelector('.sync-status');
    
    if (connected) {
        syncIndicator.style.color = '#4ade80';
        syncStatus.innerHTML = '<span class="sync-indicator">●</span> Live updates enabled';
    } else {
        syncIndicator.style.color = '#f87171';
        syncStatus.innerHTML = '<span class="sync-indicator">●</span> Disconnected - trying to reconnect...';
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
                // Send to server to update all clients
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ 
                        type: 'upload-selections', 
                        selections: data.selections 
                    }));
                    alert('Successfully loaded selections!');
                }
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
    
    // Send reset to server
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'reset-all' }));
    }
}

function showLoadingOverlay(message) {
    if (loadingOverlay && connectionStatus) {
        connectionStatus.textContent = message;
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoadingOverlay() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Start the application
init();

