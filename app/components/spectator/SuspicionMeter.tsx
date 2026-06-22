"use client";

import { motion } from "framer-motion";
import type { DetectiveState, DeductionNotebook, DetectiveId } from "@/lib/game/types";

interface SuspicionMeterProps {
  confidence: Record<DetectiveId, number>;
  activeDetectiveId: DetectiveId;
  eliminatedIds: DetectiveId[];
  detectives: DetectiveState[];
  notebooks: Record<DetectiveId, DeductionNotebook>;
}

export function SuspicionMeter({
  confidence,
  activeDetectiveId,
  eliminatedIds,
  detectives,
  notebooks,
}: SuspicionMeterProps) {
  // Helper to count solved clues
  const getSolvedCount = (notebook?: DeductionNotebook) => {
    if (!notebook) return 0;
    let count = 0;
    Object.values(notebook.suspects).forEach((s) => {
      if (s !== "POSSIBLE") count++;
    });
    Object.values(notebook.weapons).forEach((s) => {
      if (s !== "POSSIBLE") count++;
    });
    Object.values(notebook.rooms).forEach((s) => {
      if (s !== "POSSIBLE") count++;
    });
    return count;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <div className="px-4 pt-4 pb-2 border-b border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
          Suspicion & Intelligence
        </h3>
        <p className="text-[10px] text-[#475569] mt-0.5">Live case confidence & clues solved per detective</p>
      </div>

      <div className="flex-1 flex flex-col justify-start space-y-4 px-4 py-4">
        {detectives.map((det) => {
          const pct = Math.round((confidence[det.id] ?? 0) * 100);
          const isActive = det.id === activeDetectiveId;
          const isElim = eliminatedIds.includes(det.id);
          const solved = getSolvedCount(notebooks[det.id]);
          const totalClues = 20; // 5 suspects + 6 weapons + 9 rooms

          return (
            <motion.div
              key={det.id}
              whileHover={{ y: isElim ? 0 : -1 }}
              className={`p-3.5 rounded-xl border flex flex-col gap-3 transition-all duration-300 ${
                isElim
                  ? "bg-black/20 border-white/5 opacity-40"
                  : isActive
                  ? "bg-[#111827] border-[#b89255] shadow-[0_0_15px_rgba(184,146,85,0.12)]"
                  : "bg-white/[0.02] border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-sm shadow-inner shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${det.color}33 0%, ${det.color}11 100%)`,
                      border: `1px solid ${isActive ? '#b89255' : `${det.color}44`}`,
                      color: det.color,
                    }}
                  >
                    {det.name.charAt(0)}
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-bold truncate max-w-[130px]"
                        style={{ color: isActive ? det.color : "#f1f5f9" }}
                      >
                        {det.name}
                      </span>
                      {isActive && (
                        <span className="text-[7px] font-mono uppercase bg-[#b89255]/10 border border-[#b89255]/20 px-1 py-0.2 rounded text-[#b89255] tracking-wider animate-pulse">
                          Active
                        </span>
                      )}
                      {isElim && (
                        <span className="text-[7px] font-mono uppercase bg-red-950/20 border border-red-500/20 px-1 py-0.2 rounded text-red-500 tracking-wider">
                          Out
                        </span>
                      )}
                    </div>
                    
                    {/* Location & Status details */}
                    <div className="flex items-center gap-2 mt-0.5 text-[9px] font-mono text-[#64748b]">
                      <span>
                        {det.currentRoom
                          ? det.currentRoom.replace(/_/g, " ")
                          : `Hallway (${det.position.x}, ${det.position.y})`}
                      </span>
                      <span className="text-white/10">•</span>
                      <span className="text-[#94a3b8] font-semibold">{solved} / {totalClues} clues</span>
                    </div>
                  </div>
                </div>

                {/* Large percentage value */}
                <div className="text-right">
                  <div className="text-lg font-mono font-black tracking-tight" style={{ color: isElim ? "#475569" : det.color }}>
                    {pct}%
                  </div>
                  <div className="text-[7px] font-mono text-[#64748b] uppercase tracking-widest font-semibold">
                    Confidence
                  </div>
                </div>
              </div>

              {/* Styled progress bar */}
              {!isElim && (
                <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden border border-white/5 relative">
                  {/* Subtle markers at 25%, 50%, 75% */}
                  <div className="absolute inset-y-0 left-[25%] w-[1px] bg-white/5 z-0" />
                  <div className="absolute inset-y-0 left-[50%] w-[1px] bg-white/5 z-0" />
                  <div className="absolute inset-y-0 left-[75%] w-[1px] bg-white/5 z-0" />
                  
                  <motion.div
                    className="h-full rounded-full relative z-10"
                    style={{
                      background: `linear-gradient(to right, ${det.color}bb, ${det.color})`,
                      boxShadow: `0 0 8px ${det.color}33`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
