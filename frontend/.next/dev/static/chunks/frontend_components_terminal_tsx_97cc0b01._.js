(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/components/terminal.tsx [app-client] (ecmascript, next/dynamic entry, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "static/chunks/node_modules_b4ee3f4e._.js",
  "static/chunks/frontend_components_terminal_tsx_120e225d._.js",
  {
    "path": "static/chunks/node_modules_xterm_css_xterm_c06e86aa.css",
    "included": [
      "[project]/node_modules/xterm/css/xterm.css [app-client] (css)"
    ]
  },
  "static/chunks/frontend_components_terminal_tsx_3de3ab29._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/frontend/components/terminal.tsx [app-client] (ecmascript, next/dynamic entry)");
    });
});
}),
]);