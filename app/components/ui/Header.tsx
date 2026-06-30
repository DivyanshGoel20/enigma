"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { Volume2, VolumeX, Music, Sliders } from "lucide-react";
import { soundManager } from "@/lib/game/sound";

export function Header() {
  const { status, gameId, round, turn, initGame } = useGameStore();

  // Audio Control States
  const [isOpen, setIsOpen] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.8);
  const [musicVolume, setMusicVolume] = useState(0.3);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sync initial settings from SoundManager
    setMusicMuted(soundManager.getIsMutedMusic());
    setSfxMuted(soundManager.getIsMutedSfx());
    setMasterVolume(soundManager.getMasterVolume());
    setSfxVolume(soundManager.getSfxVolume());
    setMusicVolume(soundManager.getMusicVolume());

    // Click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReset = () => {
    initGame();
  };

  const toggleMusic = () => {
    soundManager.init();
    const muted = soundManager.toggleMuteMusic();
    setMusicMuted(muted);
  };

  const toggleSfx = () => {
    soundManager.init();
    const muted = soundManager.toggleMuteSfx();
    setSfxMuted(muted);
  };

  const handleMasterVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMasterVolume(val);
    setMasterVolume(val);
  };

  const handleSfxVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setSfxVolume(val);
    setSfxVolume(val);
  };

  const handleMusicVolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundManager.setMusicVolume(val);
    setMusicVolume(val);
  };

  return (
    <header className="border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50 py-4 px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Title */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Enigma Logo"
          className="w-8 h-8 object-contain rounded-lg border border-[#b89255]/20 shadow-md"
        />
        <div>
          <h1 className="text-xl font-extrabold tracking-wider text-[#b89255] serif-title uppercase">
            Enigma
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
        {/* Sound Settings Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9] bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-mono"
            title="Audio settings"
          >
            {sfxMuted && musicMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-white/40" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#b89255]" />
            )}
            <span>Audio</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0d1117]/95 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-lg z-50 text-xs font-mono text-[#94a3b8] flex flex-col gap-3">
              <h3 className="text-sm font-bold text-[#b89255] border-b border-white/5 pb-1 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Audio Controls
              </h3>

              {/* Master Volume */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span>Master Volume</span>
                  <span className="text-[#f1f5f9]">{Math.round(masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVolume}
                  onChange={handleMasterVolChange}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#b89255]"
                />
              </div>

              {/* Sound Effects */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleSfx}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-left font-bold text-[#94a3b8] hover:text-[#f1f5f9]"
                  >
                    {sfxMuted ? (
                      <VolumeX className="w-3.5 h-3.5 text-white/40" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-[#b89255]" />
                    )}
                    <span>Sound Effects</span>
                  </button>
                  <span className="text-[#f1f5f9]">{sfxMuted ? "Muted" : `${Math.round(sfxVolume * 100)}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={sfxVolume}
                  onChange={handleSfxVolChange}
                  disabled={sfxMuted}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#b89255] disabled:opacity-30"
                />
              </div>

              {/* Ambient Music */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleMusic}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-left font-bold text-[#94a3b8] hover:text-[#f1f5f9]"
                  >
                    <Music className={`w-3.5 h-3.5 ${musicMuted ? "text-white/40" : "text-[#b89255]"}`} />
                    <span>Background Music</span>
                  </button>
                  <span className="text-[#f1f5f9]">{musicMuted ? "Muted" : `${Math.round(musicVolume * 100)}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={handleMusicVolChange}
                  disabled={musicMuted}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#b89255] disabled:opacity-30"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleReset}
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono bg-white/[0.04] border border-[#b89255]/20 hover:border-[#b89255]/40 hover:bg-[#b89255]/5 active:scale-95 text-[#f1f5f9] transition-all cursor-pointer"
        >
          {status === "initializing" ? "Start Game" : "New Match"}
        </button>
      </div>
    </header>
  );
}

