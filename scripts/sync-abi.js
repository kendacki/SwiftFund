/**
 * Sync ABI from Hardhat artifact to constants/contracts.ts.
 * Run after: npx hardhat compile
 */
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const artifactPath = join(root, "artifacts/contracts/SwiftFundTreasury.sol/SwiftFundTreasury.json");
const outPath = join(root, "constants/contracts.ts");

const DEPLOYED_EVM_ADDRESS = "0x87Cd9fEeC4962609C1fA4e81058010432b5B5F8F";
const DEPLOYED_CONTRACT_ID = "0.0.8238056";

async function main() {
  const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
  const abi = artifact.abi;

  const content = `/** ABI synced from artifacts by scripts/sync-abi.js. */
export const DEPLOYED_TREASURY_CONTRACT_ID = '${DEPLOYED_CONTRACT_ID}';

export const TREASURY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID ?? DEPLOYED_TREASURY_CONTRACT_ID;

export const DEPLOYED_TREASURY_EVM_ADDRESS = '${DEPLOYED_EVM_ADDRESS}';

export const TREASURY_EVM_ADDRESS =
  process.env.NEXT_PUBLIC_TREASURY_EVM_ADDRESS ?? DEPLOYED_TREASURY_EVM_ADDRESS;

export const SWIFT_FUND_TREASURY_ABI = ${JSON.stringify(abi, null, 2)} as const;
`;

  await writeFile(outPath, content, "utf8");
  console.log("Updated constants/contracts.ts with ABI from", artifactPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
