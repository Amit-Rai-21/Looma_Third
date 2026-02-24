(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/api-client.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// API client for frontend to communicate with backend
__turbopack_context__.s([
    "accessLogsAPI",
    ()=>accessLogsAPI,
    "authAPI",
    ()=>authAPI,
    "scansAPI",
    ()=>scansAPI,
    "schoolsAPI",
    ()=>schoolsAPI,
    "usersAPI",
    ()=>usersAPI
]);
const API_BASE = "http://localhost:8000";
// Check if current session is a viewer (no real backend token)
function isViewerSession() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return sessionStorage.getItem("viewer_session") === "true";
}
async function fetchAPI(endpoint, options = {}) {
    const token = ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem("access_token") : "TURBOPACK unreachable";
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...token ? {
                Authorization: `Bearer ${token}`
            } : {},
            ...options.headers || {}
        }
    });
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch  {
    // non-JSON response
    }
    if (!res.ok) {
        const message = data?.detail || data?.error || data?.message || `Request failed (${res.status})`;
        throw new Error(message);
    }
    return data;
}
const authAPI = {
    login: async (username, password)=>{
        const res = await fetchAPI("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                username,
                password
            })
        });
        if (res.token) {
            localStorage.setItem("access_token", res.token);
        }
        return res;
    },
    logout: async ()=>{
        localStorage.removeItem("access_token");
        return fetchAPI("/auth/logout", {
            method: "POST"
        });
    },
    me: ()=>fetchAPI("/auth/me"),
    // OTP / Forgot Password
    forgotPassword: (email)=>fetchAPI("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({
                email
            })
        }),
    verifyOTP: (email, otp)=>fetchAPI("/auth/verify-otp", {
            method: "POST",
            body: JSON.stringify({
                email,
                otp
            })
        }),
    resetPassword: (email, otp, new_password)=>fetchAPI("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({
                email,
                otp,
                new_password
            })
        })
};
const schoolsAPI = {
    getAll: (params)=>{
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set("search", params.search);
        if (params?.status && params.status !== "all") searchParams.set("status", params.status);
        if (params?.province && params.province !== "all") searchParams.set("province", params.province);
        const query = searchParams.toString();
        const endpoint = `/schools${query ? `?${query}` : ""}`;
        // For viewers: /schools GET is public so use fetchAPI normally.
        // loginAsViewer clears localStorage token so no Authorization header is sent.
        // credentials:"include" is fine — viewer has no backend cookie so nothing stale is sent.
        return fetchAPI(endpoint);
    },
    getById: (id)=>fetchAPI(`/schools/${id}`),
    create: (data)=>fetchAPI("/schools", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    update: (id, data)=>fetchAPI(`/schools/${id}`, {
            method: "PUT",
            body: JSON.stringify(data)
        }),
    delete: (id)=>fetchAPI(`/schools/${id}`, {
            method: "DELETE"
        })
};
const scansAPI = {
    list: (params)=>{
        const searchParams = new URLSearchParams();
        if (params?.serial) searchParams.set("serial", params.serial);
        if (params?.school) searchParams.set("school", params.school);
        if (typeof params?.limit === "number") searchParams.set("limit", String(params.limit));
        if (typeof params?.skip === "number") searchParams.set("skip", String(params.skip));
        const query = searchParams.toString();
        return fetchAPI(`/scans${query ? `?${query}` : ""}`);
    },
    delete: (id)=>fetchAPI(`/scans/${id}`, {
            method: "DELETE"
        })
};
const accessLogsAPI = {
    getBySchool: (schoolId)=>fetchAPI(`/schools/${schoolId}/access-logs`),
    create: (schoolId, data)=>fetchAPI(`/schools/${schoolId}/access-logs`, {
            method: "POST",
            body: JSON.stringify(data)
        })
};
const usersAPI = {
    getAll: ()=>fetchAPI("/users"),
    add: (data)=>fetchAPI("/users/add", {
            method: "POST",
            body: JSON.stringify(data)
        }),
    update: (id, data)=>fetchAPI(`/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    updateMe: (data)=>fetchAPI("/users/me", {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    updatePassword: (data)=>fetchAPI("/users/me/password", {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
    delete: (id)=>fetchAPI(`/users/${id}`, {
            method: "DELETE"
        })
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api-client.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const checkSession = {
                "AuthProvider.useEffect.checkSession": async ()=>{
                    // If viewer session exists in sessionStorage, restore it
                    const viewerSession = sessionStorage.getItem("viewer_session");
                    if (viewerSession === "true") {
                        setUser({
                            id: "viewer",
                            username: "Viewer",
                            email: "",
                            role: "viewer"
                        });
                        setIsLoading(false);
                        return;
                    }
                    try {
                        const data = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authAPI"].me();
                        setUser(data.user);
                    } catch  {
                        setUser(null);
                    } finally{
                        setIsLoading(false);
                    }
                }
            }["AuthProvider.useEffect.checkSession"];
            checkSession();
        }
    }["AuthProvider.useEffect"], []);
    const login = async (username, password)=>{
        try {
            const data = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authAPI"].login(username, password);
            setUser(data.user);
            return true;
        } catch  {
            return false;
        }
    };
    const loginAsViewer = ()=>{
        // Clear any existing token so fetchAPI sends no Authorization header
        localStorage.removeItem("access_token");
        const viewerUser = {
            id: "viewer",
            username: "Viewer",
            email: "",
            role: "viewer"
        };
        sessionStorage.setItem("viewer_session", "true");
        setUser(viewerUser);
    };
    const logout = async ()=>{
        sessionStorage.removeItem("viewer_session");
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authAPI"].logout();
        } catch  {
        // Ignore errors on logout
        }
        setUser(null);
    };
    const refreshUser = async ()=>{
        try {
            const data = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authAPI"].me();
            setUser(data.user);
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            login,
            loginAsViewer,
            logout,
            refreshUser,
            isLoading
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/lib/auth-context.tsx",
        lineNumber: 81,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "YajQB7LURzRD+QP5gw0+K2TZIWA=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=lib_393d2808._.js.map