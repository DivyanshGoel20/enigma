import type {
  DetectiveId,
  WeaponId,
  RoomId,
  Card,
  DeductionNotebook,
  NotebookStatus,
  Suggestion,
} from "./types";
import { DETECTIVES, WEAPONS, ROOMS } from "./constants";

// ============================================================
// NOTEBOOK UPDATES
// ============================================================

/**
 * Records that a revealed card is held by another detective.
 * Marks it ELIMINATED from the envelope, not HELD_BY_ME
 * (only the receiving detective's own notebook uses HELD_BY_ME).
 */
export function updateNotebookFromReveal(
  notebook: DeductionNotebook,
  card: Card
): DeductionNotebook {
  const next = cloneNotebook(notebook);

  if (card.type === "detective") {
    const id = card.id as DetectiveId;
    if (next.suspects[id] === "POSSIBLE") {
      next.suspects[id] = "HELD_BY_OTHER";
    }
  } else if (card.type === "weapon") {
    const id = card.id as WeaponId;
    if (next.weapons[id] === "POSSIBLE") {
      next.weapons[id] = "HELD_BY_OTHER";
    }
  } else {
    const id = card.id as RoomId;
    if (next.rooms[id] === "POSSIBLE") {
      next.rooms[id] = "HELD_BY_OTHER";
    }
  }

  return next;
}

/**
 * Called when *nobody* disproved a suggestion.
 * All three suggestion components become ELIMINATED (they're likely in
 * the envelope, but we mark conservatively: any POSSIBLE card that was
 * suggested and went undisproved moves toward ELIMINATED).
 *
 * Note: only call this when the local detective is the suggester.
 * Rivals' notebooks are not updated with this information.
 */
export function updateNotebookFromNoDisproval(
  notebook: DeductionNotebook,
  suggestion: Suggestion
): DeductionNotebook {
  const next = cloneNotebook(notebook);

  if (next.suspects[suggestion.suspect] === "POSSIBLE") {
    next.suspects[suggestion.suspect] = "ELIMINATED";
  }
  if (next.weapons[suggestion.weapon] === "POSSIBLE") {
    next.weapons[suggestion.weapon] = "ELIMINATED";
  }
  if (next.rooms[suggestion.room] === "POSSIBLE") {
    next.rooms[suggestion.room] = "ELIMINATED";
  }

  return next;
}

// ============================================================
// DEDUCTION ANALYSIS
// ============================================================

/**
 * Inspects the notebook and returns the solved envelope if every
 * category has exactly one POSSIBLE or ELIMINATED entry remaining.
 *
 * Returns null while the case is still open.
 */
export function runDeductionAnalysis(
  notebook: DeductionNotebook
): { suspect: DetectiveId; weapon: WeaponId; room: RoomId } | null {
  const possibleSuspects = DETECTIVES.filter(
    (d) => notebook.suspects[d.id] === "POSSIBLE" || notebook.suspects[d.id] === "ELIMINATED"
  ).filter((d) => notebook.suspects[d.id] !== "HELD_BY_ME" && notebook.suspects[d.id] !== "HELD_BY_OTHER");

  const possibleWeapons = WEAPONS.filter(
    (w) => notebook.weapons[w.id] === "POSSIBLE" || notebook.weapons[w.id] === "ELIMINATED"
  ).filter((w) => notebook.weapons[w.id] !== "HELD_BY_ME" && notebook.weapons[w.id] !== "HELD_BY_OTHER");

  const possibleRooms = ROOMS.filter(
    (r) => notebook.rooms[r.id] === "POSSIBLE" || notebook.rooms[r.id] === "ELIMINATED"
  ).filter((r) => notebook.rooms[r.id] !== "HELD_BY_ME" && notebook.rooms[r.id] !== "HELD_BY_OTHER");

  // Recalculate: only items still "POSSIBLE" count as in-play
  const inPlaySuspects = DETECTIVES.filter((d) => notebook.suspects[d.id] === "POSSIBLE");
  const inPlayWeapons  = WEAPONS.filter((w)  => notebook.weapons[w.id]  === "POSSIBLE");
  const inPlayRooms    = ROOMS.filter((r)    => notebook.rooms[r.id]    === "POSSIBLE");

  if (
    inPlaySuspects.length === 1 &&
    inPlayWeapons.length  === 1 &&
    inPlayRooms.length    === 1
  ) {
    return {
      suspect: inPlaySuspects[0].id,
      weapon:  inPlayWeapons[0].id,
      room:    inPlayRooms[0].id,
    };
  }

  return null;
}

/**
 * Returns a confidence value in [0.0, 1.0] representing how close the
 * detective is to solving the case.  Higher = more cards eliminated.
 */
export function calculateConfidence(notebook: DeductionNotebook): number {
  const total =
    DETECTIVES.length + WEAPONS.length + ROOMS.length; // 5 + 6 + 9 = 20

  const eliminated =
    Object.values(notebook.suspects).filter(
      (s) => s === "HELD_BY_ME" || s === "HELD_BY_OTHER"
    ).length +
    Object.values(notebook.weapons).filter(
      (s) => s === "HELD_BY_ME" || s === "HELD_BY_OTHER"
    ).length +
    Object.values(notebook.rooms).filter(
      (s) => s === "HELD_BY_ME" || s === "HELD_BY_OTHER"
    ).length;

  return Math.min(1, eliminated / (total - 3)); // 3 = the hidden envelope cards
}

/**
 * Evaluates whether an AI detective should make an accusation.
 * Logical, cautious, and statistical detectives require 100% confidence.
 * Madam Rosewood (Aggressive Risk-taker) is willing to make a guess if she has narrowed
 * it down to 2 possible combinations (50% probability) starting from Round 3.
 */
export function checkAIAccusationDecision(
  agentId: DetectiveId,
  notebook: DeductionNotebook,
  round: number
): { suspect: DetectiveId; weapon: WeaponId; room: RoomId } | null {
  const inPlaySuspects = DETECTIVES.filter((d) => notebook.suspects[d.id] === "POSSIBLE");
  const inPlayWeapons  = WEAPONS.filter((w)  => notebook.weapons[w.id]  === "POSSIBLE");
  const inPlayRooms    = ROOMS.filter((r)    => notebook.rooms[r.id]    === "POSSIBLE");

  // Standard case: solved (exactly 1 candidate in each category)
  if (
    inPlaySuspects.length === 1 &&
    inPlayWeapons.length  === 1 &&
    inPlayRooms.length    === 1
  ) {
    return {
      suspect: inPlaySuspects[0].id,
      weapon:  inPlayWeapons[0].id,
      room:    inPlayRooms[0].id,
    };
  }

  // Madam Rosewood: Aggressive risk-taker (Round 3+ and exactly 2 combinations left)
  if (agentId === "ROSEWOOD" && round >= 3) {
    const totalCombos = inPlaySuspects.length * inPlayWeapons.length * inPlayRooms.length;
    if (totalCombos === 2 && inPlaySuspects.length > 0 && inPlayWeapons.length > 0 && inPlayRooms.length > 0) {
      const chosenSuspect = inPlaySuspects[Math.floor(Math.random() * inPlaySuspects.length)].id;
      const chosenWeapon = inPlayWeapons[Math.floor(Math.random() * inPlayWeapons.length)].id;
      const chosenRoom = inPlayRooms[Math.floor(Math.random() * inPlayRooms.length)].id;
      return {
        suspect: chosenSuspect,
        weapon: chosenWeapon,
        room: chosenRoom,
      };
    }
  }

  return null;
}

// ============================================================
// HELPERS
// ============================================================

function cloneNotebook(nb: DeductionNotebook): DeductionNotebook {
  return {
    suspects: { ...nb.suspects },
    weapons:  { ...nb.weapons  },
    rooms:    { ...nb.rooms    },
  };
}

