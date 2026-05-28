export interface IDasLevyBalancePayload {
  accountId: string | null;
  balance: string | null;
  currency: string | null;
  raw: Record<string, unknown>;
}
