"use client";
import React, {
  createContext, useContext, useEffect, useRef,
  useState, useCallback, ReactNode
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type RTEventType =
  | 'new_transaction'
  | 'transaction_updated'
  | 'transaction_deleted'
  | 'summary_updated'
  | 'budget_alert'
  | 'budgets_updated'
  | 'connected'
  | 'disconnected';

export interface RTEvent {
  type: RTEventType;
  payload?: any;
}

export interface BudgetAlert {
  category: string;
  percent: number;
  target: number;
  current: number;
}

type Listener = (event: RTEvent) => void;

interface RealtimeContextValue {
  isConnected: boolean;
  subscribe: (fn: Listener) => () => void;
  lastEvent: RTEvent | null;
}

// ── Context ───────────────────────────────────────────────────────────────────
const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  subscribe: () => () => {},
  lastEvent: null,
});

// ── Provider ──────────────────────────────────────────────────────────────────
export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RTEvent | null>(null);
  const listenersRef = useRef<Set<Listener>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);

  const broadcast = useCallback((event: RTEvent) => {
    setLastEvent(event);
    listenersRef.current.forEach(fn => fn(event));

    // Multi-tab sync via BroadcastChannel
    try {
      const bc = new BroadcastChannel('fintrack_rt');
      bc.postMessage(event);
      bc.close();
    } catch {}
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    // Derive WS URL from current location
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname;
    const wsUrl = `${wsProtocol}://${wsHost}:8080/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectDelay.current = 1000;
      broadcast({ type: 'connected' });
      console.log('[RT] WebSocket connected');
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as RTEvent;
        broadcast(event);
      } catch {}
    };

    ws.onclose = () => {
      setIsConnected(false);
      broadcast({ type: 'disconnected' });
      console.log('[RT] WebSocket disconnected, retrying in', reconnectDelay.current, 'ms');
      reconnectTimerRef.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 16000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => ws.close();
  }, [broadcast]);

  useEffect(() => {
    connect();

    // Multi-tab sync: listen for events from other tabs
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('fintrack_rt');
      bc.onmessage = (e) => {
        setLastEvent(e.data);
        listenersRef.current.forEach(fn => fn(e.data));
      };
    } catch {}

    // Keep-alive ping every 25s
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      bc?.close();
    };
  }, [connect]);

  const subscribe = useCallback((fn: Listener) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  return (
    <RealtimeContext.Provider value={{ isConnected, subscribe, lastEvent }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
