import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const id = process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID;
if (id) {
  console.log("NEXT_PUBLIC_TREASURY_CONTRACT_ID=" + id);
} else {
  console.log("NEXT_PUBLIC_TREASURY_CONTRACT_ID is not set.");
  console.log("Run: npm run deploy:treasury");
  console.log("Then set NEXT_PUBLIC_TREASURY_CONTRACT_ID in .env.local to the contract ID (0.0.xxxxx from HashScan if using Hedera SDK).");
}
