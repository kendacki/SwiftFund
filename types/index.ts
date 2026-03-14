export interface User {
  id: string;
  walletAddress?: string;
  email?: string | null;
}

export type TransactionState = 'idle' | 'pending' | 'success' | 'error';

export interface TransactionStatus {
  state: TransactionState;
  message?: string;
  transactionId?: string;
}

export interface OracleData {
  platform: string;
  videoId: string;
  realTimeViews: number;
  estimatedRevenueUSD: number;
  timestamp: string;
}

