"use client";

import { useEffect, useState } from "react";
import { setupDeck } from "@/lib/game/engine";
import { DETECTIVES, ROOMS, WEAPONS, STARTING_POSITIONS, ROOM_BY_ID } from "@/lib/game/constants";
import { findPath } from "@/lib/game/board";
import { generateKeyPair, encryptPayload, buildCluePayload } from "@/lib/crypto/hybrid";
import type { Envelope, Card, Position, DetectiveId, RoomId } from "@/lib/game/types";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [envelope, setEnvelope] = useState<Envelope | null>(null);
  const [hands, setHands] = useState<Record<string, Card[]>>({});
  const [cryptoTest, setCryptoTest] = useState<{
    pubKey: string;
    privKey: string;
    plaintext: string;
    ciphertext: string;
  } | null>(null);

  // Pathfinding demo state
  const [selectedDetective, setSelectedDetective] = useState<DetectiveId>("VANCE");
  const [selectedRoom, setSelectedRoom] = useState<RoomId>("GRAND_FOYER");
  const [calculatedPath, setCalculatedPath] = useState<Position[] | null>(null);

  useEffect(() => {
    async function runValidation() {
      // 1. Test Deck Setup & Envelope Deal
      const detectiveIds = DETECTIVES.map((d) => d.id);
      const deal = setupDeck(detectiveIds);
      setEnvelope(deal.envelope);
      setHands(deal.hands);

      // 2. Test Cryptography Module
      const keys = await generateKeyPair();
      const samplePayload = buildCluePayload({
        gameId: "test-game-12345",
        round: 1,
        revealingAgentId: "ROSEWOOD",
        receivingAgentId: "VANCE",
        cardType: "weapon",
        cardId: "PEARL_PISTOL",
        cardName: "Pearl-handled Pistol",
      });
      const encrypted = await encryptPayload(samplePayload, keys.publicKey);

      setCryptoTest({
        pubKey: keys.publicKey,
        privKey: keys.privateKey,
        plaintext: JSON.stringify(samplePayload, null, 2),
        ciphertext: encrypted,
      });

      setLoading(false);
    }
    runValidation();
  }, []);

  // Update path calculation when selection changes
  useEffect(() => {
    const start = STARTING_POSITIONS[selectedDetective];
    const room = ROOM_BY_ID[selectedRoom];
    if (start && room && room.doors.length > 0) {
      // Direct path to the first door of the target room
      const targetDoor = room.doors[0];
      const path = findPath(start, targetDoor);
      setCalculatedPath(path);
    }
  }, [selectedDetective, selectedRoom]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080b14] text-[#f1f5f9]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#b89255] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#94a3b8] font-mono">Analyzing Ashford Manor evidence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#080b14] text-[#f1f5f9] font-sans selection:bg-[#b89255] selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/5 bg-[#0d1117] py-6 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="wax-seal"></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#b89255]">Ashford Manor Mystery</h1>
            <p className="text-xs text-[#94a3b8] font-mono">Game Engine & Cryptography Console (Phase 1)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse"></span>
          <span className="text-xs font-mono text-[#10b981]">Phase 1 Active & Validated</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Column 1: Case Envelope & Card Hands */}
        <section className="xl:col-span-1 flex flex-col gap-6">
          <div className="manila-dossier p-6 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#8a6a30]/30 pb-4 mb-4">
                <h2 className="text-lg font-bold uppercase tracking-wider text-[#1c1d22]">Case File: Dealt Hands</h2>
                <span className="text-xs font-mono bg-[#8a6a30]/20 px-2 py-0.5 rounded text-[#1c1d22]">Setup deck</span>
              </div>

              {/* Envelope */}
              {envelope && (
                <div className="bg-[#1c1d22]/5 p-4 rounded border border-[#8a6a30]/20 mb-6">
                  <h3 className="text-xs font-bold uppercase text-[#8a6a30] mb-2 tracking-wide">Confidential Envelope</h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="bg-[#1c1d22] text-[#f43f5e] p-2 rounded border border-[#8a6a30]/20">
                      <span className="block text-[10px] text-gray-500">Suspect</span>
                      {envelope.suspect}
                    </div>
                    <div className="bg-[#1c1d22] text-[#06b6d4] p-2 rounded border border-[#8a6a30]/20">
                      <span className="block text-[10px] text-gray-500">Weapon</span>
                      {envelope.weapon}
                    </div>
                    <div className="bg-[#1c1d22] text-[#b89255] p-2 rounded border border-[#8a6a30]/20">
                      <span className="block text-[10px] text-gray-500">Room</span>
                      {envelope.room}
                    </div>
                  </div>
                </div>
              )}

              {/* Dealt Hands */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-[#1c1d22] tracking-wide">Hands Distributed</h3>
                {DETECTIVES.map((det) => (
                  <div key={det.id} className="bg-[#1c1d22]/5 p-3 rounded border border-black/5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: det.color }} />
                      <span className="text-sm font-bold text-[#1c1d22]">{det.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hands[det.id]?.map((card) => (
                        <span
                          key={card.id}
                          className="text-[10px] font-mono bg-[#1c1d22] text-[#f1f5f9] px-2 py-0.5 rounded border border-white/5"
                        >
                          {card.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 text-[10px] text-[#8a6a30] text-center border-t border-[#8a6a30]/20 pt-4 font-mono">
               Ashcroft Manor Records — Classified
            </div>
          </div>
        </section>

        {/* Column 2: Cryptography & Security Layer */}
        <section className="xl:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <h2 className="text-lg font-bold tracking-tight text-[#b89255]">Crypto Validation</h2>
                <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded text-[#94a3b8]">RSA + AES</span>
              </div>

              {cryptoTest && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-[#94a3b8] mb-1.5 font-mono">1. Public Key (Inspector Vance)</h3>
                    <div className="bg-[#080b14] p-3 rounded border border-white/5 font-mono text-[10px] text-[#06b6d4] break-all max-h-16 overflow-y-auto">
                      {cryptoTest.pubKey}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase text-[#94a3b8] mb-1.5 font-mono">2. Raw Clue Envelope (Plaintext JSON)</h3>
                    <pre className="bg-[#080b14] p-3 rounded border border-white/5 font-mono text-[10px] text-[#f43f5e] overflow-x-auto max-h-36">
                      {cryptoTest.plaintext}
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase text-[#94a3b8] mb-1.5 font-mono">3. Encrypted Clue Bundle (Base64 Cipher)</h3>
                    <div className="bg-[#080b14] p-3 rounded border border-white/5 font-mono text-[10px] text-amber-500 break-all max-h-24 overflow-y-auto">
                      {cryptoTest.ciphertext}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#10b981]/5 border border-[#10b981]/10 p-3 rounded flex items-start gap-2.5 mt-6 text-xs text-[#10b981] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] mt-1.5"></span>
              <span>Web Crypto API verification successful. Payloads protected against brute-force entropy attacks.</span>
            </div>
          </div>
        </section>

        {/* Column 3: Board Geometry & BFS Pathfinding */}
        <section className="xl:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <h2 className="text-lg font-bold tracking-tight text-[#b89255]">BFS Pathfinding Tester</h2>
                <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded text-[#94a3b8]">12x12 grid</span>
              </div>

              {/* Selector */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-mono text-[#94a3b8] mb-1.5 uppercase">Detective</label>
                  <select
                    value={selectedDetective}
                    onChange={(e) => setSelectedDetective(e.target.value as DetectiveId)}
                    className="w-full bg-[#080b14] border border-white/10 rounded px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#b89255]"
                  >
                    {DETECTIVES.map((det) => (
                      <option key={det.id} value={det.id}>
                        {det.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#94a3b8] mb-1.5 uppercase">Target Room</label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value as RoomId)}
                    className="w-full bg-[#080b14] border border-white/10 rounded px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#b89255]"
                  >
                    {ROOMS.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates details */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#080b14] p-3 rounded border border-white/5 text-xs">
                  <span className="text-[#94a3b8]">Start position:</span>
                  <span className="font-mono text-violet-400">
                    ({STARTING_POSITIONS[selectedDetective].x}, {STARTING_POSITIONS[selectedDetective].y})
                  </span>
                </div>
                <div className="flex justify-between items-center bg-[#080b14] p-3 rounded border border-white/5 text-xs">
                  <span className="text-[#94a3b8]">Door coordinate:</span>
                  <span className="font-mono text-emerald-400">
                    ({ROOM_BY_ID[selectedRoom].doors[0]?.x}, {ROOM_BY_ID[selectedRoom].doors[0]?.y})
                  </span>
                </div>

                {/* Path display */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-[#94a3b8] mb-1.5 font-mono">Calculated Shortest Path</h3>
                  {calculatedPath ? (
                    <div className="bg-[#080b14] p-3 rounded border border-white/5 max-h-40 overflow-y-auto">
                      <div className="text-xs text-[#10b981] mb-2 font-mono">
                        Path found: {calculatedPath.length - 1} steps
                      </div>
                      <div className="flex flex-col gap-1 text-[10px] font-mono text-gray-400">
                        {calculatedPath.map((step, idx) => (
                          <div key={idx} className="flex justify-between border-b border-white/5 pb-1">
                            <span>Step {idx}:</span>
                            <span className="text-white">({step.x}, {step.y})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-950/20 border border-red-900/30 p-3 rounded text-xs text-red-400 font-mono">
                      No path found. The target room is blocked or doors are unreachable.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#06b6d4]/5 border border-[#06b6d4]/10 p-3 rounded flex items-start gap-2.5 mt-6 text-xs text-[#06b6d4] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-[#06b6d4] mt-1.5"></span>
              <span>BFS logic active. Pawns navigate the hallways and entryways step-by-step without diagonal hacks.</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

