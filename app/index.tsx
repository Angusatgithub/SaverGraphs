import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Timeframe } from '../components/TimeframeSelectionModal'; // Import Timeframe type
import ApiKeyInput from './components/ApiKeyInput';
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
  const [allTransactions, setAllTransactions] = useState<Record<string, UpTransaction[]>>({}); // Stores all fetched transactions
  const [transactionSummary, setTransactionSummary] = useState<Record<string, number>>({});
  const [balanceSummary, setBalanceSummary] = useState<{ dates: string[]; balances: number[] }>({ dates: [], balances: [] });
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>('Monthly'); // Use imported Timeframe type, default Monthly
  const [selectedAccountIdsForChart, setSelectedAccountIdsForChart] = useState<string[]>([]);

  // Centralized data processing and fetching logic
  const fetchDataAndProcessBalances = async (currentApiKey: string, currentSelectedIds: string[], currentTf: Timeframe) => {
    if (!currentApiKey) return;
    setIsLoading(true);
    try {
      const fetchedAccounts = await fetchAccounts(currentApiKey);
      const saverAccounts = fetchedAccounts.filter(
        (acct) => acct.attributes.accountType === 'SAVER'
      );
      setAccounts(saverAccounts);

      const freshAllTransactions: Record<string, UpTransaction[]> = {};
      const summary: Record<string, number> = {};
      for (const acct of saverAccounts) {
        const txns = await fetchRecentTransactions(currentApiKey, acct.id);
        summary[acct.id] = txns.length;
        freshAllTransactions[acct.id] = txns;
      }
      setAllTransactions(freshAllTransactions); // Store all fetched transactions
      setTransactionSummary(summary);
      
      // Initialize selected IDs if they haven't been set yet or if accounts list changed
      // This ensures that selectedAccountIdsForChart has a valid list of IDs corresponding to 'saverAccounts'
      const validSelectedIds = currentSelectedIds.length > 0 
        ? currentSelectedIds.filter(id => saverAccounts.some(acc => acc.id === id))
        : saverAccounts.map(acc => acc.id);
      if (currentSelectedIds.length === 0 && saverAccounts.length > 0) {
         setSelectedAccountIdsForChart(validSelectedIds); // Initialize if it was empty
      }


      const { dates, balances } = processBalances(freshAllTransactions, saverAccounts, currentTf, validSelectedIds);
      setBalanceSummary({ dates, balances });

    } catch (err) {
      if (err instanceof UpApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during data fetching. Please try again.');
      }
      setAccounts(null); // Clear accounts on error
      setBalanceSummary({ dates: [], balances: [] });
      setAllTransactions({});
      setTransactionSummary({});
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, check for stored API key
  useEffect(() => {
    const checkStoredKey = async () => {
      setIsLoading(true); // Explicitly set loading true at the start of this effect
      try {
        const storedKey = await getStoredApiKey();
        if (storedKey) {
          await validateApiKey(storedKey); // Ping to ensure key is still valid
          setApiKey(storedKey);
          // Initial fetch. Selected accounts will be all saver accounts by default.
          // No need to pass selectedAccountIdsForChart here yet, as it will be initialized by fetchDataAndProcessBalances
          await fetchDataAndProcessBalances(storedKey, [], currentTimeframe);
        }
      } catch (err) {
        // If stored key is invalid or error during validation/fetch, clear it and show input
        await storeApiKey(''); // Clear potentially invalid key
        setApiKey(null);
        setAccounts(null);
        // Do not set error here, ApiKeyInput will be shown
      } finally {
        setIsLoading(false);
      }
    };
    checkStoredKey();
  }, []); // Runs once on mount

  const handleApiKeySubmit = async (inputKey: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    setApiKey(inputKey); // Set API key immediately for fetchDataAndProcessBalances

    try {
      await validateApiKey(inputKey); // Ping first
      await storeApiKey(inputKey);
      setSuccess('API key validated successfully!');
      // Fetch data with the new key. Selected accounts will default to all.
      await fetchDataAndProcessBalances(inputKey, [], currentTimeframe); 
    } catch (err) {
      await storeApiKey(''); // Clear invalid key
      setApiKey(null);
      setAccounts(null);
      if (err instanceof UpApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      // Success message handling will occur, then isLoading will be false.
      // No need to set isLoading false here if success message has its own timer.
      // However, if success is immediate, or if there's an error, it should be set.
      // The success message component handles its own visibility.
      // Let's ensure isLoading is false if there was an error.
      if (error) {
          setIsLoading(false);
      }
      // If no error, isLoading is handled by fetchDataAndProcessBalances or success message timer.
    }
  };
  
  // Effect to re-process balances when selected accounts or timeframe change
  useEffect(() => {
    if (apiKey && accounts && Object.keys(allTransactions).length > 0) { // Ensure base data is loaded
      setIsLoading(true);
      // Use a microtask to allow UI to update (e.g., show loader) before heavy computation
      Promise.resolve().then(() => {
        const { dates, balances } = processBalances(
          allTransactions, 
          accounts, // Pass all fetched saver accounts
          currentTimeframe, 
          selectedAccountIdsForChart // Pass the currently selected IDs
        );
        setBalanceSummary({ dates, balances });
        setIsLoading(false);
      });
    }
  }, [selectedAccountIdsForChart, currentTimeframe, allTransactions, accounts, apiKey]); // Added allTransactions, accounts, apiKey dependencies

  const handleAccountSelectionChange = (newSelectedAccountIds: string[]) => {
    setSelectedAccountIdsForChart(newSelectedAccountIds);
    // The useEffect for selectedAccountIdsForChart change will trigger re-processing.
  };

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    if (currentTimeframe !== newTimeframe) {
      setCurrentTimeframe(newTimeframe);
      // The useEffect for currentTimeframe change (already existing) will trigger re-processing.
      // No need to call processBalances directly here, as the effect on [..., currentTimeframe, ...] will handle it.
    }
  };

  const handleRefreshData = async () => {
    if (apiKey) {
      setError(''); // Clear previous errors
      setSuccess(''); // Clear previous success messages
      // Call fetchDataAndProcessBalances, it will set isLoading true.
      // It will use the currently selected accounts and timeframe.
      await fetchDataAndProcessBalances(apiKey, selectedAccountIdsForChart, currentTimeframe);
      setSuccess('Data refreshed successfully!'); // Show success message after refresh
    } else {
      setError("Cannot refresh data: API key is not set.");
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
          selectedAccountIdsForChart={selectedAccountIdsForChart}
          onAccountSelectionChange={handleAccountSelectionChange}
          onRefreshData={handleRefreshData}
          currentTimeframe={currentTimeframe}
          onTimeframeChange={handleTimeframeChange} // Pass new handler
        />
      ) : (
        !isLoading && <ApiKeyInput onSubmit={handleApiKeySubmit} isLoading={isLoading} />
      )}
       {/* <DebugPanel /> */}
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
  allSaverAccounts: UpAccount[], // Renamed to reflect it's all available saver accounts
  timeframe: Timeframe, // Use imported Timeframe type
  selectedAccountIds: string[] // New parameter
): { dates: string[]; balances: number[] } {
  // Filter accounts and their transactions based on selectedAccountIds
  const accountsToProcess = allSaverAccounts.filter(acc => selectedAccountIds.includes(acc.id));

  if (accountsToProcess.length === 0 || selectedAccountIds.length === 0) {
    return { dates: [], balances: [] };
  }

  // Create a filtered version of txByAccount based on selectedAccountIds
  const filteredTxByAccount: Record<string, UpTransaction[]> = {};
  for (const accountId of selectedAccountIds) {
    if (txByAccount[accountId]) {
      filteredTxByAccount[accountId] = txByAccount[accountId];
    } else {
      // If an account is selected but has no transactions in txByAccount (e.g. new account with no tx history)
      // still include it in processing, it will use its current balance.
      filteredTxByAccount[accountId] = []; 
    }
  }
  
  // Step 1 & 2: Calculate full history (current logic based on 90 days of transactions)
  const accountDailyBalances = new Map<string, Map<string, number>>();
  const allDatesFullHistorySet = new Set<string>();

  for (const account of accountsToProcess) {
    const transactions = filteredTxByAccount[account.id] || [];
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
    for (const account of accountsToProcess) {
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

  // Placeholder for Weekly and Yearly - current logic only handles Monthly and All
  if (timeframe === 'Weekly') {
    // TODO: Implement weekly filtering logic (Story 4.8)
    // For now, return full history or a specific message/empty data
    console.warn("Weekly timeframe processing not yet implemented. Showing 'All' data for now.");
    return { dates: allSortedDatesFullHistory, balances: aggregatedBalancesFullHistory }; 
  }

  if (timeframe === 'Yearly') {
    // TODO: Implement yearly filtering logic (Story 4.10)
    // For now, return full history or a specific message/empty data
    console.warn("Yearly timeframe processing not yet implemented. Showing 'All' data for now.");
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
