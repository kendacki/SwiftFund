/**
 * Deploy SwiftFundTreasury to Hedera Testnet.
 * Run: npx hardhat compile && node scripts/deploy.js
 * Or with tsx: npx tsx scripts/deploy.ts
 *
 * Requires in .env.local:
 * - HEDERA_ECDSA_PRIVATE_KEY or HEDERA_TESTNET_PRIVATE_KEY (0x... hex, ECDSA secp256k1)
 */
import dotenv from "dotenv";
import { readFile } from "fs/promises";
import { ethers } from "ethers";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function isLikelyEd25519DerKey(key: string): boolean {
  return /^302e020100300506032b6570/i.test(key);
}

async function main() {
  const rpcUrl = process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api";
  const pk =
    process.env.HEDERA_ECDSA_PRIVATE_KEY ||
    process.env.HEDERA_PRIVATE_KEY ||
    process.env.HEDERA_TESTNET_PRIVATE_KEY ||
    "";

  if (!pk) {
    throw new Error(
      "Missing private key. Set HEDERA_ECDSA_PRIVATE_KEY or HEDERA_TESTNET_PRIVATE_KEY in .env.local (0x... hex)."
    );
  }

  if (isLikelyEd25519DerKey(pk)) {
    throw new Error(
      "ED25519 DER keys are not supported for JSON-RPC. Use an ECDSA (secp256k1) 0x... private key and set HEDERA_ECDSA_PRIVATE_KEY."
    );
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl, {
    chainId: 296,
    name: "hedera-testnet",
  });

  const wallet = new ethers.Wallet(pk, provider);
  const deployer = await wallet.getAddress();
  const balance = await provider.getBalance(deployer);

  console.log("RPC:", rpcUrl);
  console.log("Deployer:", deployer);
  console.log("Balance (wei):", balance.toString());

  const artifactPath = join(
    rootDir,
    "artifacts/contracts/SwiftFundTreasury.sol/SwiftFundTreasury.json"
  );
  const artifactJson = await readFile(artifactPath, "utf8");
  const artifact = JSON.parse(artifactJson) as { abi: unknown[]; bytecode: string };

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("SwiftFundTreasury deployed (EVM address):", contractAddress);
  console.log("Set NEXT_PUBLIC_TREASURY_EVM_ADDRESS=" + contractAddress + " in .env.local");
  console.log("Look up this EVM address on HashScan Testnet to get 0.0.x and set NEXT_PUBLIC_TREASURY_CONTRACT_ID for Hedera SDK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
