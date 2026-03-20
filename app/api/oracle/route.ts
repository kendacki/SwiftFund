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
    // The incoming `amount` is in USD-denominated USDC units.
    // Convert USD -> HBAR before releasing, otherwise we get a 1:1 USDC->HBAR mismatch.
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

    // Fetch live HBAR/USD exchange rate (prefer Hedera mirror node).
    // If it fails, fall back to $0.10/HBAR to prevent 1:1 display/mints.
    let usdPerHbar = 0.10;
    try {
      const rateRes = await fetch(
        'https://mainnet.mirrornode.hedera.com/api/v1/network/exchangerate',
        { cache: 'no-store' }
      );
      if (rateRes.ok) {
        const rateJson = await rateRes.json();
        const current = rateJson?.current_rate;
        const cent = current?.cent_equivalent;
        const hbarEq = current?.hbar_equivalent;
        if (
          typeof cent === 'number' &&
          typeof hbarEq === 'number' &&
          hbarEq > 0
        ) {
          usdPerHbar = cent / hbarEq / 100;
        }
      }
    } catch (err) {
      console.warn('⚠️ ORACLE DEBUG: exchangerate fetch failed; using $0.10/HBAR', err);
    }

    // Hedera Hbar uses 8 decimals (tinybars). If `hbarToSend` has more than
    // 8 decimals, the SDK will throw: "Hbar in tinybars contains decimals".
    // Clamp to 8 decimals before constructing Hbar.
    const hbarToSendRaw = usdPerHbar > 0 ? amount / usdPerHbar : amount * 10;
    const hbarToSend = Number(hbarToSendRaw.toFixed(8));
    console.log(
      '💱 ORACLE DEBUG: amountUSD=',
      amount,
      'usdPerHbar=',
      usdPerHbar,
      'hbarToSendRaw=',
      hbarToSendRaw,
      'hbarToSendClamped=',
      hbarToSend
    );

    const sendTx = await new TransferTransaction()
      .addHbarTransfer(operatorId, new Hbar(-hbarToSend))
      .addHbarTransfer(destinationAddress, new Hbar(hbarToSend))
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

