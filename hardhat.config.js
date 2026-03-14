import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { defineConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainId: 31337,
    },
    hederaTestnet: {
      type: "http",
      url: process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api",
      chainId: 296,
      // NOTE: Hedera JSON-RPC (Hashio) deployment requires an ECDSA (secp256k1) private key.
      // ED25519 DER keys (HEDERA_TESTNET_PRIVATE_KEY) won't work with ethers/Hardhat JSON-RPC.
      accounts: process.env.HEDERA_ECDSA_PRIVATE_KEY
        ? [process.env.HEDERA_ECDSA_PRIVATE_KEY]
        : process.env.HEDERA_PRIVATE_KEY
          ? [process.env.HEDERA_PRIVATE_KEY]
          : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
});
