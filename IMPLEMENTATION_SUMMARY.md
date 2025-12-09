# Secret Santa Gift Assignment System - Implementation Summary

## Overview
The application has been transformed from a simple box picker to a complete Secret Santa gift assignment system with real-time synchronization.

## Key Features Implemented

### 1. Participant List System
- **File**: `participants.txt`
- Contains 60 participant names (one per line)
- Total number of boxes automatically equals number of participants
- Can be edited to add/remove participants

### 2. Gift Assignment Mechanism
- Each box is pre-assigned a random recipient from the participants list
- Assignments use Fisher-Yates shuffle algorithm for fair random distribution
- When a user picks a box, they immediately see who they should gift to
- **Privacy**: Only the user who picked the box can see their assignment
- Other users only see "Claimed" on selected boxes

### 3. JSON Structure
Each box in the state has two fields:
```json
{
  "boxes": {
    "1": {
      "picker": "Alice",      // Who selected this box (empty if unclaimed)
      "assigned": "Bob"        // Who the picker should gift to (pre-assigned)
    },
    "2": {
      "picker": "",            // Not yet picked
      "assigned": "Carol"       // Pre-assigned recipient
    }
  }
}
```

### 4. Role-Based Visibility

**Regular Users:**
- See "Available" on unclaimed boxes
- After picking a box: See "🎁 Gift to: [Name]"
- On other claimed boxes: See "Claimed" (privacy protected)

**Admin (EvacionSaraak):**
- See "Available" + assigned name on unclaimed boxes
- See "Picker: [Name]" + "Assigned: [Name]" on all boxes
- Can remove any user from any box
- Has access to Download/Upload/Reset JSON buttons

### 5. Real-time Synchronization
- All selections sync instantly via PubNub
- When someone picks a box, all users see it update immediately
- When someone unpicks a box, update broadcasts to all users
- Admin removals sync in real-time

### 6. State Management
- **Download JSON**: Admin can export current state
- **Upload JSON**: Admin can import/restore state
- **Reset All**: Clears all pickers but keeps assignments
- **Auto-sync**: Changes propagate via PubNub messages

### 7. JSON Repository Updates
**Note**: GitHub Pages limitation - cannot auto-commit from client-side

**Current Behavior:**
- State syncs in real-time via PubNub (all users see changes immediately)
- Admin can download JSON anytime
- Admin should manually commit downloaded JSON to repository for persistence

**Recommended Workflow:**
1. Users pick boxes (syncs via PubNub)
2. Admin downloads JSON periodically
3. Admin commits JSON file to repository manually
4. On page reload, upload JSON to restore state

## Files Modified

### New Files:
1. `participants.txt` - List of 60 participant names
2. `secret-santa-state.json` - Initial state with random assignments
3. `script-pubnub-backup.js` - Backup of original script
4. `script-pubnub-old.js` - Previous version backup

### Modified Files:
1. `script-pubnub.js` - Complete rewrite for gift assignment system
2. `index.html` - Updated instructions
3. `styles.css` - Added styles for new box content (picker, assigned, claimed)

## Technical Implementation

### Initialization Flow:
1. Load participants from `participants.txt`
2. Set `TOTAL_BOXES = participants.length`
3. Initialize boxes with random assignments (Fisher-Yates shuffle)
4. Connect to PubNub
5. Request current state from other clients
6. Display boxes with appropriate content based on role

### Box Click Flow:
1. User clicks available box
2. Publish `select-box` message with boxNumber and userName
3. Server (via PubNub broadcast):
   - Remove user's previous box selection (one box per user)
   - Set `boxes[boxNumber].picker = userName`
   - Broadcast to all clients
4. All clients update their display
5. Picker sees their assignment, others see "Claimed"

### Message Types:
- `select-box`: User picks a box
- `unselect-box`: User unpicks their box
- `admin-remove-box`: Admin removes someone
- `upload-boxes`: Admin uploads JSON
- `reset-all`: Admin resets all pickers
- `name-change`: User changes their name
- `state-request`: Client requests current state
- `state-response`: Client shares current state

## Privacy & Security

### Privacy Protection:
- ✅ Regular users cannot see others' assignments
- ✅ Regular users cannot see who picked which box (just "Claimed")
- ✅ Only admin has full visibility
- ✅ Users only see their own assignment

### Security Features:
- ✅ Role-based access control (admin vs regular user)
- ✅ Input validation for box numbers and usernames
- ✅ PubNub PAM for channel access control
- ✅ Admin controls hidden via CSS for non-admin users
- ✅ XSS protection in dynamic content rendering

## Deployment

### GitHub Pages (Current):
1. Enable GitHub Pages in repository settings
2. App loads `participants.txt` automatically
3. Assignments initialize randomly on first load
4. State syncs via PubNub (not persisted to repository automatically)

### State Persistence:
- **Via PubNub**: Real-time sync across all connected users
- **Via JSON Download**: Admin can manually save/restore state
- **Via Repository**: Admin manually commits downloaded JSON

## Usage Instructions

### For Participants:
1. Enter your name and connect
2. Click any available box
3. See who you're gifting to
4. Keep it secret!

### For Admin:
1. Login as `EvacionSaraak`
2. See all assignments and pickers
3. Manage boxes (remove users if needed)
4. Download JSON for backup
5. Upload JSON to restore state
6. Reset all to clear pickers (keeps assignments)

## Constraints

✅ Total boxes equals total participants (60)
✅ Each user can pick only one box
✅ Assignments are random and fair
✅ Privacy is protected for non-admin users
✅ Real-time updates across all users
✅ JSON structure has picker + assigned fields
✅ Admin has full visibility and control

## Future Enhancements (Optional)

To enable auto-commit to repository:
1. Set up GitHub Actions workflow
2. Use GitHub API with token
3. Auto-commit JSON on state changes
4. Requires server-side component or GitHub Action

Current implementation prioritizes:
- Simplicity (GitHub Pages, no build tools)
- Real-time sync (via PubNub)
- Privacy (role-based visibility)
- Ease of use (no npm required)
