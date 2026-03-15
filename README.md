<div align="center">
  <img src="/logo.png" alt="SwiftFund Logo" width="200" />
  <h1>SwiftFund</h1>
  <p><strong>Decentralized Crowdfunding & Automated Yield Sharing</strong></p>
</div>

<hr />

## The Vision

### A Quick Note on the Logo

Make sure to change the `<img src="/logo.png"` line at the very top to match wherever your actual logo file is stored in your project (for example, if it is in your public folder and named `swiftfund-icon.svg`, change the path to `/swiftfund-icon.svg`).

SwiftFund bridges the gap between creators and their communities. Traditional crowdfunding platforms allow users to back projects, but they rarely allow those early believers to share in the long-term financial success of the product.

We built SwiftFund to change that. By leveraging smart contracts, SwiftFund allows creators to raise capital in HBAR, while automatically and mathematically distributing a share of their future revenue back to the original funders. It is transparent, automated, and built for scale.

## How It Works

SwiftFund operates on a highly gas-efficient, two-sided marketplace model.

### For the Funder

1. **Discover & Fund:** Users browse creator projects and fund them using HBAR.
2. **Token Association:** During the funding process, users automatically associate with our native SWIND token via the Hedera Token Service (HTS) precompile.
3. **Claim Yield:** As the creator generates revenue, funders simply click "Claim Yield" on their dashboard. The smart contract calculates their exact share based on our internal ledger and deposits the HBAR directly into their wallet.

### For the Creator

1. **Raise Capital:** Creators set a funding goal and accept HBAR directly to the platform's treasury.
2. **Distribute Revenue:** Instead of dealing with complex payroll or thousands of individual micro-transactions, the creator simply deposits a lump sum of HBAR into the treasury. The smart contract handles the rest.

### Architectural Highlight: The "Pull" Method and The 200 Cap

Sending individual payouts to thousands of users (the "Push" method) is a well-known anti-pattern in Web3 that leads to failed transactions and drained gas. SwiftFund uses the "Pull" method. Creators deposit the yield once, and users withdraw their individual shares independently. To ensure absolute security and prevent Denial of Service (DoS) loop attacks, we hard-capped funding slots at 200 users per project, creating an exclusive, gas-optimized backing environment.

## Why Hedera?

We specifically chose to build SwiftFund on the Hedera network for four critical reasons:

- **Micro-transaction Viability:** The "Pull" yield method only works if the transaction fee to claim the yield is lower than the yield itself. Hedera's fraction-of-a-cent gas fees make micro-distributions mathematically viable.
- **Predictable, USD-Pegged Fees:** Unlike other EVM chains where network congestion causes unpredictable fee spikes, Hedera's fees are pegged to the US Dollar, ensuring a stable experience for creators and funders.
- **Native On-Chain Fiat Conversion:** We bypass centralized Web2 pricing APIs entirely. SwiftFund connects directly to the Hedera Mirror Node to fetch the official, real-time HBAR/USD exchange rate, ensuring our fiat dashboard is entirely decentralized.
- **Seamless EVM Compatibility:** We were able to write standard Solidity smart contracts and connect them to Hedera's native Token Service (HTS) via precompiles, getting the best of both EVM developer tooling and Hedera's native speed.

## Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Authentication & Wallets:** Privy (Embedded Wallets for seamless Web2-to-Web3 onboarding)
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
