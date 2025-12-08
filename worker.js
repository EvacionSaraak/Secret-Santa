export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      return handleWebSocket(request, env);
    }

    // Serve static files
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(INDEX_HTML, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    if (url.pathname === "/script.js") {
      return new Response(SCRIPT_JS, {
        headers: { "Content-Type": "application/javascript;charset=UTF-8" },
      });
    }

    if (url.pathname === "/styles.css") {
      return new Response(STYLES_CSS, {
        headers: { "Content-Type": "text/css;charset=UTF-8" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleWebSocket(request, env) {
  // Get Durable Object ID for the room
  const id = env.SECRET_SANTA_ROOM.idFromName("main-room");
  const stub = env.SECRET_SANTA_ROOM.get(id);
  
  // Forward the WebSocket connection to the Durable Object
  return stub.fetch(request);
}

// Durable Object for managing WebSocket connections and state
export class SecretSantaRoom {
  constructor(state, env) {
    this.state = state;
    this.sessions = new Set();
    this.selections = {};
    this.connectedUsers = new Set();
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    await this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(websocket) {
    websocket.accept();
    
    const session = { websocket, userName: null };
    this.sessions.add(session);

    // Load selections from storage
    const stored = await this.state.storage.get("selections");
    if (stored) {
      this.selections = stored;
    }

    // Send initial state to the new client
    websocket.send(JSON.stringify({
      type: "initial-state",
      selections: this.selections
    }));

    websocket.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        await this.handleMessage(session, data);
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    websocket.addEventListener("close", () => {
      this.sessions.delete(session);
      if (session.userName) {
        this.connectedUsers.delete(session.userName);
        this.broadcast({
          type: "users-count",
          count: this.connectedUsers.size
        });
      }
    });
  }

  async handleMessage(session, data) {
    const TOTAL_BOXES = 60;

    switch (data.type) {
      case "user-identified":
        session.userName = data.userName;
        this.connectedUsers.add(data.userName);
        this.broadcast({
          type: "users-count",
          count: this.connectedUsers.size
        });
        break;

      case "select-box":
        const { boxNumber, userName } = data;
        
        // Validate input
        if (typeof boxNumber !== 'number' || boxNumber < 1 || boxNumber > TOTAL_BOXES) {
          session.websocket.send(JSON.stringify({
            type: "selection-error",
            message: "Invalid box number",
            boxNumber
          }));
          return;
        }
        
        if (typeof userName !== 'string' || userName.trim().length === 0) {
          session.websocket.send(JSON.stringify({
            type: "selection-error",
            message: "Invalid user name",
            boxNumber
          }));
          return;
        }

        // Find and remove any previous selection by this user
        for (let box in this.selections) {
          if (this.selections[box] === userName) {
            delete this.selections[box];
          }
        }

        // Check if box is available
        const currentOwner = this.selections[boxNumber];
        if (!currentOwner || currentOwner === userName) {
          this.selections[boxNumber] = userName;
          await this.state.storage.put("selections", this.selections);
          this.broadcast({
            type: "selections-updated",
            selections: this.selections
          });
        } else {
          session.websocket.send(JSON.stringify({
            type: "selection-error",
            message: `Box ${boxNumber} is already selected by ${currentOwner}`,
            boxNumber
          }));
        }
        break;

      case "unselect-box":
        if (typeof data.boxNumber !== 'number' || data.boxNumber < 1 || data.boxNumber > TOTAL_BOXES) {
          return;
        }

        if (this.selections[data.boxNumber] === data.userName) {
          delete this.selections[data.boxNumber];
          await this.state.storage.put("selections", this.selections);
          this.broadcast({
            type: "selections-updated",
            selections: this.selections
          });
        }
        break;

      case "reset-all":
        this.selections = {};
        await this.state.storage.put("selections", this.selections);
        this.broadcast({
          type: "selections-updated",
          selections: this.selections
        });
        break;

      case "upload-selections":
        if (data.selections && typeof data.selections === 'object') {
          const validatedSelections = {};
          for (const [boxNum, userName] of Object.entries(data.selections)) {
            const boxNumber = parseInt(boxNum, 10);
            if (boxNumber >= 1 && boxNumber <= TOTAL_BOXES && 
                typeof userName === 'string' && userName.trim().length > 0) {
              validatedSelections[boxNumber] = userName.trim();
            }
          }
          this.selections = validatedSelections;
          await this.state.storage.put("selections", this.selections);
          this.broadcast({
            type: "selections-updated",
            selections: this.selections
          });
        }
        break;
    }
  }

  broadcast(message) {
    const msg = JSON.stringify(message);
    for (const session of this.sessions) {
      try {
        session.websocket.send(msg);
      } catch (err) {
        console.error("Error broadcasting to session:", err);
      }
    }
  }
}

// Import static files as strings (these will be bundled)
const INDEX_HTML = \`<!-- Content loaded from index.html -->\`;
const SCRIPT_JS = \`// Content loaded from script.js\`;
const STYLES_CSS = \`/* Content loaded from styles.css */\`;
