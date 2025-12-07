// State management
let participants = [];
let assignments = {}; // { name: number } - stores who picked which number
let eventInitialized = false;
let currentView = 'organizer'; // 'organizer' or 'participant'

// Real-time sync
let broadcastChannel = null;
let syncInterval = null;
const SYNC_INTERVAL_MS = 2000; // Check for updates every 2 seconds

// DOM elements
const nameInput = document.getElementById('nameInput');
const addNameBtn = document.getElementById('addNameBtn');
const namesList = document.getElementById('namesList');
const initializeBtn = document.getElementById('initializeBtn');

// Organizer view elements
const organizerView = document.getElementById('organizerView');
const organizerInitialState = document.getElementById('organizerInitialState');
const organizerActiveState = document.getElementById('organizerActiveState');
const statusDisplay = document.getElementById('statusDisplay');
const assignmentsPreview = document.getElementById('assignmentsPreview');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

// Participant view elements
const participantView = document.getElementById('participantView');
const participantSelect = document.getElementById('participantSelect');
const numberSelectionArea = document.getElementById('numberSelectionArea');
const numbersGrid = document.getElementById('numbersGrid');
const confirmationMessage = document.getElementById('confirmationMessage');

// Mode toggle buttons
const switchToOrganizerBtn = document.getElementById('switchToOrganizerBtn');
const switchToParticipantBtn = document.getElementById('switchToParticipantBtn');

// Upload elements
const uploadInput = document.getElementById('uploadInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadResult = document.getElementById('uploadResult');

// Sync status element
const syncStatus = document.getElementById('syncStatus');

// Event listeners
addNameBtn.addEventListener('click', addName);
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addName();
});
initializeBtn.addEventListener('click', initializeEvent);
downloadBtn.addEventListener('click', downloadJSON);
resetBtn.addEventListener('click', resetEvent);
participantSelect.addEventListener('change', handleParticipantSelection);
switchToOrganizerBtn.addEventListener('click', () => switchView('organizer'));
switchToParticipantBtn.addEventListener('click', () => switchView('participant'));
uploadBtn.addEventListener('click', handleUpload);

// Initialize BroadcastChannel for cross-tab communication
try {
    broadcastChannel = new BroadcastChannel('secret-santa-sync');
    broadcastChannel.onmessage = (event) => {
        if (event.data.type === 'data-updated') {
            loadFromLocalStorage();
        }
    };
} catch (e) {
    console.warn('BroadcastChannel not supported, using fallback sync');
}

// Listen for storage changes from other tabs/windows
window.addEventListener('storage', (e) => {
    if (e.key === 'secretSantaData' && e.newValue) {
        loadFromLocalStorage();
    }
});

// Set up periodic sync check
syncInterval = setInterval(() => {
    loadFromLocalStorage();
}, SYNC_INTERVAL_MS);

// Functions
function addName() {
    const name = nameInput.value.trim();
    
    if (name === '') {
        alert('Please enter a name');
        return;
    }
    
    if (participants.includes(name)) {
        alert('This name is already in the list');
        return;
    }
    
    participants.push(name);
    nameInput.value = '';
    renderNamesList();
    updateInitializeButton();
}

function removeName(name) {
    if (eventInitialized) {
        if (!confirm('Event is already initialized. Removing a participant may affect selections. Continue?')) {
            return;
        }
        // Remove from assignments if they had selected a number
        delete assignments[name];
    }
    
    participants = participants.filter(p => p !== name);
    renderNamesList();
    updateInitializeButton();
    
    if (eventInitialized) {
        updateOrganizerView();
        updateParticipantDropdown();
    }
}

function renderNamesList() {
    if (participants.length === 0) {
        namesList.innerHTML = '<p class="text-muted text-center p-3">No participants yet</p>';
        return;
    }
    
    namesList.innerHTML = '';
    participants.forEach(name => {
        const item = document.createElement('div');
        item.className = 'list-group-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'btn btn-danger btn-sm';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => removeName(name));
        
        item.appendChild(nameSpan);
        item.appendChild(removeButton);
        namesList.appendChild(item);
    });
}

function updateInitializeButton() {
    initializeBtn.disabled = participants.length < 2;
}

function initializeEvent() {
    if (participants.length < 2) {
        alert('You need at least 2 participants');
        return;
    }
    
    eventInitialized = true;
    assignments = {}; // Reset assignments
    
    // Update UI
    organizerInitialState.classList.add('d-none');
    organizerActiveState.classList.remove('d-none');
    
    // Show sync status indicator
    if (syncStatus) {
        syncStatus.classList.remove('d-none');
    }
    
    updateOrganizerView();
    updateParticipantDropdown();
    saveToLocalStorage();
}

function updateOrganizerView() {
    if (!eventInitialized) return;
    
    // Update status display
    statusDisplay.innerHTML = '';
    participants.forEach(name => {
        const statusItem = document.createElement('div');
        const hasSelected = assignments[name] !== undefined;
        
        statusItem.className = `status-item ${hasSelected ? 'completed' : 'pending'}`;
        statusItem.innerHTML = `
            <span>${escapeHtml(name)}</span>
            <span class="badge ${hasSelected ? 'bg-success' : 'bg-warning'} status-badge">
                ${hasSelected ? '✓ Selected' : 'Pending'}
            </span>
        `;
        statusDisplay.appendChild(statusItem);
    });
    
    // Update assignments preview
    assignmentsPreview.innerHTML = '';
    if (Object.keys(assignments).length === 0) {
        assignmentsPreview.innerHTML = '<p class="text-muted">No selections yet</p>';
    } else {
        const sortedAssignments = Object.entries(assignments).sort((a, b) => a[1] - b[1]);
        sortedAssignments.forEach(([name, number]) => {
            const item = document.createElement('div');
            item.className = 'assignment-item';
            item.innerHTML = `<strong>${escapeHtml(name)}</strong>: Number ${number}`;
            assignmentsPreview.appendChild(item);
        });
    }
}

function updateParticipantDropdown() {
    participantSelect.innerHTML = '<option value="">-- Select Your Name --</option>';
    participants.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        participantSelect.appendChild(option);
    });
}

function handleParticipantSelection() {
    const selectedName = participantSelect.value;
    
    if (selectedName === '') {
        numberSelectionArea.classList.add('d-none');
        confirmationMessage.classList.add('d-none');
        return;
    }
    
    // Check if this participant has already selected
    if (assignments[selectedName]) {
        confirmationMessage.classList.remove('d-none');
        confirmationMessage.textContent = `You have already selected number ${assignments[selectedName]}`;
        numberSelectionArea.classList.add('d-none');
        return;
    }
    
    // Show available numbers
    renderNumbersGrid(selectedName);
    numberSelectionArea.classList.remove('d-none');
    confirmationMessage.classList.add('d-none');
}

function renderNumbersGrid(selectedName) {
    numbersGrid.innerHTML = '';
    const totalNumbers = participants.length;
    const takenNumbers = Object.values(assignments);
    
    for (let i = 1; i <= totalNumbers; i++) {
        if (!takenNumbers.includes(i)) {
            const button = document.createElement('button');
            button.className = 'number-btn';
            button.textContent = i;
            button.addEventListener('click', () => selectNumber(selectedName, i));
            
            numbersGrid.appendChild(button);
        }
    }
}

function selectNumber(name, number) {
    // Confirm selection
    if (!confirm(`Confirm selection of number ${number}?`)) {
        return;
    }
    
    // Store the selection
    assignments[name] = number;
    
    // Show confirmation
    confirmationMessage.classList.remove('d-none');
    confirmationMessage.textContent = `✓ You have successfully selected number ${number}`;
    
    // Hide numbers grid
    numbersGrid.innerHTML = '';
    
    // Update organizer view if in that mode
    if (currentView === 'organizer') {
        updateOrganizerView();
    }
    
    // Save to localStorage for persistence
    saveToLocalStorage();
}

function downloadJSON() {
    const data = {
        participants: participants,
        assignments: assignments,
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `secret-santa-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function handleUpload() {
    const file = uploadInput.files[0];
    
    if (!file) {
        uploadResult.textContent = 'Please select a file';
        uploadResult.classList.remove('d-none');
        uploadResult.classList.add('alert-danger');
        uploadResult.classList.remove('alert-success');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate structure
            if (!data.participants || !Array.isArray(data.participants)) {
                throw new Error('Invalid JSON format: missing participants array');
            }
            
            // Validate participants are strings
            if (!data.participants.every(p => typeof p === 'string' && p.trim().length > 0)) {
                throw new Error('Invalid participant names in JSON');
            }
            
            // Validate assignments if present
            if (data.assignments) {
                if (typeof data.assignments !== 'object' || Array.isArray(data.assignments)) {
                    throw new Error('Invalid assignments format');
                }
                
                // Validate assignment values are numbers
                for (const [name, number] of Object.entries(data.assignments)) {
                    if (typeof number !== 'number' || number < 1 || number > data.participants.length) {
                        throw new Error(`Invalid assignment for ${name}: ${number}`);
                    }
                }
            }
            
            // Load data
            participants = data.participants;
            assignments = data.assignments || {};
            eventInitialized = participants.length > 0;
            
            // Update UI
            renderNamesList();
            updateInitializeButton();
            
            if (eventInitialized) {
                organizerInitialState.classList.add('d-none');
                organizerActiveState.classList.remove('d-none');
                updateOrganizerView();
                updateParticipantDropdown();
                
                // Show sync status indicator
                if (syncStatus) {
                    syncStatus.classList.remove('d-none');
                }
            }
            
            // Show success message
            uploadResult.textContent = `✓ Successfully loaded event with ${participants.length} participants`;
            uploadResult.classList.remove('d-none', 'alert-danger');
            uploadResult.classList.add('alert-success');
            
            saveToLocalStorage();
            
        } catch (error) {
            uploadResult.textContent = 'Error parsing JSON file: ' + error.message;
            uploadResult.classList.remove('d-none', 'alert-success');
            uploadResult.classList.add('alert-danger');
        }
    };
    
    reader.onerror = () => {
        uploadResult.textContent = 'Error reading file';
        uploadResult.classList.remove('d-none', 'alert-success');
        uploadResult.classList.add('alert-danger');
    };
    
    reader.readAsText(file);
}

function resetEvent() {
    if (!confirm('Are you sure you want to reset the event? This will clear all data.')) {
        return;
    }
    
    participants = [];
    assignments = {};
    eventInitialized = false;
    
    renderNamesList();
    updateInitializeButton();
    organizerActiveState.classList.add('d-none');
    organizerInitialState.classList.remove('d-none');
    
    numberSelectionArea.classList.add('d-none');
    confirmationMessage.classList.add('d-none');
    participantSelect.value = '';
    
    // Hide sync status indicator
    if (syncStatus) {
        syncStatus.classList.add('d-none');
    }
    
    clearLocalStorage();
}

function switchView(view) {
    currentView = view;
    
    if (view === 'organizer') {
        organizerView.classList.remove('d-none');
        participantView.classList.add('d-none');
        switchToOrganizerBtn.classList.add('active');
        switchToParticipantBtn.classList.remove('active');
    } else {
        organizerView.classList.add('d-none');
        participantView.classList.remove('d-none');
        switchToParticipantBtn.classList.add('active');
        switchToOrganizerBtn.classList.remove('active');
        
        if (eventInitialized) {
            updateParticipantDropdown();
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// LocalStorage functions for persistence
function saveToLocalStorage() {
    const data = {
        participants: participants,
        assignments: assignments,
        eventInitialized: eventInitialized,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('secretSantaData', JSON.stringify(data));
    
    // Notify other tabs about the update
    if (broadcastChannel) {
        try {
            broadcastChannel.postMessage({ type: 'data-updated' });
        } catch (e) {
            console.warn('Failed to broadcast update:', e);
        }
    }
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('secretSantaData');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            
            // Check if data has actually changed to avoid unnecessary updates
            const currentData = JSON.stringify({ participants, assignments, eventInitialized });
            const newData = JSON.stringify({ 
                participants: parsed.participants || [], 
                assignments: parsed.assignments || {}, 
                eventInitialized: parsed.eventInitialized || false 
            });
            
            // Skip update if data hasn't changed
            if (currentData === newData) {
                return;
            }
            
            // Validate participants
            if (parsed.participants && Array.isArray(parsed.participants)) {
                if (parsed.participants.every(p => typeof p === 'string' && p.trim().length > 0)) {
                    participants = parsed.participants;
                } else {
                    console.warn('Invalid participants in localStorage');
                    participants = [];
                }
            }
            
            // Validate assignments
            if (parsed.assignments && typeof parsed.assignments === 'object' && !Array.isArray(parsed.assignments)) {
                const validAssignments = {};
                for (const [name, number] of Object.entries(parsed.assignments)) {
                    if (typeof number === 'number' && number >= 1 && number <= participants.length) {
                        validAssignments[name] = number;
                    }
                }
                assignments = validAssignments;
            } else {
                assignments = {};
            }
            
            eventInitialized = parsed.eventInitialized && participants.length > 0;
            
            // Update UI
            renderNamesList();
            updateInitializeButton();
            
            if (eventInitialized) {
                organizerInitialState.classList.add('d-none');
                organizerActiveState.classList.remove('d-none');
                updateOrganizerView();
                updateParticipantDropdown();
                
                // Show sync status indicator
                if (syncStatus) {
                    syncStatus.classList.remove('d-none');
                }
                
                // Update participant view if a name is selected
                if (currentView === 'participant' && participantSelect.value) {
                    handleParticipantSelection();
                }
            } else {
                organizerInitialState.classList.remove('d-none');
                organizerActiveState.classList.add('d-none');
                
                // Hide sync status indicator
                if (syncStatus) {
                    syncStatus.classList.add('d-none');
                }
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
}

function clearLocalStorage() {
    localStorage.removeItem('secretSantaData');
}

// Initialize on page load
renderNamesList();
updateInitializeButton();
loadFromLocalStorage();
switchView('organizer');
