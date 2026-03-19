import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { AccountId, Client, Hbar, PrivateKey, TransferTransaction } from '@hashgraph/sdk';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { evmTxHash, destinationAddress, amount: amountRaw } =
      (await req.json()) as {
        evmTxHash?: string;
        destinationAddress?: string;
        amount?: number | string;
      };

    if (!evmTxHash || !destinationAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const amount = typeof amountRaw === 'string' ? Number(amountRaw) : amountRaw;
    if (!Number.isFinite(amount) || (amount ?? 0) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // 1) ORACLE VERIFICATION (EVM SIDE)
    const rpcUrl = process.env.EVM_RPC_URL?.trim();
    if (!rpcUrl) {
      return NextResponse.json({ error: 'EVM_RPC_URL is not set' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Fetch both the receipt (for status) and the tx data (for the 'to' address)
    const [receipt, tx] = await Promise.all([
      provider.getTransactionReceipt(evmTxHash),
      provider.getTransaction(evmTxHash),
    ]);

    if (!receipt || receipt.status !== 1) {
      return NextResponse.json(
        { error: 'EVM Transaction failed or not found' },
        { status: 400 }
      );
    }

    // Verify the transaction was sent to our official USDC contract
    const officialUsdcAddress = process.env.TESTNET_USDC_ADDRESS?.trim();
    if (!officialUsdcAddress) {
      return NextResponse.json(
        { error: 'TESTNET_USDC_ADDRESS is not set' },
        { status: 500 }
      );
    }

    if (!tx || tx.to?.toLowerCase() !== officialUsdcAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Invalid contract interaction. Not official USDC.' },
        { status: 400 }
      );
    }

    // *Production Note: Parse logs to validate recipient + exact amount.*

    // 2) HEDERA EXECUTION (RELEASE FUNDS)
    const operatorId =
      process.env.HEDERA_OPERATOR_ID?.trim() ||
      process.env.HEDERA_TESTNET_ACCOUNT_ID?.trim() ||
      '';
    const operatorKey =
      process.env.HEDERA_OPERATOR_KEY?.trim() ||
      process.env.HEDERA_TESTNET_PRIVATE_KEY?.trim() ||
      '';

    if (!operatorId || !operatorKey) {
      return NextResponse.json(
        { error: 'Missing Hedera operator credentials' },
        { status: 500 }
      );
    }

    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(operatorId),
      PrivateKey.fromString(operatorKey)
    );

    const sendTx = await new TransferTransaction()
      .addHbarTransfer(operatorId, new Hbar(-amount))
      .addHbarTransfer(destinationAddress, new Hbar(amount))
      .execute(client);

    const receiptHedera = await sendTx.getReceipt(client);
    if (receiptHedera.status.toString() !== 'SUCCESS') {
      throw new Error('Hedera transfer failed');
    }

    return NextResponse.json({
      success: true,
      message: 'Cross-chain swap executed successfully',
      hederaTxId: sendTx.transactionId.toString(),
    });
  } catch (error: any) {
    console.error('Oracle Error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Oracle error' },
      { status: 500 }
    );
  }
}

