import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Timeframe } from '../components/TimeframeSelectionModal'; // Import Timeframe type
import ApiKeyInput from './components/ApiKeyInput';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';
import Dashboard from './dashboard';
import {
  getStoredApiKey,
  getStoredSelectedAccountIds, // Import new function
  getStoredTimeframe,
  storeApiKey, // Import new function
  storeSelectedAccountIds, // Import new function
  storeTimeframe // Import new function
} from './services/storage';
import { fetchAccounts, fetchTransactions, UpAccount, UpApiError, UpTransaction, validateApiKey } from './services/upApi';

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
  const [selectedAccountIdsForChart, setSelectedAccountIdsForChart] = useState<string[]>([]); // Initialize as empty, will be populated from storage or default
  const [currentPeriodReferenceDate, setCurrentPeriodReferenceDate] = useState<Date>(new Date()); // New state

  // Centralized data processing and fetching logic
  const fetchDataAndProcessBalances = async (
    currentApiKey: string, 
    initialSelectedIds: string[] | null, 
    currentTf: Timeframe,
    referenceDate: Date // New parameter
  ) => {
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
      
      // Determine the 'since' date for fetching transactions (e.g., 365 days ago for Yearly view support)
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - 365);
      const sinceDateISO = sinceDate.toISOString();

      for (const acct of saverAccounts) {
        // Fetch transactions for the last 365 days
        const txns = await fetchTransactions(currentApiKey, acct.id, sinceDateISO);
        summary[acct.id] = txns.length;
        freshAllTransactions[acct.id] = txns;
      }
      setAllTransactions(freshAllTransactions); 
      setTransactionSummary(summary);
      
      // Use initialSelectedIds if provided and valid, otherwise default to all saverAccounts
      let effectiveSelectedIds = initialSelectedIds && initialSelectedIds.length > 0
        ? initialSelectedIds.filter(id => saverAccounts.some(acc => acc.id === id))
        : [];
      
      if (effectiveSelectedIds.length === 0 && saverAccounts.length > 0) {
        effectiveSelectedIds = saverAccounts.map(acc => acc.id); // Default to all if no valid initial selection
      }
      
      setSelectedAccountIdsForChart(effectiveSelectedIds); // Set the state based on loaded/default
      // If we just set them, and it's the first load, store them so they persist if unchanged.
      if (initialSelectedIds === null && effectiveSelectedIds.length > 0) { // Only store if it was an initial default set
          await storeSelectedAccountIds(effectiveSelectedIds);
      }


      const { dates, balances } = processBalances(
        freshAllTransactions, 
        saverAccounts, 
        currentTf, 
        effectiveSelectedIds,
        referenceDate // Pass to processBalances
      );
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
    const checkStoredKeyAndPreferences = async () => { 
      setIsLoading(true);
      try {
        const storedKey = await getStoredApiKey();
        if (storedKey) {
          await validateApiKey(storedKey); 
          setApiKey(storedKey);
          
          const storedSelectedIds = await getStoredSelectedAccountIds();
          const storedTf = await getStoredTimeframe();
          let refDate = new Date(); // Default to today for period reference

          if (storedTf) {
            setCurrentTimeframe(storedTf);
          }
          // Note: We are not storing/retrieving currentPeriodReferenceDate for now.
          // It will always start based on 'today' when app loads or API key changes.
          // Persisting this could be a future enhancement if desired.
          
          await fetchDataAndProcessBalances(storedKey, storedSelectedIds, storedTf || currentTimeframe, refDate);
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
    checkStoredKeyAndPreferences(); // Call renamed function
  }, []); // Runs once on mount

  const handleApiKeySubmit = async (inputKey: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    setApiKey(inputKey); 

    try {
      await validateApiKey(inputKey); 
      await storeApiKey(inputKey);
      setSuccess('API key validated successfully!');
      const defaultTimeframe: Timeframe = 'Monthly';
      setCurrentTimeframe(defaultTimeframe);
      await storeTimeframe(defaultTimeframe);
      const refDate = new Date(); // Reset period reference to today
      setCurrentPeriodReferenceDate(refDate);
      
      await fetchDataAndProcessBalances(inputKey, null, defaultTimeframe, refDate); 
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
    if (apiKey && accounts && Object.keys(allTransactions).length > 0) { 
      setIsLoading(true);
      Promise.resolve().then(() => {
        const { dates, balances } = processBalances(
          allTransactions, 
          accounts, 
          currentTimeframe, 
          selectedAccountIdsForChart,
          currentPeriodReferenceDate // Use state here
        );
        setBalanceSummary({ dates, balances });
        setIsLoading(false);
      });
    }
  }, [selectedAccountIdsForChart, currentTimeframe, allTransactions, accounts, apiKey, currentPeriodReferenceDate]); // Added currentPeriodReferenceDate

  const handleAccountSelectionChange = async (newSelectedAccountIds: string[]) => { 
    setSelectedAccountIdsForChart(newSelectedAccountIds);
    await storeSelectedAccountIds(newSelectedAccountIds); 
  };

  const handleTimeframeChange = async (newTimeframe: Timeframe) => { 
    if (currentTimeframe !== newTimeframe) {
      setCurrentTimeframe(newTimeframe);
      await storeTimeframe(newTimeframe);
      setCurrentPeriodReferenceDate(new Date()); // Reset period to 'today' for new timeframe
    }
  };

  const handlePreviousPeriod = () => {
    setSuccess(''); // Clear any existing success message
    const newRefDate = new Date(currentPeriodReferenceDate);
    switch (currentTimeframe) {
      case 'Weekly':
        newRefDate.setDate(newRefDate.getDate() - 7);
        break;
      case 'Monthly':
        newRefDate.setMonth(newRefDate.getMonth() - 1);
        break;
      case 'Yearly':
        newRefDate.setFullYear(newRefDate.getFullYear() - 1);
        break;
    }
    setCurrentPeriodReferenceDate(newRefDate);
  };

  const handleNextPeriod = () => {
    setSuccess(''); // Clear any existing success message
    const newRefDate = new Date(currentPeriodReferenceDate);
    switch (currentTimeframe) {
      case 'Weekly':
        newRefDate.setDate(newRefDate.getDate() + 7);
        break;
      case 'Monthly':
        newRefDate.setMonth(newRefDate.getMonth() + 1);
        break;
      case 'Yearly':
        newRefDate.setFullYear(newRefDate.getFullYear() + 1);
        break;
    }
    // Optional: Prevent navigating to future periods beyond 'today'
    // if (newRefDate > new Date()) {
    //  return; 
    // }
    setCurrentPeriodReferenceDate(newRefDate);
  };

  const handleRefreshData = async () => {
    if (apiKey) {
      setError(''); // Clear previous errors
      setSuccess(''); // Clear previous success messages
      // Call fetchDataAndProcessBalances, it will set isLoading true.
      // It will use the currently selected accounts and timeframe.
      await fetchDataAndProcessBalances(apiKey, selectedAccountIdsForChart, currentTimeframe, currentPeriodReferenceDate); // Pass current refDate
      setSuccess('Data refreshed successfully!'); 
    } else {
      setError("Cannot refresh data: API key is not set.");
    }
  };

  // After success animation, show dashboard if accounts are loaded
  const handleSuccessComplete = () => {
    // No navigation, just show dashboard in place
  };

  const handleLogout = () => {
    setApiKey(null);
    setAccounts(null);
    setAllTransactions({});
    setTransactionSummary({});
    setBalanceSummary({ dates: [], balances: [] });
    setSelectedAccountIdsForChart([]);
    setCurrentTimeframe('Monthly');
    setCurrentPeriodReferenceDate(new Date());
  };

  // Helper to filter transactions by timeframe
  function filterTransactionsByTimeframe(
    transactions: UpTransaction[],
    timeframe: Timeframe,
    referenceDate: Date
  ): UpTransaction[] {
    const ref = new Date(referenceDate);
    let start: Date, end: Date;

    if (timeframe === 'Weekly') {
      const day = ref.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start = new Date(ref);
      start.setDate(ref.getDate() + diffToMonday);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (timeframe === 'Monthly') {
      start = new Date(ref.getFullYear(), ref.getMonth(), 1);
      end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    } else if (timeframe === 'Yearly') {
      start = new Date(ref.getFullYear(), 0, 1);
      end = new Date(ref.getFullYear(), 11, 31);
    } else {
      return transactions;
    }

    return transactions.filter(tx => {
      const txDate = new Date(tx.attributes.createdAt);
      return txDate >= start && txDate <= end;
    });
  }

  // Calculate filtered transaction count for selected accounts and timeframe
  const filteredTransactionCount = selectedAccountIdsForChart.reduce((sum, id) => {
    const txns = allTransactions[id] || [];
    return sum + filterTransactionsByTimeframe(txns, currentTimeframe, currentPeriodReferenceDate).length;
  }, 0);

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <ErrorMessage message={error} />
        <SuccessMessage message={success} onComplete={handleSuccessComplete} />
      </View>
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
          onTimeframeChange={handleTimeframeChange}
          currentPeriodReferenceDate={currentPeriodReferenceDate}
          onPreviousPeriod={handlePreviousPeriod}
          onNextPeriod={handleNextPeriod}
          filteredTransactionCount={filteredTransactionCount}
          onLogout={handleLogout}
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
  messageContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

// Helper to process balances
function processBalances(
  txByAccount: Record<string, UpTransaction[]>,
  allSaverAccounts: UpAccount[], 
  timeframe: Timeframe, 
  selectedAccountIds: string[],
  referenceDate: Date // New parameter
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

  const filterDataForTimeframe = (
    startDate: string, 
    endDate: string, 
    allDates: string[], 
    allBalances: number[]
  ): { dates: string[]; balances: number[] } => {
    let startIndex = -1;
    let balanceBeforePeriod = 0;
    let foundBalanceBeforePeriod = false;

    for (let i = 0; i < allDates.length; i++) {
      const date = allDates[i];
      if (date < startDate) {
        balanceBeforePeriod = allBalances[i];
        foundBalanceBeforePeriod = true;
      } else if (date >= startDate && date <= endDate) {
        if (startIndex === -1) {
          startIndex = i;
        }
      }
      if (date > endDate && startIndex !== -1) {
        break;
      }
    }

    const periodDates: string[] = [];
    const periodBalances: number[] = [];

    if (startIndex !== -1) {
      if (allDates[startIndex] > startDate && foundBalanceBeforePeriod) {
        periodDates.push(startDate);
        periodBalances.push(balanceBeforePeriod);
      }
      for (let i = startIndex; i < allDates.length; i++) {
        if (allDates[i] <= endDate) {
          periodDates.push(allDates[i]);
          periodBalances.push(allBalances[i]);
        } else {
          break;
        }
      }
      // If the last data point in the period is before the period end date, and data exists,
      // add the end date with the last known balance to complete the graph for the period.
      if (periodDates.length > 0 && periodDates[periodDates.length -1] < endDate) {
        if (!periodDates.includes(endDate)) { // Avoid duplicate if endDate already has data
             periodDates.push(endDate);
             periodBalances.push(periodBalances[periodBalances.length -1]);
        }
      }

    } else if (foundBalanceBeforePeriod) {
      periodDates.push(startDate);
      periodBalances.push(balanceBeforePeriod);
      if (endDate > startDate && !periodDates.includes(endDate)) {
        periodDates.push(endDate);
        periodBalances.push(balanceBeforePeriod);
      }
    }
    return { dates: periodDates, balances: periodBalances };
  };

  const refDateForCalc = new Date(referenceDate); // Use the passed referenceDate

  if (timeframe === 'Weekly') {
    const currentDay = refDateForCalc.getDay(); 
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay; 
    const monday = new Date(refDateForCalc);
    monday.setDate(refDateForCalc.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = monday.toISOString().slice(0, 10);
    const endDate = sunday.toISOString().slice(0, 10);
    
    console.log(`processBalances (Weekly): Start: ${startDate}, End: ${endDate}`);
    const result = filterDataForTimeframe(startDate, endDate, allSortedDatesFullHistory, aggregatedBalancesFullHistory);
    console.log('processBalances (Weekly): dates', result.dates);
    console.log('processBalances (Weekly): balances', result.balances);
    return result;
  }

  if (timeframe === 'Yearly') {
    const year = refDateForCalc.getFullYear();
    const startDate = new Date(year, 0, 1).toISOString().slice(0, 10); 
    const endDate = new Date(year, 11, 31).toISOString().slice(0, 10); 
    
    const today = new Date(); // Define today for capping logic
    const todayStr = today.toISOString().slice(0,10);
    let effectiveEndDate = endDate;
    
    if (year === today.getFullYear() && todayStr < endDate) {
        effectiveEndDate = todayStr;
    }

    console.log(`processBalances (Yearly): Start: ${startDate}, End: ${effectiveEndDate}`);
    const result = filterDataForTimeframe(startDate, effectiveEndDate, allSortedDatesFullHistory, aggregatedBalancesFullHistory);
    console.log('processBalances (Yearly): dates', result.dates);
    console.log('processBalances (Yearly): balances', result.balances);
    return result;
  }

  if (timeframe === 'Monthly') {
    const year = refDateForCalc.getFullYear();
    const month = refDateForCalc.getMonth(); 
    const currentMonthStartDate = new Date(year, month, 1).toISOString().slice(0, 10);
    
    let currentMonthEndDate;
    const today = new Date(); // Define today for capping logic
    if (year === today.getFullYear() && month === today.getMonth()) {
        currentMonthEndDate = today.toISOString().slice(0, 10);
    } else {
        currentMonthEndDate = new Date(year, month + 1, 0).toISOString().slice(0, 10); // Last day of the month
    }

    console.log(`processBalances (Monthly): Start: ${currentMonthStartDate}, End: ${currentMonthEndDate}`);
    const result = filterDataForTimeframe(currentMonthStartDate, currentMonthEndDate, allSortedDatesFullHistory, aggregatedBalancesFullHistory);
    console.log('processBalances (Monthly): dates', result.dates);
    console.log('processBalances (Monthly): balances', result.balances);
    return result;
  }

  return { dates: [], balances: [] }; 
}
