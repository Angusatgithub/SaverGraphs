import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ApiKeyInput from './components/ApiKeyInput';
import DebugPanel from './components/DebugPanel';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';
import Dashboard from './dashboard';
import { getStoredApiKey, storeApiKey } from './services/storage';
import { fetchAccounts, fetchRecentTransactions, UpAccount, UpApiError, UpTransaction, validateApiKey } from './services/upApi';

export default function App() {
  const [isLoading, setIsLoading] = useState(true); // Start loading immediately
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [accounts, setAccounts] = useState<UpAccount[] | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<Record<string, number>>({});
  const [balanceSummary, setBalanceSummary] = useState<{ dates: string[]; balances: number[] }>({ dates: [], balances: [] });

  // On mount, check for stored API key
  useEffect(() => {
    const checkStoredKey = async () => {
      try {
        const storedKey = await getStoredApiKey();
        if (storedKey) {
          await validateApiKey(storedKey);
          setApiKey(storedKey);
          const fetchedAccounts = await fetchAccounts(storedKey);
          const saverAccounts = fetchedAccounts.filter(
            (acct) => acct.attributes.accountType === 'SAVER'
          );
          setAccounts(saverAccounts);
          // Fetch transactions for each account
          const summary: Record<string, number> = {};
          const txByAccount: Record<string, UpTransaction[]> = {};
          for (const acct of saverAccounts) {
            const txns = await fetchRecentTransactions(storedKey, acct.id);
            summary[acct.id] = txns.length;
            txByAccount[acct.id] = txns;
            if (txns.length > 0) {
              console.log(`First transaction for account ${acct.id}:`, JSON.stringify(txns[0], null, 2));
            } else {
              console.log(`No transactions for account ${acct.id}`);
            }
          }
          // Process all transactions for balance summary
          setTransactionSummary(summary);
          const { dates, balances } = processBalances(txByAccount, saverAccounts);
          setBalanceSummary({ dates, balances });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // If invalid or error, just show input (do not set error here)
      } finally {
        setIsLoading(false);
      }
    };
    checkStoredKey();
  }, []);

  const handleApiKeySubmit = async (inputKey: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await validateApiKey(inputKey); // If this doesn't throw, it's valid
      await storeApiKey(inputKey);
      setSuccess('API key validated successfully!');
      setApiKey(inputKey);
      const fetchedAccounts = await fetchAccounts(inputKey);
      const saverAccounts = fetchedAccounts.filter(
        (acct) => acct.attributes.accountType === 'SAVER'
      );
      setAccounts(saverAccounts);
      // Fetch transactions for each account
      const summary: Record<string, number> = {};
      const txByAccount: Record<string, UpTransaction[]> = {};
      for (const acct of saverAccounts) {
        const txns = await fetchRecentTransactions(inputKey, acct.id);
        summary[acct.id] = txns.length;
        txByAccount[acct.id] = txns;
        if (txns.length > 0) {
          console.log(`First transaction for account ${acct.id}:`, JSON.stringify(txns[0], null, 2));
        } else {
          console.log(`No transactions for account ${acct.id}`);
        }
      }
      setTransactionSummary(summary);
      const { dates, balances } = processBalances(txByAccount, saverAccounts);
      setBalanceSummary({ dates, balances });
    } catch (err) {
      if (err instanceof UpApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // After success animation, show dashboard if accounts are loaded
  const handleSuccessComplete = () => {
    // No navigation, just show dashboard in place
  };

  return (
    <View style={styles.container}>
      <ErrorMessage message={error} />
      <SuccessMessage message={success} onComplete={handleSuccessComplete} />
      {accounts ? (
        <Dashboard accounts={accounts} transactionSummary={transactionSummary} balanceSummary={balanceSummary} />
      ) : (
        !isLoading && <ApiKeyInput onSubmit={handleApiKeySubmit} isLoading={isLoading} />
      )}
      <DebugPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
});

// Helper to process balances
function processBalances(
  txByAccount: Record<string, UpTransaction[]>,
  accounts: UpAccount[]
): { dates: string[]; balances: number[] } {
  if (accounts.length === 0) {
    return { dates: [], balances: [] };
  }

  // Step 1: For each account, reconstruct daily balances by walking backward from current balance
  const accountDailyBalances = new Map<string, Map<string, number>>();
  const allDates = new Set<string>();

  for (const account of accounts) {
    const transactions = txByAccount[account.id] || [];
    if (transactions.length === 0) {
      // If no transactions, just use current balance for today
      const today = new Date().toISOString().slice(0, 10);
      const map = new Map<string, number>();
      map.set(today, parseFloat(account.attributes.balance.value));
      accountDailyBalances.set(account.id, map);
      allDates.add(today);
      continue;
    }
    // Sort transactions in reverse chronological order (latest first)
    const sortedTx = [...transactions].sort((a, b) => new Date(b.attributes.createdAt).getTime() - new Date(a.attributes.createdAt).getTime());
    // Group transactions by date (YYYY-MM-DD)
    const txByDate = new Map<string, UpTransaction[]>();
    for (const tx of sortedTx) {
      const date = tx.attributes.createdAt.slice(0, 10);
      if (!txByDate.has(date)) txByDate.set(date, []);
      txByDate.get(date)!.push(tx);
      allDates.add(date);
    }
    // Get all unique dates, sorted reverse chronologically
    const uniqueDates = Array.from(txByDate.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    // Add today if not present
    const today = new Date().toISOString().slice(0, 10);
    if (!txByDate.has(today)) {
      uniqueDates.unshift(today);
      allDates.add(today);
    }
    // Reconstruct balances
    const dailyBalances = new Map<string, number>();
    let runningBalance = parseFloat(account.attributes.balance.value);
    for (let i = 0; i < uniqueDates.length; i++) {
      const date = uniqueDates[i];
      if (i > 0) {
        // For previous day, add back all transactions from the current day
        const txs = txByDate.get(uniqueDates[i - 1]) || [];
        for (const tx of txs) {
          // Add back the transaction amount (reverse the effect)
          runningBalance -= parseFloat(tx.attributes.amount.value);
        }
      }
      dailyBalances.set(date, parseFloat(runningBalance.toFixed(2)));
    }
    accountDailyBalances.set(account.id, dailyBalances);
  }

  // Step 2: Aggregate across accounts for each date, carrying forward balances
  const allSortedDates = Array.from(allDates).sort();
  const lastKnown: Record<string, number> = {};
  const aggregatedBalances: number[] = [];
  for (const date of allSortedDates) {
    let total = 0;
    for (const account of accounts) {
      const dailyBalances = accountDailyBalances.get(account.id);
      if (dailyBalances && dailyBalances.has(date)) {
        lastKnown[account.id] = dailyBalances.get(date)!;
      }
      // Use last known balance, or 0 if none
      total += lastKnown[account.id] ?? 0;
    }
    aggregatedBalances.push(parseFloat(total.toFixed(2)));
  }
  // Debug log
  console.log('processBalances: dates', allSortedDates);
  console.log('processBalances: balances', aggregatedBalances);
  return { dates: allSortedDates, balances: aggregatedBalances };
}
