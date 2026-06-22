"use client";

import { useGameStore } from "@/lib/store/gameStore";

export function Header() {
  const { status, gameId, round, turn, initGame } = useGameStore();

  const handleReset = () => {
    initGame();
  };

  return (
    <header className="border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50 py-4 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="wax-seal" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#b89255] font-sans">
            Ashford Manor Mystery
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#94a3b8] font-mono">
              Match ID: <span className="text-[#f1f5f9] font-medium">{gameId || "not_started"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Turn Info & Status */}
      {status === "playing" && (
        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-lg text-xs font-mono">
          <div>
            Round: <span className="text-[#b89255] font-bold">{round}</span>
          </div>
          <span className="h-3 w-[1px] bg-white/10" />
          <div>
            Turn: <span className="text-[#b89255] font-bold">{turn}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center flex-wrap gap-4">
        {/* Action Button */}
        <button
          onClick={handleReset}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 active:scale-95 text-[#f1f5f9] transition-all"
        >
          {status === "initializing" ? "Start Game" : "New Match"}
        </button>
      </div>
    </header>
  );
}
