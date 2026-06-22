"use client";

import { motion } from "framer-motion";

interface DetectivePawnProps {
  color: string;
  name: string;
  isActive: boolean;
  isEliminated: boolean;
  /** Stacking index when multiple pawns share a cell */
  stackIndex: number;
}

export function DetectivePawn({
  color,
  name,
  isActive,
  isEliminated,
  stackIndex,
}: DetectivePawnProps) {
  const offset = stackIndex * 3;

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isEliminated ? 0.6 : 1,
        opacity: isEliminated ? 0.35 : 1,
        y: isActive ? [0, -3, 0] : 0,
      }}
      transition={{
        scale: { type: "spring", stiffness: 380, damping: 28 },
        y: isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {},
      }}
      className="absolute flex items-center justify-center rounded-full shadow-2xl pointer-events-none select-none"
      style={{
        width: "clamp(16px, 2vw, 26px)",
        height: "clamp(16px, 2vw, 26px)",
        background: `radial-gradient(circle at 35% 35%, ${color} 0%, rgba(10,5,5,0.85) 100%)`,
        border: isActive
          ? `2px solid #b89255`
          : `1.5px solid rgba(255,255,255,0.45)`,
        boxShadow: isActive
          ? `0 0 15px 3px ${color}aa, 0 4px 10px rgba(0,0,0,0.8)`
          : `0 4px 6px rgba(0,0,0,0.6)`,
        zIndex: isActive ? 50 : 20 + stackIndex,
        transform: `translate(${offset}px, ${offset}px)`,
      }}
      title={name}
    >
      {/* Monogram initial of the detective */}
      <span className="text-[10px] sm:text-[11px] font-black font-mono text-white/90 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.95)]">
        {name.charAt(0)}
      </span>

      {isActive && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: "140%",
            height: "140%",
            border: `2px solid ${color}`,
            opacity: 0.6,
          }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.div>
  );
}
