# Participant Management Feature - Visual Overview

## 🎯 What Changed

This PR adds the ability for administrators to dynamically manage participants during a Secret Santa event.

---

## 📸 Admin View - Participants Modal (NEW Features)

### Before (Original View)
```
┌──────────────────────────────────────────────────────┐
│              📋 Participants List                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  # │ Name          │ Box │ Gifting To │ Status     │
│ ───┼───────────────┼─────┼────────────┼──────────  │
│  1 │ Alice Johnson │  5  │ Bob Smith  │ ✓ Picked  │
│  2 │ Bob Smith     │ 12  │ Carol      │ ✓ Picked  │
│  3 │ Carol Davis   │  -  │ -          │ ⚠ Pending │
│                                                      │
│          [Download Non-Pickers]  [Close]             │
└──────────────────────────────────────────────────────┘
```

### After (With Participant Management)
```
┌──────────────────────────────────────────────────────────────────┐
│                   📋 Participants List (Admin View)              │
├──────────────────────────────────────────────────────────────────┤
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃ 👤 Manage Participants                                   ┃   │
│  ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫   │
│  ┃ │Enter new participant name...│ [➕ Add Participant]    ┃   │
│  ┃ ℹ️  Adding/removing will reinitialize all box assignments┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                                                  │
│  # │ Name          │ Box │ Gifting To │ Status   │ 🆕 Actions │
│ ───┼───────────────┼─────┼────────────┼──────────┼──────────── │
│  1 │ Alice Johnson │  5  │ Bob Smith  │ ✓ Picked │ [🗑 Remove]│
│  2 │ Bob Smith     │ 12  │ Carol      │ ✓ Picked │ [🗑 Remove]│
│  3 │ Carol Davis   │  -  │ -          │ ⚠ Pending│ [🗑 Remove]│ ⚠️ Yellow
│                                                                  │
│           [Download Non-Pickers]  [Close]                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Features Added

### 1. ➕ Add Participant Function

**Location:** Top of Participants Modal (Admin only)

**Visual Design:**
- Light gray background panel
- Input field with placeholder text
- Green button with plus icon
- Warning message in smaller gray text

**Functionality:**
- Type new participant name
- Click "Add Participant" or press Enter
- Confirmation dialog with warning
- Participant added to list
- All boxes reinitialized with new assignments
- Firebase automatically updated

**Example Flow:**
```
Step 1: Enter name                    Step 2: Confirm
┌────────────────────────────┐       ┌─────────────────────────┐
│ [Jane Smith____________]   │   →   │  Add "Jane Smith"?      │
│ [➕ Add Participant]        │       │                         │
└────────────────────────────┘       │  This will reinitialize │
                                     │  all box assignments    │
                                     │                         │
                                     │  [Cancel]     [OK]      │
                                     └─────────────────────────┘
```

### 2. 🗑️ Remove Participant Function

**Location:** New "Actions" column in table (Admin only)

**Visual Design:**
- Red button with trash icon
- One button per participant row
- Aligned right in Actions column

**Functionality:**
- Click "Remove" button
- Confirmation dialog appears
- Shows if participant already picked
- On confirm: participant removed
- All boxes reinitialized
- Firebase automatically updated

**Example Flow:**
```
Step 1: Click Remove                Step 2: Confirm
┌──────────────────────────┐       ┌─────────────────────────┐
│ Carol Davis  │ [🗑 Remove]│   →   │ Remove "Carol Davis"?   │
└──────────────────────────┘       │                         │
                                   │ They picked box 3.      │
                                   │ This will reinitialize  │
                                   │ all assignments         │
                                   │                         │
                                   │ [Cancel]     [OK]       │
                                   └─────────────────────────┘
```

---

## 🎨 Visual Indicators

### Status Badges
- ✅ **Picked** (Green): `[✓ Picked]`
- ⚠️ **Not Picked** (Yellow): `[⚠ Not Picked]`

### Row Highlighting
- **White background**: Participant has picked a box
- **Yellow background**: Participant hasn't picked yet (helps admin identify)

### Box Numbers
- **Blue badge**: Box number when picked (e.g., `[5]`, `[12]`)
- **Gray badge**: Dash when not picked (e.g., `[-]`)

---

## 👥 View Comparison: Admin vs Regular User

### Admin View
```
✓ Sees "Manage Participants" section
✓ Can add new participants
✓ Can remove participants
✓ Sees all columns: #, Name, Box, Gifting To, Status, Actions
✓ Sees who picked what
```

### Regular User View
```
✗ No "Manage Participants" section
✗ Cannot add participants
✗ Cannot remove participants
✓ Only sees: #, Name
✓ Simple list of participant names
ℹ️ Info message: "Admin can see assignments"
```

---

## ⚠️ Important Behaviors

### Reinitialization Warning
Both add and remove operations trigger:
1. **Confirmation dialog** with clear warning
2. **All box assignments** are regenerated randomly
3. **All selections** are cleared (participants must pick again)
4. **Firebase sync** happens automatically
5. **All clients** see updates in real-time

### Why Reinitialization?
- Maintains fairness (equal number of boxes and participants)
- Prevents assignment conflicts
- Ensures proper Secret Santa pairing
- Consistent with existing behavior when participants.txt changes

---

## 🔒 Security Features

✅ **XSS Protection**: All user input HTML-escaped  
✅ **Event Delegation**: No memory leaks from duplicate listeners  
✅ **Input Validation**: Duplicate checking, name formatting  
✅ **Admin Only**: Regular users cannot see or use these features  
✅ **Confirmation Dialogs**: Prevent accidental changes  

---

## 📝 Technical Details

**Files Changed:**
- `script.js`: Added `addParticipant()` and `removeParticipant()` functions
- `firebase-integration.js`: Added 'add-participant' and 'remove-participant' action types

**Action Types:**
- `'add-participant'`: Skips merge protection, forces save
- `'remove-participant'`: Skips merge protection, forces save

**Event Handling:**
- Single event listener on parent container
- Event delegation for all dynamic buttons
- No duplicate listeners on modal reopens

---

## 🚀 Usage Examples

### Adding Someone Mid-Event
```
Scenario: John joins the Secret Santa last minute

1. Admin clicks "Show Participants"
2. Types "John Doe" in input field
3. Clicks "Add Participant"
4. Confirms reinitialization warning
5. ✅ John is now in the list
6. Everyone gets new assignments
7. Notify everyone to re-pick boxes
```

### Removing Someone Who Left
```
Scenario: Sarah can't participate anymore

1. Admin clicks "Show Participants"
2. Finds Sarah in the list
3. Clicks "Remove" button next to her name
4. Confirms removal and reinitialization
5. ✅ Sarah removed from list
6. Everyone gets new assignments
7. Notify everyone to re-pick boxes
```

---

## 📊 Commits in This PR

1. `898e948` - Fix box claim deletion (merge protection)
2. `bebd52f` - Add diagnostic logging
3. `d99d0b8` - **Add participant management UI & functions** ⭐
4. `0ae7e51` - Fix XSS vulnerability
5. `7d5cf2f` - Add HTML escaping
6. `a96b786` - Consolidate event delegation

---

## ✨ Summary

This PR transforms the Participants Modal from a **read-only admin view** into a **full participant management interface**, allowing admins to handle real-world scenarios where people join or leave Secret Santa events.
