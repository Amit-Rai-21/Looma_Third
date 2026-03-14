"use client"
import { useEffect, useRef } from "react";
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

type TerminalProps = {
  /** ws:// or wss:// endpoint */
  socketUrl: string;
  /** Optional className for layout */
  className?: string;
};

export default function TerminalComponent({ socketUrl, className }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("Terminal mounting, socketUrl:", socketUrl);
    if (!containerRef.current) return;

    // --- Terminal ---
    const term = new XTerminal({
      cursorBlink: true,
      fontFamily: "monospace",
      fontSize: 14,
      theme: {
        background: "#0b0b0b",
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    term.focus();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // --- WebSocket Connection Function ---
    const connectWebSocket = () => {
      const ws = new WebSocket(socketUrl);
      ws.binaryType = "arraybuffer";

      ws.onmessage = (event) => {
        if (typeof event.data === "string") return;
        term.write(new Uint8Array(event.data));
      };

      ws.onopen = () => {
        term.writeln("\x1b[32mConnected\x1b[0m\r\n");
      };

      ws.onerror = () => {
        term.writeln("\x1b[31mConnection error\x1b[0m\r\n");
      };

      ws.onclose = () => {
        term.writeln("\x1b[33mDisconnected. Reconnecting...\x1b[0m\r\n");
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };

      // Input → backend
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      wsRef.current = ws;
    };

    // Resize handling
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      const cols = term.cols;
      const rows = term.rows;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "resize",
            cols,
            rows,
          })
        );
      }
    });
    resizeObserver.observe(containerRef.current);

    // Initial connection
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      resizeObserver.disconnect();
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [socketUrl]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
