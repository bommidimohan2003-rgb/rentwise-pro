// ----------------------------------------------------------------------
// Admin Live WebSocket Client Service
// ----------------------------------------------------------------------

export type ConnectionStatus = "LIVE" | "CONNECTING" | "DISCONNECTED";

export interface WSEvent<T = unknown> {
  type: string;
  data: T;
  timestamp?: string;
}

type Listener = (event: WSEvent) => void;

class AdminWebSocketService {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = "DISCONNECTED";
  private listeners: Map<string, Set<Listener>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private isExplicitDisconnect = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => this.connect());
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((listener) => listener(newStatus));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("payent-admin-ws-status", { detail: newStatus }));
      }
    }
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public connect() {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("payent:admin:token");
    if (!token) {
      this.setStatus("DISCONNECTED");
      return;
    }

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.isExplicitDisconnect = false;
    this.setStatus("CONNECTING");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "127.0.0.1:8000"
        : window.location.host;

    const wsUrl = `${protocol}//${host}/api/admin/ws?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus("LIVE");
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed: WSEvent = JSON.parse(event.data);
          this.emit(parsed);
        } catch {
          // Ignore non-JSON frames
        }
      };

      this.ws.onerror = () => {
        // Error handler
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.setStatus("DISCONNECTED");

        if (event.code === 4003) {
          console.warn("WebSocket rejected with Forbidden (4003). Check admin token.");
          return;
        }

        if (!this.isExplicitDisconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.warn("Could not establish WebSocket connection:", err);
      this.setStatus("DISCONNECTED");
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isExplicitDisconnect = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("DISCONNECTED");
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isExplicitDisconnect) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("Max WebSocket reconnect attempts reached.");
      return;
    }

    const backoff = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, backoff);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public subscribe(eventType: string, callback: Listener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    if (this.status === "DISCONNECTED") {
      this.connect();
    }

    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  private emit(event: WSEvent) {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event));
    }

    const wildcard = this.listeners.get("*");
    if (wildcard) {
      wildcard.forEach((cb) => cb(event));
    }
  }
}

export const adminWS = new AdminWebSocketService();
