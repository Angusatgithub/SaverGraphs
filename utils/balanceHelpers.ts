import { UpAccount, UpTransaction } from '../app/services/upApi';
import { TimeframeOption } from '../components/TimeframeSelectionModal';

export interface BalanceSummary {
  dates: string[];
  balances: number[];
  dailyBalances: Map<string, number>; // For individual account daily balances if needed later
}

export function processBalances(
  accounts: UpAccount[],
  transactionsByAccountId: Record<string, UpTransaction[]>,
  timeframe: TimeframeOption,
  selectedAccountIds: string[]
): BalanceSummary {
  console.log('Processing balances for:', timeframe, selectedAccountIds);
  // TODO: Implement the actual balance processing logic based on Story 3.0 and 4.9
  // This includes aggregating balances from selected accounts for the specified timeframe.
  // For now, returning empty data to satisfy type checks.
  
  // The logic from previous app/index.tsx for Story 3.0 and 4.9 needs to be migrated here.
  // It involves:
  // 1. Filtering accounts and transactions based on selectedAccountIds.
  // 2. Calculating daily balances for each selected account.
  // 3. Aggregating these daily balances.
  // 4. Filtering the aggregated balances based on the timeframe (Weekly, Monthly, Yearly).

  const allDatesSet = new Set<string>();
  const aggregatedDailyBalances = new Map<string, number>();

  if (selectedAccountIds.length === 0 || accounts.length === 0) {
    return { dates: [], balances: [], dailyBalances: new Map() };
  }

  const accountsToProcess = accounts.filter(acc => selectedAccountIds.includes(acc.id));

  // Step 1: Calculate daily balances for each selected account and collect all relevant dates
  for (const account of accountsToProcess) {
    const currentAccountTransactions = transactionsByAccountId[account.id] || [];
    if (currentAccountTransactions.length === 0) {
      // If no transactions, consider current balance for today
      const today = new Date().toISOString().slice(0, 10);
      allDatesSet.add(today);
      const currentBalance = parseFloat(account.attributes.balance.value);
      aggregatedDailyBalances.set(today, (aggregatedDailyBalances.get(today) || 0) + currentBalance);
      // This simple handling might not be enough; true carry-forward logic is complex
      continue;
    }

    // Sort transactions: oldest to newest for balance accumulation
    const sortedTx = [...currentAccountTransactions].sort((a, b) => new Date(a.attributes.createdAt).getTime() - new Date(b.attributes.createdAt).getTime());

    for (const tx of sortedTx) {
      const date = tx.attributes.createdAt.slice(0, 10);
      allDatesSet.add(date);
      if (tx.attributes.balanceAfter) {
        // This is tricky because balanceAfter is per-transaction, not per-day aggregate for *this* account.
        // For simplicity here, we are just collecting dates. The true aggregation logic is complex.
        // A more robust approach would be to reconstruct daily balances for each account first.
      }
    }
  }
  
  // For now, let's just return some dummy data based on collected dates
  const sortedDates = Array.from(allDatesSet).sort();
  const balances: number[] = sortedDates.map(() => Math.random() * 1000); // Dummy balances

  // This is a placeholder. The real logic needs to be implemented as per Story 3.0 and Story 4.9 for Monthly/Weekly/Yearly views.
  if (timeframe === 'Monthly') {
    // Placeholder filtering for monthly
    const now = new Date();
    const currentMonthString = now.toISOString().slice(0, 7); // YYYY-MM
    const monthlyDates: string[] = [];
    const monthlyBalances: number[] = [];
    for (let i = 0; i < sortedDates.length; i++) {
        if (sortedDates[i].startsWith(currentMonthString)) {
            monthlyDates.push(sortedDates[i]);
            monthlyBalances.push(balances[i]);
        }
    }
    return { dates: monthlyDates, balances: monthlyBalances, dailyBalances: new Map() };
  }

  return {
    dates: sortedDates,
    balances: balances,
    dailyBalances: new Map(), // Placeholder
  };
} 