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

    // 1. ORACLE VERIFICATION (EVM SIDE)
    // Hardcoding the Sepolia public node to guarantee we are searching the correct blockchain
    const provider = new ethers.JsonRpcProvider(
      'https://ethereum-sepolia-rpc.publicnode.com'
    );

    console.log('🔍 ORACLE DEBUG: Pinging Sepolia for TxHash:', evmTxHash);

    // Fetch both the receipt (for status) and the tx data (for the 'to' address)
    const [receipt, tx] = await Promise.all([
      provider.getTransactionReceipt(evmTxHash),
      provider.getTransaction(evmTxHash),
    ]);

    if (!receipt) {
      console.log(
        '❌ ORACLE DEBUG: Receipt is completely null. RPC cannot find this hash.'
      );
      return NextResponse.json(
        { error: 'EVM Transaction not found on Sepolia network.' },
        { status: 400 }
      );
    }

    if (receipt.status !== 1) {
      console.log(
        '❌ ORACLE DEBUG: Transaction found, but it REVERTED (Failed) on-chain.'
      );
      return NextResponse.json(
        { error: 'EVM Transaction reverted/failed on-chain.' },
        { status: 400 }
      );
    }

    console.log('✅ ORACLE DEBUG: EVM Transaction Verified successfully!');

    // Verify the transaction was sent to our official USDC contract
    const officialUsdcAddress = (
      process.env.NEXT_PUBLIC_TESTNET_USDC_ADDRESS ||
      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'
    ).toLowerCase();
    if (!tx || tx.to?.toLowerCase() !== officialUsdcAddress) {
      console.log(
        '❌ ORACLE DEBUG: Contract mismatch. Expected:',
        officialUsdcAddress,
        'Got:',
        tx?.to
      );
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

