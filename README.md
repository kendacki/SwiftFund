<div align="center">
  <img src="./swiftfund-logo.png" alt="SwiftFund Logo" width="200" />
  <h1>SwiftFund</h1>
  <p><strong>Decentralized Crowdfunding & Automated Yield Sharing</strong></p>
</div>

<hr />

## The Vision

SwiftFund bridges the gap between creators and their communities. Traditional crowdfunding platforms allow users to back projects, but they rarely allow those early believers to share in the long-term financial success of the product.

We built SwiftFund to change that. By leveraging smart contracts, SwiftFund allows creators to raise capital in HBAR, while automatically and proportionally distributing a share of their future revenue back to the original funders. It is transparent, automated, and built for scale. Just as importantly, SwiftFund addresses the biggest risk in Web3 crowdfunding—creator ghosting by securely bridging verifiable Web2 revenue data into our on-chain protocol.

## How SwiftFund Works

**1. Creator Onboarding**
Creators link their YouTube channels to the platform to open decentralized funding pools based on their channel's potential ad revenue.

**2. Community Funding**
Fans support their favorite creators by contributing funds (USDC or HBAR) directly into these pools. For the testnet demo, funding amounts are entered in USD but utilize native HBAR under the hood.

**3. Smart Contract Registration**
The Hedera Smart Contract securely records each funder's wallet address and proportional share. To protect the platform's token economy, reward tokens are not issued upfront.

**4. Yield Accrual**
As the creator generates real-world YouTube ad revenue, the smart contract automatically calculates and allocates a percentage of that revenue as yield to the original funders.

**5. Claiming Rewards**
Fans track their active allocations through their portfolio dashboard and manually claim their accrued yield directly into their Web3 wallets.

**6. Cross-Chain Onboarding**
To maximize accessibility, users from other networks (like Ethereum) can bridge their EVM assets into Hedera-native tokens using the platform's built-in cross-chain swap interface.

### For the Funder

1. **Discover & Fund:** Users browse creator projects and fund them using HBAR.
2. **Token Association:** During the funding process, users automatically associate with our native SWIND token via the Hedera Token Service (HTS) precompile.
3. **Claim Yield:** As the creator generates revenue, funders simply click "Claim Yield" on their dashboard. The smart contract calculates their exact share based on our internal ledger and deposits the HBAR directly into their wallet.

### For the Creator

1. **Raise Capital:** Creators set a funding goal and accept HBAR directly to the platform's treasury.
2. **Distribute Revenue:** Instead of dealing with complex payroll or thousands of individual micro-transactions, the creator simply deposits a lump sum of HBAR into the treasury. The smart contract handles the rest.

### Accountability & Real-Time Revenue Tracking

To make SwiftFund suitable for institutional-grade Revenue-Based Financing (RBF), we add a critical accountability layer on top of the on-chain flows:

- **Google OAuth2 Linking:** Creators securely link their YouTube channels to SwiftFund using Google OAuth2. The OAuth handshake is handled entirely server-side, and tokens are stored in HTTP-only cookies or backend storage.
- **YouTube Analytics Integration:** Once linked, SwiftFund queries the YouTube Analytics API to fetch 30-day verified estimated ad revenue and channel views for the creator's channel. These metrics are surfaced directly in the Creator Dashboard as \"Verified Metrics\".
- **Off-Chain Oracle of Accountability:** By combining on-chain yield distribution with off-chain, third-party analytics, SwiftFund effectively turns YouTube Analytics into a soft oracle. Funders can see whether a creator is generating real fiat revenue and adhering to their yield distribution timeframe before further funding or evaluating performance.

### Architectural Highlight: The "Pull" Method

Sending individual payouts to thousands of users (the "Push" method) is a well-known anti-pattern in Web3 that leads to failed transactions and drained gas. SwiftFund uses the "Pull" method. Creators deposit the yield once, and users withdraw their individual shares independently. To ensure absolute security and prevent Denial of Service (DoS) loop attacks, we hard-capped funding slots at 200 users per project, creating an exclusive, gas-optimized backing environment.

## Why Hedera?

We specifically chose to build SwiftFund on the Hedera network for four critical reasons:

- **Micro-transaction Viability:** The "Pull" yield method only works if the transaction fee to claim the yield is lower than the yield itself. Hedera's fraction-of-a-cent gas fees make micro-distributions mathematically viable.
- **Predictable, USD-Pegged Fees:** Unlike other EVM chains where network congestion causes unpredictable fee spikes, Hedera's fees are pegged to the US Dollar, ensuring a stable experience for creators and funders.
- **Native On-Chain Fiat Conversion:** We bypass centralized Web2 pricing APIs entirely. SwiftFund connects directly to the Hedera Mirror Node to fetch the official, real-time HBAR/USD exchange rate, ensuring our fiat dashboard is entirely decentralized.
- **Seamless EVM Compatibility:** We were able to write standard Solidity smart contracts and connect them to Hedera's native Token Service (HTS) via precompiles, getting the best of both EVM developer tooling and Hedera's native speed.

## Enterprise-Grade Hedera Architecture

SwiftFund is built to be an enterprise-grade, high-throughput application leveraging the unique capabilities of the Hedera network. Our architecture is designed to handle micro-transactions and yield distribution with absolute finality and near-zero gas fees.

- **The Hedera Token Service (HTS):** Unlike standard EVM chains that rely heavily on expensive ERC-20 smart contracts, SwiftFund utilizes native HTS for asset management. The $SWIND platform token is minted natively via HTS, ensuring yield distribution is executed with maximum efficiency.
- **Smart Contract Logic (HSCS):** Our backend logic is powered by the Hedera Smart Contract Service. When a user funds a creator, the contract registers their wallet. As the creator generates external revenue, the contract mathematically distributes the equivalent yield to registered wallets. *(Note: On the current Testnet deployment, funding logic utilizes native HBAR to simulate this transaction flow).*
- **Cross-Chain Interoperability:** To frictionlessly onboard users from the Ethereum ecosystem, SwiftFund is designed with cross-chain composability. Rather than building a centralized custom oracle, our mainnet architecture routes cross-chain EVM assets (like USDC) through audited bridges such as **Hashport** or **LayerZero** directly into Hedera HTS tokens.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Authentication & Wallets:** Privy (Embedded Wallets for seamless Web2-to-Web3 onboarding)
- **Off-Chain Data & Auth:** Google OAuth 2.0, YouTube Data API v3, YouTube Analytics API
- **Blockchain Interaction:** Ethers.js
- **Smart Contracts:** Solidity (Compiled and deployed via Hardhat)
- **Network:** Hedera Testnet
- **Data Layer:** Hedera Mirror Node API

## Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository

```bash
git clone https://github.com/kendacki/SwiftFund.git
cd SwiftFund
```

### 2. Configure environment variables

Create a `.env.local` file at the project root based on the following template:

```dotenv
# Hedera
NEXT_PUBLIC_HEDERA_NETWORK=testnet
HEDERA_TESTNET_ACCOUNT_ID=0.0.xxxxxx
HEDERA_TESTNET_PRIVATE_KEY=302e02...

# Optional: ECDSA key (0x...) for Hardhat / JSON-RPC deploy
# HEDERA_ECDSA_PRIVATE_KEY=0x...

# Treasury contract (Hedera 0.0.x from HashScan)
NEXT_PUBLIC_TREASURY_CONTRACT_ID=0.0.8238682
# Optional: override deployed EVM address
# NEXT_PUBLIC_TREASURY_EVM_ADDRESS=0x...

# SWIND token
NEXT_PUBLIC_SWIND_TOKEN_ID=0.0.8216024

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret

# Google / YouTube integration
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key

# Vercel Blob (profile avatars)
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
BLOB_READ_WRITE_TOKEN=

# Project approvals (header: x-approver-secret)
APPROVER_SECRET=
```

## V2 Roadmap & Monetization (Post-Hackathon)

- **Automated Protocol Fees:** Implement a 5% smart contract fee on successful raises (Success Fee) and a 5% fee on all yield redistributions (Performance Fee), with both routed to the SwiftFund DAO Treasury.
- **Basis Point (BPS) Architecture:** Upgrade the treasury contract to support dynamic fee adjustments (in basis points) controlled by decentralized governance, enabling fine-grained tuning of protocol economics over time.
- **SaucerSwap Liquidity:** Seed a liquidity pool on SaucerSwap to allow funders to trade their SWIND yield-bearing tokens on the open market, improving exit options and secondary liquidity for backers.

## Enterprise Scalability Architecture

To handle massive concurrent funding events (the "Kickstarter Hug of Death"), V2 will implement the following infrastructure:

- **Background Queues (Redis/BullMQ):** Offload heavy blockchain writes and smart contract interactions to background worker queues, ensuring the Next.js API layer remains instantly responsive even during large funding spikes.
- **Read Replicas & Edge Caching:** Use Redis as a read-optimized cache for hot project statistics and Vercel Edge Functions to serve static Creator Pages globally without repeatedly hitting the primary database.
- **Asynchronous Webhooks:** Replace blocking, synchronous UI loading states with asynchronous webhooks that notify funders as soon as their Hedera transactions are finalized, improving UX while keeping the protocol resilient under load.

## Token Generation Event (TGE) & Airdrop

SwiftFund is committed to decentralizing its ecosystem and rewarding the early believers who help us shape the future of creator monetization on Hedera. As part of our roadmap, we are officially announcing the upcoming **$SWIND Token Generation Event (TGE)**.

- **Early Adopter Airdrop:** We believe in shared value. Users who actively beta test the SwiftFund testnet, provide valuable feedback, and help promote the product will be eligible to receive $SWIND tokens via an exclusive community airdrop.
- **Secondary Markets:** Following the TGE, the $SWIND token will become publicly available for trading. Secondary users and the broader crypto community will be able to acquire $SWIND across supported Decentralized Exchanges (DEXs) and Centralized Exchanges (CEXs).

*Note: A snapshot date and official airdrop criteria will be announced closer to the mainnet launch. Stay tuned!*
