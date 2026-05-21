"use client";

import { useEffect, useRef, useState } from "react";

// Mermaid is a singleton — initialise exactly once per page load.
// Re-calling initialize() on every render corrupts its internal state.
let mermaidReady = false;

interface Props {
  code:  string;
  title: string;
}

export default function MermaidDiagram({ code, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        // Dynamic import so Mermaid's browser-only code never runs on the server
        const mermaid = (await import("mermaid")).default;

        if (!mermaidReady) {
          mermaid.initialize({
            startOnLoad: false,
            theme:       "dark",
            themeVariables: {
              background:          "#0d1117",
              primaryColor:        "#3b82f6",
              primaryTextColor:    "#e2e8f0",
              primaryBorderColor:  "#1e40af",
              lineColor:           "#6b7280",
              secondaryColor:      "#1e293b",
              tertiaryColor:       "#1e293b",
              edgeLabelBackground: "#1e293b",
              fontFamily:          "Inter, sans-serif",
            },
            flowchart:     { curve: "basis", useMaxWidth: true },
            securityLevel: "loose",
          });
          mermaidReady = true;
        }

        const id  = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setLoaded(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[MermaidDiagram] render error:", err);
          setError("Could not render diagram.");
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
        ⚠️ Diagram unavailable
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117]/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="text-base">📊</span>
        <span className="text-xs font-semibold text-white/70">{title}</span>
        {!loaded && (
          <span className="ml-auto text-xs text-white/30 animate-pulse">Rendering…</span>
        )}
      </div>

      {/* Diagram */}
      <div
        ref={containerRef}
        className="flex justify-center overflow-x-auto p-4 [&_svg]:max-w-full [&_svg]:h-auto [&_text]:!fill-slate-300 [&_.label]:!fill-slate-300"
      />
    </div>
  );
}
