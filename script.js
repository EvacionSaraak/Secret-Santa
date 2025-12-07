// State management
let participants = [];
let assignments = {};
let selectedUser = '';

// Constants
const MAX_ASSIGNMENT_ATTEMPTS = 100;

// DOM elements
const nameInput = document.getElementById('nameInput');
const addNameBtn = document.getElementById('addNameBtn');
const namesList = document.getElementById('namesList');
const submitNamesBtn = document.getElementById('submitNamesBtn');
const userSelect = document.getElementById('userSelect');
const distributeBtn = document.getElementById('distributeBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const uploadInput = document.getElementById('uploadInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadResult = document.getElementById('uploadResult');

// State panels
const initialState = document.getElementById('initialState');
const selectUserState = document.getElementById('selectUserState');
const resultState = document.getElementById('resultState');

// Event listeners
addNameBtn.addEventListener('click', addName);
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addName();
});
submitNamesBtn.addEventListener('click', submitNames);
userSelect.addEventListener('change', handleUserSelection);
distributeBtn.addEventListener('click', distributeNumbers);
downloadBtn.addEventListener('click', downloadJSON);
resetBtn.addEventListener('click', resetApp);
uploadBtn.addEventListener('click', handleUpload);

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
    updateSubmitButton();
}

function removeName(name) {
    participants = participants.filter(p => p !== name);
    renderNamesList();
    updateSubmitButton();
}

function renderNamesList() {
    if (participants.length === 0) {
        namesList.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No participants yet</p>';
        return;
    }
    
    namesList.innerHTML = '';
    participants.forEach(name => {
        const nameItem = document.createElement('div');
        nameItem.className = 'name-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-btn';
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => removeName(name));
        
        nameItem.appendChild(nameSpan);
        nameItem.appendChild(removeButton);
        namesList.appendChild(nameItem);
    });
}

function updateSubmitButton() {
    submitNamesBtn.disabled = participants.length < 2;
}

function submitNames() {
    if (participants.length < 2) {
        alert('You need at least 2 participants');
        return;
    }
    
    // Populate dropdown
    userSelect.innerHTML = '<option value="">-- Select Your Name --</option>';
    participants.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        userSelect.appendChild(option);
    });
    
    // Switch to user selection state
    showState('selectUser');
}

function handleUserSelection() {
    selectedUser = userSelect.value;
    distributeBtn.disabled = selectedUser === '';
}

function distributeNumbers() {
    if (selectedUser === '') {
        alert('Please select your name');
        return;
    }
    
    // Create array of numbers from 1 to N
    const numbers = Array.from({ length: participants.length }, (_, i) => i + 1);
    
    // Find the index of the selected user
    const userIndex = participants.indexOf(selectedUser);
    const userPositionNumber = userIndex + 1;
    
    // Use a proper algorithm to ensure valid assignment
    // Try multiple times if needed to get a valid assignment
    let maxAttempts = MAX_ASSIGNMENT_ATTEMPTS;
    let validAssignment = false;
    
    while (!validAssignment && maxAttempts > 0) {
        assignments = {};
        let availableNumbers = [...numbers];
        validAssignment = true;
        
        // Randomly shuffle the order of processing participants
        // This helps avoid the edge case where the selected user is last
        const processingOrder = [...Array(participants.length).keys()]
            .sort(() => Math.random() - 0.5);
        
        for (const index of processingOrder) {
            const participant = participants[index];
            let numberToAssign;
            
            if (index === userIndex) {
                // For the selected user, exclude their position number
                const validNumbers = availableNumbers.filter(n => n !== userPositionNumber);
                
                if (validNumbers.length === 0) {
                    // Invalid assignment - retry
                    validAssignment = false;
                    break;
                }
                
                numberToAssign = validNumbers[Math.floor(Math.random() * validNumbers.length)];
            } else {
                // For other participants, any available number is fine
                if (availableNumbers.length === 0) {
                    // Should never happen, but handle it
                    validAssignment = false;
                    break;
                }
                
                numberToAssign = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
            }
            
            assignments[participant] = numberToAssign;
            availableNumbers = availableNumbers.filter(n => n !== numberToAssign);
        }
        
        maxAttempts--;
    }
    
    if (!validAssignment) {
        alert('Unable to create a valid assignment. Please try again.');
        return;
    }
    
    // Display results
    document.getElementById('jsonPreview').textContent = JSON.stringify(assignments, null, 2);
    showState('result');
}

function downloadJSON() {
    const dataStr = JSON.stringify(assignments, null, 2);
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
        uploadResult.classList.remove('hidden');
        uploadResult.classList.add('error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate the JSON structure
            if (typeof data !== 'object' || Array.isArray(data)) {
                throw new Error('Invalid JSON format');
            }
            
            // Display the uploaded data
            uploadResult.innerHTML = '';
            
            const heading = document.createElement('h4');
            heading.textContent = 'Uploaded Assignments:';
            uploadResult.appendChild(heading);
            
            const list = document.createElement('ul');
            for (const [name, number] of Object.entries(data)) {
                const listItem = document.createElement('li');
                const strong = document.createElement('strong');
                strong.textContent = name;
                listItem.appendChild(strong);
                listItem.appendChild(document.createTextNode(': ' + number));
                list.appendChild(listItem);
            }
            uploadResult.appendChild(list);
            
            uploadResult.classList.remove('hidden', 'error');
        } catch (error) {
            uploadResult.textContent = 'Error parsing JSON file: ' + error.message;
            uploadResult.classList.remove('hidden');
            uploadResult.classList.add('error');
        }
    };
    
    reader.onerror = () => {
        uploadResult.textContent = 'Error reading file';
        uploadResult.classList.remove('hidden');
        uploadResult.classList.add('error');
    };
    
    reader.readAsText(file);
}

function resetApp() {
    participants = [];
    assignments = {};
    selectedUser = '';
    nameInput.value = '';
    uploadInput.value = '';
    uploadResult.classList.add('hidden');
    renderNamesList();
    updateSubmitButton();
    showState('initial');
}

function showState(state) {
    initialState.classList.add('hidden');
    selectUserState.classList.add('hidden');
    resultState.classList.add('hidden');
    
    switch (state) {
        case 'initial':
            initialState.classList.remove('hidden');
            break;
        case 'selectUser':
            selectUserState.classList.remove('hidden');
            break;
        case 'result':
            resultState.classList.remove('hidden');
            break;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
renderNamesList();
updateSubmitButton();
