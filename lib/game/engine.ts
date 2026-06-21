import type {
  DetectiveId,
  WeaponId,
  RoomId,
  Card,
  Envelope,
  DeductionNotebook,
  NotebookStatus,
  Suggestion,
} from "./types";
import { DETECTIVES, WEAPONS, ROOMS } from "./constants";

// ============================================================
// DICE
// ============================================================

/** Returns a random integer in [1, 6]. */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// ============================================================
// DECK — build all 18 cards
// ============================================================

function buildDeck(): Card[] {
  const deck: Card[] = [];

  for (const d of DETECTIVES) {
    deck.push({ type: "detective", id: d.id, name: d.name });
  }
  for (const w of WEAPONS) {
    deck.push({ type: "weapon", id: w.id, name: w.name });
  }
  for (const r of ROOMS) {
    deck.push({ type: "room", id: r.id, name: r.name });
  }

  return deck;
}

/** Fisher-Yates in-place shuffle. */
function shuffleDeck<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// GAME SETUP
// ============================================================

export interface DealResult {
  envelope: Envelope;
  hands: Record<DetectiveId, Card[]>;
}

/**
 * Shuffles the 18-card deck, picks one card of each category for the
 * envelope, then deals the remainder evenly to all active detectives.
 */
export function setupDeck(detectiveIds: DetectiveId[]): DealResult {
  const deck = buildDeck();
  const shuffled = shuffleDeck(deck);

  // Pull one of each type for the envelope
  const pickAndRemove = (type: Card["type"]): Card => {
    const idx = shuffled.findIndex((c) => c.type === type);
    return shuffled.splice(idx, 1)[0];
  };

  const envelopeDetective = pickAndRemove("detective");
  const envelopeWeapon    = pickAndRemove("weapon");
  const envelopeRoom      = pickAndRemove("room");

  const envelope: Envelope = {
    suspect: envelopeDetective.id as DetectiveId,
    weapon:  envelopeWeapon.id  as WeaponId,
    room:    envelopeRoom.id    as RoomId,
  };

  // Deal the remaining cards round-robin
  const hands: Record<DetectiveId, Card[]> = {} as Record<DetectiveId, Card[]>;
  for (const id of detectiveIds) hands[id] = [];

  shuffled.forEach((card, i) => {
    const recipient = detectiveIds[i % detectiveIds.length];
    hands[recipient].push(card);
  });

  return { envelope, hands };
}

// ============================================================
// SUGGESTION — clockwise disproval
// ============================================================

/**
 * Processes a suggestion by checking each detective (clockwise from the
 * suggester) to see if they can disprove it.  Returns the first card shown,
 * or null if nobody can disprove.
 *
 * @param suggestion    The suspect/weapon/room guess
 * @param suggesterId   The detective making the suggestion (skipped)
 * @param detectiveOrder Ordered list of detective IDs (turn order)
 * @param hands         Current hands of every detective
 */
export function processSuggestion(
  suggestion: Suggestion,
  suggesterId: DetectiveId,
  detectiveOrder: DetectiveId[],
  hands: Record<DetectiveId, Card[]>
): { disproverId: DetectiveId; card: Card } | null {
  const suggesterIndex = detectiveOrder.indexOf(suggesterId);

  for (let i = 1; i < detectiveOrder.length; i++) {
    const candidateId =
      detectiveOrder[(suggesterIndex + i) % detectiveOrder.length];
    const hand = hands[candidateId] ?? [];

    const matchingCards = hand.filter(
      (c) =>
        c.id === suggestion.suspect ||
        c.id === suggestion.weapon  ||
        c.id === suggestion.room
    );

    if (matchingCards.length > 0) {
      // Reveal the first matching card (sorted for determinism)
      const revealed = matchingCards[0];
      return { disproverId: candidateId, card: revealed };
    }
  }

  return null; // No one could disprove
}

// ============================================================
// ACCUSATION — win check
// ============================================================

/**
 * Checks whether an accusation exactly matches the envelope.
 * Returns true only when all three components are correct.
 */
export function checkAccusation(
  accusation: Suggestion,
  envelope: Envelope
): boolean {
  return (
    accusation.suspect === envelope.suspect &&
    accusation.weapon  === envelope.weapon  &&
    accusation.room    === envelope.room
  );
}

// ============================================================
// DEDUCTION NOTEBOOK
// ============================================================

/**
 * Creates a fresh notebook for a detective at game start.
 * Cards held in their own hand are marked HELD_BY_ME;
 * everything else starts as POSSIBLE.
 */
export function createEmptyNotebook(myCards: Card[]): DeductionNotebook {
  const myCardIds = new Set(myCards.map((c) => c.id));

  const statusFor = (id: string): NotebookStatus =>
    myCardIds.has(id) ? "HELD_BY_ME" : "POSSIBLE";

  const suspects = {} as Record<DetectiveId, NotebookStatus>;
  for (const d of DETECTIVES) suspects[d.id] = statusFor(d.id);

  const weapons = {} as Record<WeaponId, NotebookStatus>;
  for (const w of WEAPONS) weapons[w.id] = statusFor(w.id);

  const rooms = {} as Record<RoomId, NotebookStatus>;
  for (const r of ROOMS) rooms[r.id] = statusFor(r.id);

  return { suspects, weapons, rooms };
}
