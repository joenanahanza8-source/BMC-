import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { INITIAL_PLAYERS, INITIAL_COURTS, INITIAL_MATCHES } from "./src/utils/dummyData";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const STATE_FILE_PATH = path.join(process.cwd(), "server_state.json");

const INITIAL_BOOKINGS = [];

// Keep track of connected WebSocket clients
const clients = new Set<WebSocket>();

// Create the WebSocket server (independent of HTTP, we upgrade manually)
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total clients: ${clients.size}`);

  // Send the initial state upon connection
  try {
    const state = loadState();
    ws.send(JSON.stringify({ type: "state_update", state }));
  } catch (error) {
    console.error("[WS] Error sending initial state:", error);
  }

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total clients: ${clients.size}`);
  });

  ws.on("error", (error) => {
    console.error("[WS] Socket error:", error);
    clients.delete(ws);
  });
});

// Broadcast the updated state to all connected clients
function broadcastState(state: any) {
  const message = JSON.stringify({ type: "state_update", state });
  let activeClients = 0;
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        activeClients++;
      } catch (err) {
        console.error("[WS] Error broadcasting to client:", err);
      }
    }
  }
  console.log(`[WS] Broadcasted state version ${state.version} to ${activeClients} active clients.`);
}

// Helper to load state
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const content = fs.readFileSync(STATE_FILE_PATH, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading state file, using initial:", error);
  }
  
  // Return initial structure if file not found or corrupted
  return {
    players: INITIAL_PLAYERS,
    courts: INITIAL_COURTS,
    matches: INITIAL_MATCHES,
    bookings: INITIAL_BOOKINGS,
    version: Date.now(),
  };
}

// Helper to save state
function saveState(state: any) {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing state file:", error);
  }
}

// API Routes
app.get("/api/state", (req, res) => {
  const state = loadState();
  res.json(state);
});

app.post("/api/state", (req, res) => {
  const { players, courts, matches, bookings } = req.body;
  const newState = {
    players: players || [],
    courts: courts || [],
    matches: matches || [],
    bookings: bookings || [],
    version: Date.now(),
  };
  saveState(newState);
  
  // Broadcast updated state to all connected clients in real-time
  broadcastState(newState);
  
  res.json({ success: true, version: newState.version });
});

// Vite Middleware & Static Serving Setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Handle upgrade to WebSockets manually
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/ws-sync") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });
});

