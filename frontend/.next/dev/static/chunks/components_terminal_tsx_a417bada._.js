(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/terminal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TerminalComponent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module 'xterm'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module 'xterm-addon-fit'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module 'xterm/css/xterm.css'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function TerminalComponent({ socketUrl, className }) {
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const termRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fitAddonRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const wsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const reconnectTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TerminalComponent.useEffect": ()=>{
            console.log("Terminal mounting, socketUrl:", socketUrl);
            if (!containerRef.current) return;
            // --- Terminal ---
            const term = new XTerminal({
                cursorBlink: true,
                fontFamily: "monospace",
                fontSize: 14,
                theme: {
                    background: "#0b0b0b"
                }
            });
            const fitAddon = new FitAddon();
            term.loadAddon(fitAddon);
            term.open(containerRef.current);
            fitAddon.fit();
            term.focus();
            termRef.current = term;
            fitAddonRef.current = fitAddon;
            // --- WebSocket Connection Function ---
            const connectWebSocket = {
                "TerminalComponent.useEffect.connectWebSocket": ()=>{
                    const ws = new WebSocket(socketUrl);
                    ws.binaryType = "arraybuffer";
                    ws.onmessage = ({
                        "TerminalComponent.useEffect.connectWebSocket": (event)=>{
                            if (typeof event.data === "string") return;
                            term.write(new Uint8Array(event.data));
                        }
                    })["TerminalComponent.useEffect.connectWebSocket"];
                    ws.onopen = ({
                        "TerminalComponent.useEffect.connectWebSocket": ()=>{
                            term.writeln("\x1b[32mConnected\x1b[0m\r\n");
                        }
                    })["TerminalComponent.useEffect.connectWebSocket"];
                    ws.onerror = ({
                        "TerminalComponent.useEffect.connectWebSocket": ()=>{
                            term.writeln("\x1b[31mConnection error\x1b[0m\r\n");
                        }
                    })["TerminalComponent.useEffect.connectWebSocket"];
                    ws.onclose = ({
                        "TerminalComponent.useEffect.connectWebSocket": ()=>{
                            term.writeln("\x1b[33mDisconnected. Reconnecting...\x1b[0m\r\n");
                            reconnectTimeoutRef.current = setTimeout({
                                "TerminalComponent.useEffect.connectWebSocket": ()=>{
                                    connectWebSocket();
                                }
                            }["TerminalComponent.useEffect.connectWebSocket"], 2000);
                        }
                    })["TerminalComponent.useEffect.connectWebSocket"];
                    // Input → backend
                    term.onData({
                        "TerminalComponent.useEffect.connectWebSocket": (data)=>{
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(data);
                            }
                        }
                    }["TerminalComponent.useEffect.connectWebSocket"]);
                    wsRef.current = ws;
                }
            }["TerminalComponent.useEffect.connectWebSocket"];
            // Resize handling
            const resizeObserver = new ResizeObserver({
                "TerminalComponent.useEffect": ()=>{
                    fitAddon.fit();
                    const cols = term.cols;
                    const rows = term.rows;
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({
                            type: "resize",
                            cols,
                            rows
                        }));
                    }
                }
            }["TerminalComponent.useEffect"]);
            resizeObserver.observe(containerRef.current);
            // Initial connection
            connectWebSocket();
            return ({
                "TerminalComponent.useEffect": ()=>{
                    if (reconnectTimeoutRef.current) {
                        clearTimeout(reconnectTimeoutRef.current);
                    }
                    resizeObserver.disconnect();
                    if (wsRef.current) {
                        wsRef.current.close();
                    }
                    term.dispose();
                }
            })["TerminalComponent.useEffect"];
        }
    }["TerminalComponent.useEffect"], [
        socketUrl
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: className,
        style: {
            width: "100%",
            height: "100%"
        }
    }, void 0, false, {
        fileName: "[project]/components/terminal.tsx",
        lineNumber: 111,
        columnNumber: 5
    }, this);
}
_s(TerminalComponent, "U+HzGjug0iyTjFTz9nGIm4BJRgI=");
_c = TerminalComponent;
var _c;
__turbopack_context__.k.register(_c, "TerminalComponent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=components_terminal_tsx_a417bada._.js.map