/**
 * 0G Galileo Testnet network configuration.
 * All chain interactions in this project target testnet only.
 */
export const ZG_CONFIG = {
  chainId: 16602,
  chainName: "0G Galileo Testnet",
  rpcUrl: "https://evmrpc-testnet.0g.ai",
  storageIndexer: "https://indexer-storage-testnet-turbo.0g.ai",
  explorer: "https://chainscan-galileo.0g.ai",
  storageExplorer: "https://storagescan-galileo.0g.ai",
  faucetUrl: "https://faucet.0g.ai",
  tokenSymbol: "0G",
} as const;

/** Default 0G Compute (OpenAI-compatible) router endpoint. */
export const COMPUTE_CONFIG = {
  baseUrl:
    process.env.ZERO_G_ROUTER_BASE_URL ??
    "https://router-api-testnet.integratenetwork.work/v1",
  model:
    process.env.ZERO_G_ROUTER_MODEL ?? "qwen/qwen-2.5-7b-instruct",
} as const;

/** Unique project attribute that tags all 0G Storage uploads for this app. */
export const PROJECT_ATTRIBUTE = {
  key: "project",
  value:
    process.env.NEXT_PUBLIC_PROJECT_ID ??
    "ashford-manor-mystery-2026",
} as const;
