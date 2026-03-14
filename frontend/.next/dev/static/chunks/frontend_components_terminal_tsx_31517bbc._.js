(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/components/terminal.tsx [app-client] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "static/chunks/node_modules_b4ee3f4e._.js",
  "static/chunks/frontend_components_terminal_tsx_58ef9ab1._.js",
  {
    "path": "static/chunks/node_modules_xterm_css_xterm_c06e86aa.css",
    "included": [
      "[project]/node_modules/xterm/css/xterm.css [app-client] (css)"
    ]
  },
  "static/chunks/frontend_components_terminal_tsx_7e24c77c._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/frontend/components/terminal.tsx [app-client] (ecmascript)");
    });
});
}),
]);