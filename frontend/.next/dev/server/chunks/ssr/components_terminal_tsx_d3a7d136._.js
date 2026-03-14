module.exports = [
"[project]/components/terminal.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TerminalComponent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
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
"use client";
;
;
;
;
;
function TerminalComponent({ socketUrl, className }) {
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const termRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const fitAddonRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const wsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const reconnectTimeoutRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
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
        const connectWebSocket = ()=>{
            const ws = new WebSocket(socketUrl);
            ws.binaryType = "arraybuffer";
            ws.onmessage = (event)=>{
                if (typeof event.data === "string") return;
                term.write(new Uint8Array(event.data));
            };
            ws.onopen = ()=>{
                term.writeln("\x1b[32mConnected\x1b[0m\r\n");
            };
            ws.onerror = ()=>{
                term.writeln("\x1b[31mConnection error\x1b[0m\r\n");
            };
            ws.onclose = ()=>{
                term.writeln("\x1b[33mDisconnected. Reconnecting...\x1b[0m\r\n");
                reconnectTimeoutRef.current = setTimeout(()=>{
                    connectWebSocket();
                }, 2000);
            };
            // Input → backend
            term.onData((data)=>{
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(data);
                }
            });
            wsRef.current = ws;
        };
        // Resize handling
        const resizeObserver = new ResizeObserver(()=>{
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
        });
        resizeObserver.observe(containerRef.current);
        // Initial connection
        connectWebSocket();
        return ()=>{
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            resizeObserver.disconnect();
            if (wsRef.current) {
                wsRef.current.close();
            }
            term.dispose();
        };
    }, [
        socketUrl
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
}),
];

//# sourceMappingURL=components_terminal_tsx_d3a7d136._.js.map