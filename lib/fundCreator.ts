/**
 * Client-side funding flow: Hedera token association + SwiftFundTreasury.fundCreator.
 * Use with Privy wallet provider -> ethers Signer.
 */
import { Contract, ethers } from 'ethers';
import {
  TREASURY_EVM_ADDRESS,
  SWIFT_FUND_TREASURY_ABI,
} from '@/constants/contracts';

export const CONTRACT_ADDRESS = '0x6E87C3402B3bF3fc22c6e6908eeae5B319cf0EC9';
export const SWIND_TOKEN_ID = '0.0.8216024';
/** EVM address for HTS token 0.0.8216024 (hex of 8216024 = 0x7d5d98). */
export const SWIND_EVM_ADDRESS = '0x00000000000000000000000000000000007d5d98';

/** Hedera Token Service precompile (Hedera Testnet/Mainnet). */
const HTS_PRECOMPILE_ADDRESS = '0x0000000000000000000000000000000000000167';

const HTS_ASSOCIATE_ABI = [
  'function associateToken(address account, address token) external',
] as const;

/**
 * Associate the SWIND token with the signer's account via the HTS precompile.
 * Required before the account can receive or hold SWIND.
 */
export async function associateToken(signer: ethers.Signer): Promise<void> {
  const account = await signer.getAddress();
  const hts = new Contract(
    HTS_PRECOMPILE_ADDRESS,
    HTS_ASSOCIATE_ABI,
    signer
  );
  const tx = await hts.associateToken(account, SWIND_EVM_ADDRESS);
  await tx.wait();
}

/**
 * Call SwiftFundTreasury.fundCreator(creator) with msg.value = amountInHbar (in HBAR).
 * Amount must be a string in HBAR (e.g. "1.5"); it is converted to wei via parseEther.
 */
export async function fundCreator(
  signer: ethers.Signer,
  creatorAddress: string,
  amountInHbar: string
): Promise<{ hash: string }> {
  const treasury = new Contract(
    TREASURY_EVM_ADDRESS || CONTRACT_ADDRESS,
    SWIFT_FUND_TREASURY_ABI,
    signer
  );
  const valueWei = ethers.parseEther(amountInHbar);
  const tx = await treasury.fundCreator(creatorAddress, { value: valueWei });
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

/**
 * Call SwiftFundTreasury.depositYield() with msg.value = amountInHbar (in HBAR).
 * Used by creators to deposit revenue into the treasury so funders can receive yield.
 */
export async function depositYield(
  signer: ethers.Signer,
  amountInHbar: string
): Promise<{ hash: string }> {
  const treasury = new Contract(
    TREASURY_EVM_ADDRESS || CONTRACT_ADDRESS,
    SWIFT_FUND_TREASURY_ABI,
    signer
  );
  const valueWei = ethers.parseEther(amountInHbar);
  const tx = await treasury.depositYield({ value: valueWei });
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}

/**
 * Call SwiftFundTreasury.claimYield(creator). Used by funders to pull their share of yield.
 * Reverts with NothingToClaim if no claimable balance for (creator, msg.sender).
 */
export async function claimYield(
  signer: ethers.Signer,
  creatorAddress: string
): Promise<{ hash: string }> {
  const treasury = new Contract(
    TREASURY_EVM_ADDRESS || CONTRACT_ADDRESS,
    SWIFT_FUND_TREASURY_ABI,
    signer
  );
  const tx = await treasury.claimYield(creatorAddress);
  const receipt = await tx.wait();
  return { hash: receipt?.hash ?? tx.hash };
}
