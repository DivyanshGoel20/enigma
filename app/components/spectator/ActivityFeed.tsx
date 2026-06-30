"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { LogEntry, DetectiveId } from "@/lib/game/types";
import { DETECTIVE_BY_ID } from "@/lib/game/constants";
import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store/gameStore";

const ACTION_STYLES: Record<string, { label: string; color: string }> = {
  GAME_START:     { label: "START",    color: "#10b981" },
  ROLL:           { label: "ROLL",     color: "#b89255" },
  ENTER_ROOM:     { label: "ENTER",    color: "#06b6d4" },
  SUGGEST:        { label: "SUGGEST",  color: "#8b5cf6" },
  DISPROVE:       { label: "DISPROVE", color: "#f59e0b" },
  NO_DISPROVAL:   { label: "OPEN!",    color: "#f43f5e" },
  ACCUSE:         { label: "ACCUSE",   color: "#ef4444" },
  ELIMINATED:     { label: "OUT",      color: "#475569" },
  TURN_START:     { label: "TURN",     color: "#64748b" },
  GAME_OVER:      { label: "OVER",     color: "#10b981" },
  THINK:          { label: "THINK",    color: "#a78bfa" },
  STORAGE_UPLOAD: { label: "STORAGE",  color: "#06b6d4" },
  CHAIN_CONFIRM:  { label: "CHAIN",    color: "#10b981" },
};

interface ActivityFeedProps {
  log: LogEntry[];
}

export function ActivityFeed({ log }: ActivityFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { detectives } = useGameStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log.length]);

  const getDetName = (id: string) => {
    const found = detectives.find((d) => d.id === id);
    return found ? found.name : (DETECTIVE_BY_ID[id as DetectiveId]?.name || id);
  };

  const getDetColor = (id: string) => {
    const found = detectives.find((d) => d.id === id);
    return found ? found.color : (DETECTIVE_BY_ID[id as DetectiveId]?.color || "#64748b");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
          Activity Feed
        </h3>
        <span className="text-[10px] font-mono text-[#475569]">{log.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {log.map((entry) => {
            const style = ACTION_STYLES[entry.action] ?? { label: entry.action, color: "#64748b" };
            const hasAgent = entry.agentId !== "SYSTEM";
            const name = hasAgent ? getDetName(entry.agentId) : "";
            const color = hasAgent ? getDetColor(entry.agentId) : "";

            // Replace any trace of original detective name or ID in the details logs
            let displayDetails = entry.details;
            detectives.forEach((d) => {
              const originalName = DETECTIVE_BY_ID[d.id]?.name;
              if (originalName) {
                // 1. Always replace raw ID with the active name (e.g. ROSEWOOD -> Madam Rosewood, or BLACKWOOD -> Cray Frog)
                displayDetails = displayDetails.replace(new RegExp(d.id, "g"), d.name);

                // 2. Only perform name substitutions if the name is customized
                if (d.name !== originalName) {
                  // Replace full name case-insensitively
                  displayDetails = displayDetails.replace(new RegExp(originalName, "gi"), d.name);

                  // Also replace the last name only (e.g. "Blackwood" -> "Funky Fish")
                  const lastName = originalName.split(" ").slice(-1)[0];
                  if (lastName && lastName.length > 2) {
                    displayDetails = displayDetails.replace(new RegExp(lastName, "gi"), d.name);
                  }
                }
              }
            });

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22 }}
                className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.025] border border-white/[0.04]"
              >
                {/* Badge */}
                <span
                  className="shrink-0 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded mt-0.5"
                  style={{
                    background: `${style.color}22`,
                    color: style.color,
                    border: `1px solid ${style.color}44`,
                  }}
                >
                  {style.label}
                </span>

                <div className="flex-1 min-w-0">
                  {hasAgent && (
                    <div className="flex items-center gap-1 mb-0.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] font-semibold text-[#f1f5f9] truncate">
                        {name}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-[#94a3b8] leading-snug">{displayDetails}</p>
                  
                  {/* Explorer links */}
                  {(entry.txHash || entry.rootHash || entry.txSeq !== undefined) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 pt-1 border-t border-white/[0.03] text-[9px] font-mono text-[#64748b]">
                      {entry.txHash && (
                        <a
                          href={`https://chainscan-galileo.0g.ai/tx/${entry.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#b89255] transition-colors underline flex items-center gap-0.5"
                        >
                          🔗 Chain Tx: {entry.txHash.substring(0, 10)}...
                        </a>
                      )}
                      {entry.txSeq !== undefined ? (
                        <a
                          href={`https://storagescan-galileo.0g.ai/submission/${entry.txSeq}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#06b6d4] transition-colors underline flex items-center gap-0.5"
                        >
                          📦 Storage: #{entry.txSeq}
                        </a>
                      ) : entry.rootHash ? (
                        <span className="flex items-center gap-0.5 text-gray-500" title={entry.rootHash}>
                          📦 Storage Hash: {entry.rootHash.substring(0, 10)}...
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
