import {
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
} from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
    // 1. Grab your Hedera testnet credentials from the .env.local file
    const myAccountId = process.env.HEDERA_TESTNET_ACCOUNT_ID;
    const myPrivateKey = PrivateKey.fromStringDer(process.env.HEDERA_TESTNET_PRIVATE_KEY);
    // 2. Connect to the Hedera Testnet
    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    console.log("Connecting to Hedera Testnet...");

    // 3. Create the SWIND Token using the Hedera Token Service (HTS)
    let tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName("SwiftFund Token")
        .setTokenSymbol("SWIND")
        .setTokenType(TokenType.FungibleCommon)
        .setDecimals(2)
        .setInitialSupply(1000000) // 1 Million initial SWIND tokens
        .setTreasuryAccountId(myAccountId)
        .setSupplyKey(myPrivateKey) // Allows you to mint more later if needed
        .freezeWith(client);

    // 4. Sign and submit the transaction
    let tokenCreateSign = await tokenCreateTx.sign(myPrivateKey);
    let tokenCreateSubmit = await tokenCreateSign.execute(client);

    // 5. Get the receipt and log the new Token ID!
    let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
    let tokenId = tokenCreateRx.tokenId;

    console.log(`SUCCESS. The SWIND token was created.`);
    console.log(`Your token ID is: ${tokenId}`);
}

main().catch((err) => console.error(err));