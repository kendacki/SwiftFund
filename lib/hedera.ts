import {
  AccountId,
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  PrivateKey,
} from '@hashgraph/sdk';
import { TREASURY_CONTRACT_ID } from '@/constants/contracts';

let hederaClient: Client | null = null;

function getHederaClient(): Client {
  if (hederaClient) return hederaClient;

  const accountId = process.env.HEDERA_TESTNET_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_TESTNET_PRIVATE_KEY;

  if (!accountId || !privateKeyStr) {
    throw new Error(
      'HEDERA_TESTNET_ACCOUNT_ID or HEDERA_TESTNET_PRIVATE_KEY is not set.'
    );
  }

  const operatorKey = PrivateKey.fromStringDer(privateKeyStr);
  const client = Client.forTestnet();
  client.setOperator(accountId, operatorKey);

  hederaClient = client;
  return client;
}

export async function executeDistribution(amountPerFan: number) {
  if (!TREASURY_CONTRACT_ID) {
    throw new Error('NEXT_PUBLIC_TREASURY_CONTRACT_ID is not set.');
  }

  const client = getHederaClient();

  // For now, use two mock fan accounts as in the prototype.
  const fan1EvmAddress = AccountId.fromString('0.0.111111').toSolidityAddress();
  const fan2EvmAddress = AccountId.fromString('0.0.222222').toSolidityAddress();
  const fansArray = [`0x${fan1EvmAddress}`, `0x${fan2EvmAddress}`];

  const tx = new ContractExecuteTransaction()
    .setContractId(TREASURY_CONTRACT_ID)
    .setGas(1_500_000)
    .setFunction(
      'distributeYield',
      new ContractFunctionParameters()
        .addAddressArray(fansArray)
        .addUint256(amountPerFan)
    );

  const submitExecTx = await tx.execute(client);
  const receipt = await submitExecTx.getReceipt(client);
  const statusStr = receipt.status.toString();

  if (statusStr === 'CONTRACT_REVERT_EXECUTED' || statusStr.includes('REVERT')) {
    throw new Error('CONTRACT_REVERT_EXECUTED');
  }

  return {
    status: statusStr,
    transactionId: submitExecTx.transactionId.toString(),
  };
}

export async function fundProject(projectId: string, amountUsd: number) {
  // Prototype implementation: route funding through the existing
  // distribution helper while the dedicated fundProject contract
  // method is being finalized.
  const amountPerFan = amountUsd;
  return executeDistribution(amountPerFan);
}

