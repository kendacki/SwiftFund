import { NextResponse } from 'next/server';
import { Client, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters, AccountId } from '@hashgraph/sdk';

export async function POST() {
    try {
        // 1. Securely load credentials on the server
        const myAccountId = process.env.HEDERA_TESTNET_ACCOUNT_ID;
        const privateKeyStr = process.env.HEDERA_TESTNET_PRIVATE_KEY;
        const contractId = process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID;

        if (!myAccountId || !privateKeyStr || !contractId) {
            return NextResponse.json({ error: "Missing Hedera credentials or Contract ID in environment variables." }, { status: 500 });
        }

        const myPrivateKey = PrivateKey.fromStringDer(privateKeyStr);
        const client = Client.forTestnet();
        client.setOperator(myAccountId, myPrivateKey);

        console.log("⚙️ API Route triggered: Executing Smart Contract payout...");

        // 2. Setup the Fan Array and Math (Using our 2 mock fans for the hackathon)
        const fan1EvmAddress = AccountId.fromString("0.0.111111").toSolidityAddress();
        const fan2EvmAddress = AccountId.fromString("0.0.222222").toSolidityAddress();
        const fansArray = [`0x${fan1EvmAddress}`, `0x${fan2EvmAddress}`];
        
        // Let's pass a fixed integer amount representing the $273,761 yield pool divided by 2
        const payoutPerFan = 136880; 

        // 3. Fire the Hedera SDK Contract Execution
        const contractExecTx = new ContractExecuteTransaction()
            .setContractId(contractId)
            .setGas(1500000)
            .setFunction(
                "distributeYield", 
                new ContractFunctionParameters()
                    .addAddressArray(fansArray)
                    .addUint256(payoutPerFan)
            );

        const submitExecTx = await contractExecTx.execute(client);
        const receipt = await submitExecTx.getReceipt(client);

        console.log(`🎉 SUCCESS! Smart Contract executed. Status: ${receipt.status.toString()}`);

        return NextResponse.json({ 
            success: true, 
            status: receipt.status.toString(),
            transactionId: submitExecTx.transactionId.toString()
        });

    } catch (error: any) {
        console.error("❌ Smart Contract Execution Failed:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}