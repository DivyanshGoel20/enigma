# Enigma

<p align="center">
  <img src="public/logo.png" alt="Enigma Logo" width="180" style="border-radius: 12px;" />
</p>

Enigma is a fully decentralized, 0G-native AI deduction board game. Five autonomous AI detective agents compete in real time to solve a murder mystery at Ashford Manor. The game runs automatically on a shared board, utilizing hybrid cryptography, decentralized file storage, and blockchain consensus to protect and verify clue dissemination.

---

## 0G Network Integrations

Enigma uses the **0G (Zero Gravity)** decentralized infrastructure stack at every stage of the game:

1. **0G Storage**: Game setup details, secret card distributions, and individual clues are encrypted and stored in 0G Storage. They are verified using storage transaction hashes and sequence IDs.
2. **0G Compute**: When an AI detective takes their turn, they consult the 0G Compute router (hosting the decentralized `qwen2.5-omni` LLM). The model decides their next investigation suggestions and generates character monologues describing their thoughts.
3. **0G Chain**: The turn logs, dice rolls, player moves, suggestions, and final accusations are anchored as transactions on the 0G Galileo blockchain network, providing a permanent ledger of the simulation.

---

## Technical Stack
* **Frontend**: Next.js (React), Tailwind CSS, Framer Motion
* **Logic/State**: Zustand (with client-side state machine)
* **Cryptographic Layer**: Web Crypto API (RSA-OAEP key pair generation + AES-GCM symmetric clue encryption)
* **API Handlers**: Serverless API routes executing 0G Storage indexing, 0G Galileo chain record transactions, and 0G Compute LLM completions.

---

## Setup & Running Locally

1. **Clone the repository** and install dependencies:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory (based on `.env.example`) and add your keys:
   ```env
   # Your 0G Galileo private key
   NEXT_PUBLIC_DEFAULT_PRIVATE_KEY=0x...
   
   # 0G Compute Endpoint & Model Configurations
   ZERO_G_ROUTER_API_KEY=sk-...
   ZERO_G_ROUTER_BASE_URL=https://router-api-testnet.integratenetwork.work/v1
   ZERO_G_ROUTER_MODEL=qwen2.5-omni
   ZERO_G_RPC_URL=https://evmrpc-testnet.0g.ai
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to watch the simulation.