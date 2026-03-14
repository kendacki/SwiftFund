import {
  Client,
  AccountId,
  PrivateKey,
  ContractCreateFlow,
} from "@hashgraph/sdk";
import { readFile } from "fs/promises";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  const accountIdStr = process.env.HEDERA_TESTNET_ACCOUNT_ID;
  const privKeyStr = process.env.HEDERA_TESTNET_PRIVATE_KEY;

  if (!accountIdStr || !privKeyStr) {
    console.error("Missing HEDERA_TESTNET_ACCOUNT_ID or HEDERA_TESTNET_PRIVATE_KEY in .env.local");
    process.exit(1);
  }

  const accountId = AccountId.fromString(accountIdStr);
  const privateKey = PrivateKey.fromStringDer(privKeyStr);

  const client = Client.forTestnet();
  client.setOperator(accountId, privateKey);

  console.log("Deploying SwiftFundTreasury via Hedera SDK (HSCS)...");
  console.log("Deployer account:", accountId.toString());

  const artifactPath =
    "./artifacts/contracts/SwiftFundTreasury.sol/SwiftFundTreasury.json";
  const artifactJson = await readFile(artifactPath, "utf8");
  const artifact = JSON.parse(artifactJson);
  const bytecodeHex = artifact.bytecode;

  if (!bytecodeHex || bytecodeHex === "0x") {
    console.error("Bytecode not found in artifact");
    process.exit(1);
  }

  const hexClean = bytecodeHex.startsWith("0x") ? bytecodeHex.slice(2) : bytecodeHex;
  console.log("Bytecode size:", hexClean.length / 2, "bytes");

  const flow = new ContractCreateFlow()
    .setBytecode(hexClean)
    .setGas(2_000_000)
    .setAdminKey(privateKey);

  const contractSubmit = await flow.execute(client);
  const contractReceipt = await contractSubmit.getReceipt(client);
  const contractId = contractReceipt.contractId;

  console.log("SwiftFundTreasury deployed.");
  console.log("Hedera contract ID:", contractId.toString());
  console.log("EVM address:", "0x" + contractId.toSolidityAddress());
  console.log(
    "Set NEXT_PUBLIC_TREASURY_CONTRACT_ID in .env.local to",
    contractId.toString()
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

