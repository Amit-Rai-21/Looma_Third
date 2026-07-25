"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Terminal, X } from "lucide-react";

const TerminalComponent = dynamic(() => import("@/components/terminal"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
      <span className="text-green-400 font-mono text-sm animate-pulse">
        Initializing terminal...
      </span>
    </div>
  ),
});

export default function TerminalPage() {
  const { loomaId } = useParams<{ loomaId: string }>();
  const [mounted, setMounted] = useState(false);

  // Ensure we only render the terminal client-side after mount
  // so window is available for the socketUrl
  useEffect(() => {
    setMounted(true);
  }, []);

  const socketUrl = `${typeof window !== "undefined" ? (window.location.protocol === "https:" ? "wss" : "ws") : "ws"}://${typeof window !== "undefined" ? window.location.host : "localhost"}/api/ws/terminal/${loomaId}`;

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-2 text-zinc-300">
          <Terminal className="h-4 w-4 text-green-400" />
          <span className="font-mono text-sm">
            looma@{loomaId?.toLowerCase()}.looma.local
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono">
            SSH Remote Shell — {loomaId}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.close()}
            className="text-zinc-400 hover:text-white h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Terminal — only render after mount so socketUrl is correct */}
      <div className="flex-1 overflow-hidden" style={{ height: "calc(100vh - 45px)" }}>
        {mounted && socketUrl ? (
          <TerminalComponent socketUrl={socketUrl} className="h-full w-full" />
        ) : (
          <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
            <span className="text-green-400 font-mono text-sm animate-pulse">
              Connecting...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
