import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    // 1. Grab your exact credentials
    const myAccountId = process.env.HEDERA_TESTNET_ACCOUNT_ID;
    const myPrivateKey = PrivateKey.fromStringDer(process.env.HEDERA_TESTNET_PRIVATE_KEY);

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    console.log("Registering SwiftFund AI Agent on Hedera...");

    // 2. Create a new HCS Topic (This acts as your Agent's Universal Agent ID)
    let txResponse = await new TopicCreateTransaction().execute(client);
    let receipt = await txResponse.getReceipt(client);
    let agentTopicId = receipt.topicId;
    
    console.log(`AI Agent identity created. Topic ID (UAID): ${agentTopicId}`);

    // 3. Publish the AgentFacts metadata to the blockchain
    const agentMetadata = {
        name: "SwiftFund Oracle Agent",
        type: "ERC-8004 / HCS-14",
        protocols: ["YouTube API", "Rumble API"],
        task: "Fetch ad revenue and view count to trigger SWIND token payouts",
        owner: myAccountId,
        registry: "hol.org/registry"
    };

    console.log("Anchoring agent profile to the Hashgraph...");
    
    let submitMsgTx = await new TopicMessageSubmitTransaction({
        topicId: agentTopicId,
        message: JSON.stringify(agentMetadata)
    }).execute(client);

    await submitMsgTx.getReceipt(client);

    console.log(`SUCCESS. Agent is fully registered and immutable.`);
}

main().catch(console.error);