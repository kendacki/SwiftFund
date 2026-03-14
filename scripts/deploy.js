import dotenv from "dotenv";
import { readFile } from "fs/promises";
import { ethers } from "ethers";

dotenv.config({ path: ".env.local" });

function isLikelyEd25519DerKey(key) {
  // Your ED25519 DER looks like: 302e020100300506032b6570...
  return typeof key === "string" && /^302e020100300506032b6570/i.test(key);
}

async function main() {
  const rpcUrl = process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api";

  // Hedera JSON-RPC deployment requires ECDSA (secp256k1) private key in 0x... hex format.
  const pk =
    process.env.HEDERA_ECDSA_PRIVATE_KEY ||
    process.env.HEDERA_PRIVATE_KEY ||
    process.env.HEDERA_TESTNET_PRIVATE_KEY ||
    "";

  if (!pk) {
    throw new Error(
      "Missing private key. Set HEDERA_ECDSA_PRIVATE_KEY (recommended) in .env.local (0x... hex)."
    );
  }

  if (isLikelyEd25519DerKey(pk)) {
    throw new Error(
      "HEDERA_TESTNET_PRIVATE_KEY appears to be an ED25519 DER key. Ethers/JSON-RPC deployment requires an ECDSA (secp256k1) 0x... private key. Create an ECDSA account in the Hedera Portal and set HEDERA_ECDSA_PRIVATE_KEY."
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

  const artifactPath =
    "./artifacts/contracts/SwiftFundTreasury.sol/SwiftFundTreasury.json";
  const artifactJson = await readFile(artifactPath, "utf8");
  const artifact = JSON.parse(artifactJson);

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("SwiftFundTreasury deployed (EVM address):", contractAddress);
  console.log(
    "On Hedera: look up this EVM address on HashScan Testnet to get the 0.0.x contract ID, then set NEXT_PUBLIC_TREASURY_CONTRACT_ID in .env.local."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

