import { create } from "zustand";

// ============================================================
// UI STORE — ephemeral view-only state, never persisted
// ============================================================

export type ActivePanel = "feed" | "suspicion" | "detectives";

export interface UIState {
  msPerStep: number; // milliseconds per movement animation tick
  activePanel: ActivePanel;
  isDiceAnimating: boolean;
  isBoardHighlighting: boolean;
  showWinnerReveal: boolean;
}

export interface UIActions {
  setActivePanel: (panel: ActivePanel) => void;
  setDiceAnimating: (v: boolean) => void;
  setBoardHighlighting: (v: boolean) => void;
  setShowWinnerReveal: (v: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  msPerStep: 250,
  activePanel: "feed",
  isDiceAnimating: false,
  isBoardHighlighting: false,
  showWinnerReveal: false,

  setActivePanel: (panel) => set({ activePanel: panel }),

  setDiceAnimating: (v) => set({ isDiceAnimating: v }),

  setBoardHighlighting: (v) => set({ isBoardHighlighting: v }),

  setShowWinnerReveal: (v) => set({ showWinnerReveal: v }),
}));
