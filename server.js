const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Server-side state
const TOTAL_BOXES = 60;
let selections = {}; // { boxNumber: userName }

// Track connected users
let connectedUsers = new Set();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send current state to newly connected client
  socket.emit('initial-state', { selections });
  
  // Handle user identification
  socket.on('user-identified', (userName) => {
    socket.userName = userName;
    connectedUsers.add(userName);
    console.log('User identified:', userName);
    
    // Broadcast connected users count
    io.emit('users-count', connectedUsers.size);
  });
  
  // Handle box selection
  socket.on('select-box', ({ boxNumber, userName }) => {
    // Find and remove any previous selection by this user (enforce one box per user)
    for (let box in selections) {
      if (selections[box] === userName) {
        delete selections[box];
      }
    }
    
    // Check if box is available
    const currentOwner = selections[boxNumber];
    if (!currentOwner || currentOwner === userName) {
      selections[boxNumber] = userName;
      
      // Broadcast update to all clients
      io.emit('selections-updated', { selections });
      console.log(`Box ${boxNumber} selected by ${userName}`);
    } else {
      // Box is taken by someone else
      socket.emit('selection-error', { 
        message: `Box ${boxNumber} is already selected by ${currentOwner}`,
        boxNumber 
      });
    }
  });
  
  // Handle box unselection
  socket.on('unselect-box', ({ boxNumber, userName }) => {
    const currentOwner = selections[boxNumber];
    
    if (currentOwner === userName) {
      delete selections[boxNumber];
      
      // Broadcast update to all clients
      io.emit('selections-updated', { selections });
      console.log(`Box ${boxNumber} unselected by ${userName}`);
    }
  });
  
  // Handle reset request
  socket.on('reset-all', () => {
    selections = {};
    io.emit('selections-updated', { selections });
    console.log('All selections reset');
  });
  
  // Handle upload (import selections)
  socket.on('upload-selections', (newSelections) => {
    if (newSelections && typeof newSelections === 'object') {
      selections = newSelections;
      io.emit('selections-updated', { selections });
      console.log('Selections imported from upload');
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userName) {
      connectedUsers.delete(socket.userName);
      io.emit('users-count', connectedUsers.size);
      console.log('User disconnected:', socket.userName);
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Real-time Secret Santa Box Picker ready!');
});
