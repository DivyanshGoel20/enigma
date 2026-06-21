import { ethers } from "ethers";
import { ZG_CONFIG } from "./config";

// ============================================================
// WALLET KEY MANAGEMENT
// ============================================================

const LOCAL_STORAGE_KEY = "ashford_manor_priv_key";
const DEFAULT_ENV_KEY   = process.env.NEXT_PUBLIC_DEFAULT_PRIVATE_KEY ?? "";

/**
 * Returns a funded private key for 0G chain write operations.
 *
 * Priority:
 *   1. Custom key set in NEXT_PUBLIC_DEFAULT_PRIVATE_KEY env var
 *   2. Key previously generated and stored in localStorage
 *   3. Fresh cryptographically-random key (stored for persistence)
 *
 * Must only be called in a browser context.
 */
export function getOrGeneratePrivateKey(): string {
  // Use the env key if it's a genuine custom key
  if (DEFAULT_ENV_KEY && DEFAULT_ENV_KEY.length === 66) {
    return DEFAULT_ENV_KEY;
  }

  if (typeof window === "undefined") {
    return DEFAULT_ENV_KEY;
  }

  let stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    try {
      const bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      stored =
        "0x" +
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      localStorage.setItem(LOCAL_STORAGE_KEY, stored);
    } catch {
      stored = DEFAULT_ENV_KEY;
    }
  }

  return stored;
}

/**
 * Derives the Ethereum address from a private key using ethers v6.
 * Returns the zero address on failure (safe fallback for UI display).
 */
export function getAddressFromPrivateKey(privateKey: string): string {
  try {
    const formatted = privateKey.startsWith("0x")
      ? privateKey
      : `0x${privateKey}`;
    return new ethers.Wallet(formatted as `0x${string}`).address;
  } catch {
    return "0x0000000000000000000000000000000000000000";
  }
}

// ============================================================
// PROVIDER & WALLET FACTORIES
// ============================================================

/** Creates a read-only provider connected to the 0G Galileo testnet. */
export function createProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(ZG_CONFIG.rpcUrl, {
    chainId: ZG_CONFIG.chainId,
    name: ZG_CONFIG.chainName,
  });
}

/**
 * Creates a signer wallet for write operations.
 * @param privateKey — hex private key (with or without 0x prefix)
 */
export function createWallet(privateKey: string): ethers.Wallet {
  const formatted = privateKey.startsWith("0x")
    ? privateKey
    : `0x${privateKey}`;
  const provider = createProvider();
  return new ethers.Wallet(formatted, provider);
}

// ============================================================
// SAFE TRANSACTION WRAPPER
// ============================================================

export interface TxResult {
  status: "pending" | "success" | "error";
  txHash?: string;
  error?: string;
}

/**
 * Wraps any 0G Chain write operation with status-tracking callbacks.
 * Always emits a `pending` event before the call, then `success` or `error`.
 *
 * @param writeFn    Async function that performs the actual chain write
 * @param onStatus   Callback invoked with every status change
 */
export async function safeChainWrite<T>(
  writeFn: () => Promise<T>,
  onStatus: (result: TxResult) => void
): Promise<T | null> {
  onStatus({ status: "pending" });
  try {
    const result = await writeFn();

    // Extract tx hash from whatever the write function returns
    let txHash: string | undefined;
    if (result && typeof result === "object") {
      if ("hash"   in result) txHash = (result as { hash: string }).hash;
      if ("txHash" in result) txHash = (result as { txHash: string }).txHash;
    }

    onStatus({ status: "success", txHash });
    return result;
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : String(err);

    const userMessage = msg.includes("insufficient funds")
      ? "Insufficient 0G gas — fund your wallet at faucet.0g.ai"
      : msg;

    console.warn("[0G Chain] write failed:", userMessage);
    onStatus({ status: "error", error: userMessage });
    return null;
  }
}
