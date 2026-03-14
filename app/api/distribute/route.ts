import { NextResponse } from 'next/server';
import { Client, PrivateKey, ContractExecuteTransaction, ContractFunctionParameters, AccountId } from '@hashgraph/sdk';
import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function POST(req: Request) {
  try {
    // 1. Verify the caller using Privy access token
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verifiedClaims = await privy.verifyAuthToken(authToken);
    console.log('Verified User ID:', verifiedClaims.userId);

    // 2. Securely load Hedera credentials on the server
    const myAccountId = process.env.HEDERA_TESTNET_ACCOUNT_ID;
    const privateKeyStr = process.env.HEDERA_TESTNET_PRIVATE_KEY;
    const contractId = process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID;

    if (!myAccountId || !privateKeyStr || !contractId) {
      return NextResponse.json(
        { error: 'Missing Hedera credentials or Contract ID in environment variables.' },
        { status: 500 }
      );
    }

    const myPrivateKey = PrivateKey.fromStringDer(privateKeyStr);
    const client = Client.forTestnet();
    client.setOperator(myAccountId, myPrivateKey);

    console.log('API Route triggered: executing smart contract payout...');

    // 3. Setup the fan array and math (currently using 2 mock fans)
    const fan1EvmAddress = AccountId.fromString('0.0.111111').toSolidityAddress();
    const fan2EvmAddress = AccountId.fromString('0.0.222222').toSolidityAddress();
    const fansArray = [`0x${fan1EvmAddress}`, `0x${fan2EvmAddress}`];

    // Fixed integer amount for demo purposes
    const payoutPerFan = 136880;

    // 4. Execute the Hedera contract
    const contractExecTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1500000)
      .setFunction(
        'distributeYield',
        new ContractFunctionParameters()
          .addAddressArray(fansArray)
          .addUint256(payoutPerFan)
      );

    const submitExecTx = await contractExecTx.execute(client);
    const receipt = await submitExecTx.getReceipt(client);

    console.log(`Smart contract executed. Status: ${receipt.status.toString()}`);

    return NextResponse.json({
      success: true,
      status: receipt.status.toString(),
      transactionId: submitExecTx.transactionId.toString(),
    });
  } catch (error: any) {
    console.error('Smart contract execution or verification failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}