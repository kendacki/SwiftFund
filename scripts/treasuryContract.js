import {
  Client,
  PrivateKey,
  AccountId,
  TopicMessageQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  TransferTransaction,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/** Parse fan list: FAN_ACCOUNT_IDS=0.0.123,0.0.456 or FAN_EVM_ADDRESSES=0x...,0x... */
function getFanAccountIdsAndEvmAddresses() {
  const fanAccountIdsRaw = process.env.FAN_ACCOUNT_IDS || "";
  const fanEvmRaw = process.env.FAN_EVM_ADDRESSES || "";
  if (fanAccountIdsRaw) {
    const ids = fanAccountIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const accountIds = ids.map((id) => AccountId.fromString(id));
    const evmAddresses = accountIds.map((aid) => `0x${aid.toSolidityAddress()}`);
    return { accountIds, evmAddresses };
  }
  if (fanEvmRaw) {
    const addrs = fanEvmRaw.split(",").map((s) => s.trim()).filter(Boolean);
    return { accountIds: null, evmAddresses: addrs };
  }
  return { accountIds: null, evmAddresses: null };
}

async function main() {
  const myAccountId = process.env.HEDERA_TESTNET_ACCOUNT_ID;
  const myPrivateKey = PrivateKey.fromStringDer(process.env.HEDERA_TESTNET_PRIVATE_KEY);
  const agentTopicId = process.env.NEXT_PUBLIC_AGENT_TOPIC_ID;
  const contractId = process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID;
  const swindTokenId = process.env.NEXT_PUBLIC_SWIND_TOKEN_ID;

  const client = Client.forTestnet();
  client.setOperator(myAccountId, myPrivateKey);

  console.log("Waking up SwiftFund Oracle Relay...");
  console.log(`Listening to AI Agent Oracle on Topic: ${agentTopicId}`);

  if (!contractId) {
    console.log("WAITING: Deploy the Solidity contract (npm run deploy:treasury) and set NEXT_PUBLIC_TREASURY_CONTRACT_ID in .env.local");
    return;
  }

  const { accountIds: fanAccountIds, evmAddresses: fanEvmAddresses } = getFanAccountIdsAndEvmAddresses();
  if (!fanEvmAddresses?.length) {
    console.log("Set FAN_ACCOUNT_IDS (e.g. 0.0.123,0.0.456) or FAN_EVM_ADDRESSES in .env.local for payouts.");
  }

  new TopicMessageQuery()
    .setTopicId(agentTopicId)
    .setStartTime(0)
    .subscribe(
      client,
      (error) => console.error("Error reading HCS Topic:", error),
      async (message) => {
        const dataString = Buffer.from(message.contents).toString("utf8");
        try {
          const revenueData = JSON.parse(dataString);
          if (revenueData.estimatedRevenueUSD) {
            console.log(`\nVerified Data Received. Video: ${revenueData.videoId} | Revenue: $${revenueData.estimatedRevenueUSD}`);
            await executeSmartContractPayout(revenueData, contractId, swindTokenId, myAccountId, client);
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      }
    );
}

async function executeSmartContractPayout(oracleData, contractId, swindTokenId, operatorAccountId, client) {
  const totalRevenue = parseFloat(oracleData.estimatedRevenueUSD);
  const fanYieldPool = totalRevenue * 0.2;

  const { accountIds: fanAccountIds, evmAddresses: fanEvmAddresses } = getFanAccountIdsAndEvmAddresses();
  const fansArray = fanEvmAddresses && fanEvmAddresses.length > 0
    ? fanEvmAddresses
    : ["0x0000000000000000000000000000000000000001", "0x0000000000000000000000000000000000000002"];

  const amountPerFanWei = process.env.TREASURY_AMOUNT_PER_FAN_WEI || "1000000000000000";
  const payoutPerFanWei = BigInt(amountPerFanWei);

  console.log(`\nCalling Solidity Contract (${contractId}) distributeYield(${fansArray.length} fans, ${payoutPerFanWei} wei each)...`);

  try {
    const contractExecTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1500000)
      .setFunction(
        "distributeYield",
        new ContractFunctionParameters()
          .addAddressArray(fansArray)
          .addUint256(payoutPerFanWei)
      );

    const submitExecTx = await contractExecTx.execute(client);
    const receipt = await submitExecTx.getReceipt(client);
    console.log(`Treasury contract status: ${receipt.status.toString()}`);
  } catch (error) {
    console.error("Smart Contract Execution Failed:", error.message);
  }

  if (swindTokenId && fanAccountIds?.length > 0) {
    const amountPerFanSwind = Number(process.env.SWIND_AMOUNT_PER_FAN || "100");
    const totalSwind = amountPerFanSwind * fanAccountIds.length;
    const senderId = typeof operatorAccountId === "string" ? AccountId.fromString(operatorAccountId) : operatorAccountId;
    console.log(`\nSending SWIND (${amountPerFanSwind} each) to ${fanAccountIds.length} fans via HTS...`);

    try {
      let tx = new TransferTransaction()
        .addTokenTransfer(swindTokenId, senderId, -totalSwind);
      fanAccountIds.forEach((aid) => { tx = tx.addTokenTransfer(swindTokenId, aid, amountPerFanSwind); });

      const myPrivateKey = PrivateKey.fromStringDer(process.env.HEDERA_TESTNET_PRIVATE_KEY);
      const signed = await tx.freezeWith(client).sign(myPrivateKey);
      const exec = await signed.execute(client);
      const rx = await exec.getReceipt(client);
      console.log(`SWIND airdrop status: ${rx.status.toString()}`);
    } catch (error) {
      console.error("SWIND airdrop failed:", error.message);
    }
  }

  console.log("\nPayout cycle complete.");
  setTimeout(() => process.exit(0), 2000);
}

main().catch(console.error);