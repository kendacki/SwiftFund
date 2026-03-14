import { Client, PrivateKey, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    // 1. Connect to Hedera
    const myAccountId = process.env.HEDERA_TESTNET_ACCOUNT_ID;
    const myPrivateKey = PrivateKey.fromStringDer(process.env.HEDERA_TESTNET_PRIVATE_KEY);
    const agentTopicId = process.env.NEXT_PUBLIC_AGENT_TOPIC_ID;
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;

    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    // Example YouTube video to track
    const targetVideoId = "0e3GPea1Tyg"; 
    
    console.log(`Waking up SwiftFund AI Agent...`);
    console.log(`Reaching out to YouTube API for Video ID: ${targetVideoId}...`);

    // 2. The REAL Brain: Fetching live data from YouTube
    const youtubeUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${targetVideoId}&key=${youtubeApiKey}`;
    
    try {
        const response = await fetch(youtubeUrl);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            throw new Error("Video not found or API key is invalid.");
        }

        // Extract the exact, real-time view count
        const realViews = parseInt(data.items[0].statistics.viewCount, 10);
        
        // Calculate estimated revenue (Assuming a $1.50 CPM for this hackathon model)
        const estimatedRevenue = (realViews / 1000) * 1.50;

        const oracleData = {
            platform: "YouTube",
            videoId: targetVideoId,
            realTimeViews: realViews,
            estimatedRevenueUSD: estimatedRevenue.toFixed(2),
            timestamp: new Date().toISOString()
        };

        console.log(`Live data secured. Views: ${oracleData.realTimeViews.toLocaleString()} | Est. Revenue: $${oracleData.estimatedRevenueUSD.toLocaleString()}`);
        console.log(`Anchoring real oracle data to HCS Topic: ${agentTopicId}...`);

        // 3. Log the transparent data to the Hedera blockchain
        let submitMsgTx = await new TopicMessageSubmitTransaction({
            topicId: agentTopicId,
            message: JSON.stringify(oracleData)
        }).execute(client);

        await submitMsgTx.getReceipt(client);

        console.log(`SUCCESS. Live API data is permanently anchored to the Hashgraph.`);
        
    } catch (error) {
        console.error("Agent encountered an error fetching YouTube data:", error.message);
    }
}

main().catch(console.error);