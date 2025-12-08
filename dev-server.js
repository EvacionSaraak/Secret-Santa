const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

// Create HTTP server
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 Not Found', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Server state
const TOTAL_BOXES = 60;
let selections = {};
let connectedUsers = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected');
  let userName = null;

  // Send initial state
  ws.send(JSON.stringify({
    type: 'initial-state',
    selections: selections
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'user-identified':
          userName = message.userName;
          connectedUsers.add(userName);
          console.log('User identified:', userName);
          broadcast({ type: 'users-count', count: connectedUsers.size });
          break;

        case 'select-box':
          const { boxNumber, userName: user } = message;
          
          // Validate input
          if (typeof boxNumber !== 'number' || boxNumber < 1 || boxNumber > TOTAL_BOXES) {
            ws.send(JSON.stringify({
              type: 'selection-error',
              message: 'Invalid box number',
              boxNumber
            }));
            return;
          }

          // Remove previous selection by this user
          for (let box in selections) {
            if (selections[box] === user) {
              delete selections[box];
            }
          }

          // Check if box is available
          const currentOwner = selections[boxNumber];
          if (!currentOwner || currentOwner === user) {
            selections[boxNumber] = user;
            broadcast({ type: 'selections-updated', selections });
            console.log(`Box ${boxNumber} selected by ${user}`);
          } else {
            ws.send(JSON.stringify({
              type: 'selection-error',
              message: `Box ${boxNumber} is already selected by ${currentOwner}`,
              boxNumber
            }));
          }
          break;

        case 'unselect-box':
          if (typeof message.boxNumber !== 'number' || message.boxNumber < 1 || message.boxNumber > TOTAL_BOXES) {
            return;
          }

          if (selections[message.boxNumber] === message.userName) {
            delete selections[message.boxNumber];
            broadcast({ type: 'selections-updated', selections });
            console.log(`Box ${message.boxNumber} unselected by ${message.userName}`);
          }
          break;

        case 'reset-all':
          selections = {};
          broadcast({ type: 'selections-updated', selections });
          console.log('All selections reset');
          break;

        case 'upload-selections':
          if (message.selections && typeof message.selections === 'object') {
            const validatedSelections = {};
            for (const [boxNum, userName] of Object.entries(message.selections)) {
              const boxNumber = parseInt(boxNum, 10);
              if (boxNumber >= 1 && boxNumber <= TOTAL_BOXES && 
                  typeof userName === 'string' && userName.trim().length > 0) {
                validatedSelections[boxNumber] = userName.trim();
              }
            }
            selections = validatedSelections;
            broadcast({ type: 'selections-updated', selections });
            console.log('Selections imported from upload');
          }
          break;
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    if (userName) {
      connectedUsers.delete(userName);
      broadcast({ type: 'users-count', count: connectedUsers.size });
      console.log('User disconnected:', userName);
    }
    console.log('Client disconnected');
  });
});

function broadcast(message) {
  const msg = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎅 Secret Santa server running on http://localhost:${PORT}`);
  console.log('Ready for connections!');
});
