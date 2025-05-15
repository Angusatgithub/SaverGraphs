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
  const [currentTimeframe, setCurrentTimeframe] = useState<'Monthly' | 'All'>('Monthly'); // Default to Monthly

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
          const { dates, balances } = processBalances(txByAccount, saverAccounts, currentTimeframe);
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
      const { dates, balances } = processBalances(txByAccount, saverAccounts, currentTimeframe);
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
        <Dashboard 
          accounts={accounts} 
          transactionSummary={transactionSummary} 
          balanceSummary={balanceSummary} 
          isLoading={isLoading}
        />
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
  accounts: UpAccount[],
  timeframe: 'Monthly' | 'All' // Added timeframe argument
): { dates: string[]; balances: number[] } {
  if (accounts.length === 0) {
    return { dates: [], balances: [] };
  }

  // Step 1 & 2: Calculate full history (current logic based on 90 days of transactions)
  const accountDailyBalances = new Map<string, Map<string, number>>();
  const allDatesFullHistorySet = new Set<string>();

  for (const account of accounts) {
    const transactions = txByAccount[account.id] || [];
    if (transactions.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      const map = new Map<string, number>();
      map.set(today, parseFloat(account.attributes.balance.value));
      accountDailyBalances.set(account.id, map);
      allDatesFullHistorySet.add(today);
      continue;
    }
    const sortedTx = [...transactions].sort((a, b) => new Date(b.attributes.createdAt).getTime() - new Date(a.attributes.createdAt).getTime());
    const txByDate = new Map<string, UpTransaction[]>();
    for (const tx of sortedTx) {
      const date = tx.attributes.createdAt.slice(0, 10);
      if (!txByDate.has(date)) txByDate.set(date, []);
      txByDate.get(date)!.push(tx);
      allDatesFullHistorySet.add(date);
    }
    const uniqueDates = Array.from(txByDate.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const today = new Date().toISOString().slice(0, 10);
    if (!txByDate.has(today)) {
      uniqueDates.unshift(today);
      allDatesFullHistorySet.add(today);
    }
    const dailyBalances = new Map<string, number>();
    let runningBalance = parseFloat(account.attributes.balance.value);
    for (let i = 0; i < uniqueDates.length; i++) {
      const date = uniqueDates[i];
      if (i > 0) {
        const txsOnPrevDate = txByDate.get(uniqueDates[i - 1]) || [];
        for (const tx of txsOnPrevDate) {
          runningBalance -= parseFloat(tx.attributes.amount.value);
        }
      }
      dailyBalances.set(date, parseFloat(runningBalance.toFixed(2)));
    }
    accountDailyBalances.set(account.id, dailyBalances);
  }

  const allSortedDatesFullHistory = Array.from(allDatesFullHistorySet).sort();
  const lastKnown: Record<string, number> = {};
  const aggregatedBalancesFullHistory: number[] = [];
  for (const date of allSortedDatesFullHistory) {
    let total = 0;
    for (const account of accounts) {
      const dailyBalances = accountDailyBalances.get(account.id);
      if (dailyBalances && dailyBalances.has(date)) {
        lastKnown[account.id] = dailyBalances.get(date)!;
      }
      total += lastKnown[account.id] ?? 0;
    }
    aggregatedBalancesFullHistory.push(parseFloat(total.toFixed(2)));
  }

  if (timeframe === 'All') {
    console.log('processBalances (All): dates', allSortedDatesFullHistory);
    console.log('processBalances (All): balances', aggregatedBalancesFullHistory);
    return { dates: allSortedDatesFullHistory, balances: aggregatedBalancesFullHistory };
  }

  if (timeframe === 'Monthly') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const currentMonthStartDate = new Date(year, month, 1).toISOString().slice(0, 10);
    const currentMonthEndDate = now.toISOString().slice(0, 10); // Today

    let startIndex = -1;
    let balanceOnMonthStart = 0;
    let foundBalanceForMonthStart = false;

    // Find data for the current month from the full history
    for (let i = 0; i < allSortedDatesFullHistory.length; i++) {
      const date = allSortedDatesFullHistory[i];
      if (date < currentMonthStartDate) {
        // This balance is before our month starts, could be the one to carry forward
        balanceOnMonthStart = aggregatedBalancesFullHistory[i];
        foundBalanceForMonthStart = true;
      } else if (date >= currentMonthStartDate && date <= currentMonthEndDate) {
        if (startIndex === -1) {
          startIndex = i;
          // If the first data point found is after the 1st of the month, 
          // we use the balanceOnMonthStart (last known before this month started or on 1st if available earlier in loop)
          // If allSortedDatesFullHistory[startIndex] IS currentMonthStartDate, this is fine.
          // If allSortedDatesFullHistory[startIndex] is LATER than currentMonthStartDate, we need to prepend.
        }
      }
      if (date > currentMonthEndDate && startIndex !== -1) {
        // We've passed all relevant dates for the month
        break;
      }
    }

    const monthlyDates: string[] = [];
    const monthlyBalances: number[] = [];

    if (startIndex !== -1) { // If we found any data within the month
      // Check if we need to prepend the start-of-month balance
      if (allSortedDatesFullHistory[startIndex] > currentMonthStartDate && foundBalanceForMonthStart) {
        monthlyDates.push(currentMonthStartDate);
        monthlyBalances.push(balanceOnMonthStart);
      }
      
      for (let i = startIndex; i < allSortedDatesFullHistory.length; i++) {
        if (allSortedDatesFullHistory[i] <= currentMonthEndDate) {
          monthlyDates.push(allSortedDatesFullHistory[i]);
          monthlyBalances.push(aggregatedBalancesFullHistory[i]);
        } else {
          break; // Past current month's end date
        }
      }
    } else if (foundBalanceForMonthStart) {
      // No transactions this month, but there was a balance before this month started.
      // Show this balance for the 1st of the month up to today.
      // For simplicity, just show for the 1st and for today if today is after 1st.
      monthlyDates.push(currentMonthStartDate);
      monthlyBalances.push(balanceOnMonthStart);
      if (currentMonthEndDate > currentMonthStartDate) {
         // Add today's date only if it's different from the start date and there are no other points
        if (!monthlyDates.includes(currentMonthEndDate)) { 
            monthlyDates.push(currentMonthEndDate);
            monthlyBalances.push(balanceOnMonthStart); // Balance carries forward
        }
      }
    }
    // If monthlyDates is still empty (e.g., new user, no history at all), it will return empty.

    console.log('processBalances (Monthly): dates', monthlyDates);
    console.log('processBalances (Monthly): balances', monthlyBalances);
    return { dates: monthlyDates, balances: monthlyBalances };
  }

  return { dates: [], balances: [] }; // Should not be reached if timeframe is handled
}
