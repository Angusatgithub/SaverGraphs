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

  // Step 1: For each account, determine its balance on each day it had a transaction.
  // This map stores: accountId -> (date -> balanceAfter of last tx on that date)
  const accountDailyBalances = new Map<string, Map<string, number>>();
  const allTxDates = new Set<string>();

  for (const account of accounts) {
    const transactions = txByAccount[account.id] || [];
    if (transactions.length === 0) continue;

    const dailyBalancesForThisAccount = new Map<string, number>();
    // Sort transactions by createdAt to ensure the last one for a day is processed last
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.attributes.createdAt).getTime() - new Date(b.attributes.createdAt).getTime()
    );

    let txWithBalanceAfterCount = 0;
    for (const tx of sortedTransactions) {
      const date = tx.attributes.createdAt.slice(0, 10);
      if (tx.attributes.balanceAfter && tx.attributes.balanceAfter.value) {
        allTxDates.add(date);
        dailyBalancesForThisAccount.set(date, parseFloat(tx.attributes.balanceAfter.value));
        txWithBalanceAfterCount++;
      }
    }
    console.log(`Account ${account.id} has ${transactions.length} transactions, ${txWithBalanceAfterCount} with balanceAfter.`);
    if (dailyBalancesForThisAccount.size > 0) {
      accountDailyBalances.set(account.id, dailyBalancesForThisAccount);
    }
  }

  if (allTxDates.size === 0) {
    console.warn('No transactions with balanceAfter found for any account. Using current balances as fallback.');
    // Fallback: create a single data point for today using current balances
    const today = new Date().toISOString().slice(0, 10);
    let total = 0;
    for (const account of accounts) {
      total += parseFloat(account.attributes.balance.value);
    }
    return { dates: [today], balances: [parseFloat(total.toFixed(2))] };
  }

  const sortedUniqueDates = Array.from(allTxDates).sort();

  // Step 2: For each unique sorted date, calculate the aggregated total balance.
  // If an account didn't have a transaction on `currentDate`,
  // use its balance from the most recent date <= `currentDate` where it DID have a transaction.
  const finalAggregatedBalances: number[] = [];
  const lastKnownBalanceForAccount = new Map<string, number>(); // Stores accountId -> last known balance

  for (const currentDate of sortedUniqueDates) {
    let aggregatedBalanceOnCurrentDate = 0;
    for (const account of accounts) {
      const balancesForThisAccount = accountDailyBalances.get(account.id);

      if (balancesForThisAccount) {
        // Check if this account had a transaction on the currentDate
        if (balancesForThisAccount.has(currentDate)) {
          const balanceOnCurrentDate = balancesForThisAccount.get(currentDate)!;
          lastKnownBalanceForAccount.set(account.id, balanceOnCurrentDate); // Update last known balance
          aggregatedBalanceOnCurrentDate += balanceOnCurrentDate;
        } else {
          // No transaction on currentDate for this account.
          // Use its last known balance (carried forward from a previous date in sortedUniqueDates).
          const carriedForwardBalance = lastKnownBalanceForAccount.get(account.id);
          if (carriedForwardBalance !== undefined) {
            aggregatedBalanceOnCurrentDate += carriedForwardBalance;
          }
          // If carriedForwardBalance is undefined, it means this account hasn't had a transaction yet
          // up to this currentDate in the sorted list, so it contributes 0 to the aggregate.
        }
      }
      // If balancesForThisAccount is undefined (account has no transactions at all in the given period),
      // it also contributes 0 to the aggregate.
    }
    finalAggregatedBalances.push(parseFloat(aggregatedBalanceOnCurrentDate.toFixed(2)));
  }

  return { dates: sortedUniqueDates, balances: finalAggregatedBalances };
}
