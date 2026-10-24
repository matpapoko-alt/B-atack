/*
 * Adaptateur WebSocket côté navigateur.
 * À intégrer au jeu existant après vérification de son architecture.
 * Exemple :
 * const net = new BackAttackNetwork({
 *   onMessage: (type, payload) => { ... },
 *   onStatus: status => { ... }
 * });
 * net.connect();
 */
export class BackAttackNetwork {
  constructor({ serverUrl = null, onMessage = () => {}, onStatus = () => {} } = {}) {
    this.serverUrl = serverUrl || this.getDefaultUrl();
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.ws = null;
    this.identity = null;
    this.lastRoomRequest = null;
  }

  getDefaultUrl() {
    const configured = globalThis.BACK_ATTACK_SERVER_URL;
    if (configured) return configured;
    if (location.protocol === "https:") return "wss://YOUR-SERVER-HOST";
    return "ws://localhost:8080";
  }

  connect() {
    if (!this.serverUrl || this.serverUrl.includes("YOUR-SERVER-HOST")) {
      this.onStatus({ state: "configuration-required", message: "Configurez BACK_ATTACK_SERVER_URL avec l'URL du serveur." });
      return;
    }
    this.ws = new WebSocket(this.serverUrl);
    this.ws.addEventListener("open", () => {
      this.onStatus({ state: "connected" });
      if (this.identity) this.send("room:reconnect", this.identity);
      else if (this.lastRoomRequest) this.send(this.lastRoomRequest.type, this.lastRoomRequest.payload);
    });
    this.ws.addEventListener("message", event => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (["room:created", "room:joined", "room:reconnected"].includes(message.type)) {
        this.identity = {
          code: message.code,
          playerId: message.playerId,
          reconnectToken: message.reconnectToken || this.identity?.reconnectToken
        };
      }
      this.onMessage(message.type, message);
    });
    this.ws.addEventListener("close", () => this.onStatus({ state: "disconnected" }));
    this.ws.addEventListener("error", () => this.onStatus({ state: "error" }));
  }

  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify({ type, ...payload }));
    return true;
  }

  createRoom(name, mapId = "map-1") {
    this.lastRoomRequest = { type: "room:create", payload: { name, mapId } };
    return this.send("room:create", this.lastRoomRequest.payload);
  }

  joinRoom(code, name) {
    this.lastRoomRequest = { type: "room:join", payload: { code, name } };
    return this.send("room:join", this.lastRoomRequest.payload);
  }

  setReady(ready, start = false) {
    return this.send("player:ready", { ready, start });
  }

  startGame() { return this.send("game:start"); }

  sendInput({ direction = null, boost = false, fire = false } = {}) {
    return this.send("game:input", { direction, boost, fire });
  }

  leave() {
    this.send("room:leave");
    this.identity = null;
    this.lastRoomRequest = null;
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}
