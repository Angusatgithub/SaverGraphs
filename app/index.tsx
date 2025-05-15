import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import ApiKeyInput from '../components/ApiKeyInput';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { TimeframeOption } from '../components/TimeframeSelectionModal'; // Import TimeframeOption
import { BalanceSummary, processBalances } from '../utils/balanceHelpers';
import DashboardScreen from './dashboard';
import { fetchAccounts, fetchRecentTransactions, UpAccount, UpApiError, UpTransaction, validateApiKey } from './services/upApi';

const API_KEY_STORAGE_KEY = 'upApiKey';

// type Timeframe = 'Monthly' | 'All'; // Old type
// No, TimeframeOption is already defined as 'Weekly' | 'Monthly' | 'Yearly' in the modal

export default function MainAppScreen() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<UpAccount[] | null>(null);
  const [allTransactions, setAllTransactions] = useState<Record<string, UpTransaction[]>>({});
  const [balanceSummary, setBalanceSummary] = useState<BalanceSummary | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<Record<string, number> | null>(null);
  
  const [selectedAccountIdsForChart, setSelectedAccountIdsForChart] = useState<string[]>([]);
  const [currentTimeframe, setCurrentTimeframe] = useState<TimeframeOption>('Monthly'); // Updated type and default

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const fetchDataAndProcessBalances = useCallback(async (currentApiKey: string, selectedAcctIds: string[], timeframe: TimeframeOption) => {
    if (!currentApiKey) return;
    setIsLoading(true);
    clearMessages();
    try {
      const fetchedAccounts = await fetchAccounts(currentApiKey);
      const saverAccounts = fetchedAccounts.filter(acc => acc.attributes.accountType === 'SAVER');
      setAccounts(saverAccounts);

      if (saverAccounts.length === 0) {
        setTransactionSummary({});
        setAllTransactions({});
        setBalanceSummary({ dates: [], balances: [], dailyBalances: new Map() });
        setSelectedAccountIdsForChart([]);
        setIsLoading(false);
        return;
      }
      
      let actualSelectedIds = selectedAcctIds;
      if (selectedAcctIds.length === 0 && saverAccounts.length > 0) {
        actualSelectedIds = saverAccounts.map(acc => acc.id);
        setSelectedAccountIdsForChart(actualSelectedIds); 
      }
      
      const transactionsByAccountId: Record<string, UpTransaction[]> = {};
      const summary: Record<string, number> = {};
      for (const account of saverAccounts) {
        const fetchedTransactions = await fetchRecentTransactions(currentApiKey, account.id);
        transactionsByAccountId[account.id] = fetchedTransactions;
        summary[account.id] = fetchedTransactions.length;
      }
      setAllTransactions(transactionsByAccountId);
      setTransactionSummary(summary);

      const processedSummary = processBalances(saverAccounts, transactionsByAccountId, timeframe, actualSelectedIds);
      setBalanceSummary(processedSummary);

    } catch (err) {
      const errorMessage = err instanceof UpApiError ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setAccounts(null);
      setAllTransactions({});
      setTransactionSummary(null);
      setBalanceSummary(null);
      if (err instanceof UpApiError && err.status === 401) {
        await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
        setApiKey(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadApiKey = async () => {
      setIsLoading(true);
      try {
        const storedApiKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
        if (storedApiKey) {
          const isValid = await validateApiKey(storedApiKey);
          if (isValid) {
            setApiKey(storedApiKey);
            await fetchDataAndProcessBalances(storedApiKey, selectedAccountIdsForChart, currentTimeframe);
          } else {
            await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
            setError("Stored API key is invalid. Please enter a new one.");
            setApiKey(null);
            setIsLoading(false);
          }
        } else {
          setApiKey(null);
          setIsLoading(false);
        }
      } catch (e) {
        setError('Failed to load API key from storage.');
        setApiKey(null);
        setIsLoading(false);
      }
    };
    loadApiKey();
  }, [fetchDataAndProcessBalances]);

  useEffect(() => {
    if (apiKey && accounts && Object.keys(allTransactions).length > 0) {
        if (selectedAccountIdsForChart.length > 0 || (accounts && accounts.length === 0) ) {
            setIsLoading(true);
            const processedSummary = processBalances(accounts, allTransactions, currentTimeframe, selectedAccountIdsForChart);
            setBalanceSummary(processedSummary);
            setIsLoading(false);
        }
    } else if (apiKey && accounts && accounts.length === 0) {
        setBalanceSummary({ dates: [], balances: [], dailyBalances: new Map() });
    } else if (apiKey && accounts && selectedAccountIdsForChart.length === 0 && accounts.length > 0) {
        setBalanceSummary({ dates: [], balances: [], dailyBalances: new Map() });
    }
}, [selectedAccountIdsForChart, currentTimeframe, accounts, allTransactions, apiKey, processBalances]);


  const handleApiKeySubmit = async (submittedKey: string) => {
    setIsLoading(true);
    clearMessages();
    try {
      const isValid = await validateApiKey(submittedKey);
      if (isValid) {
        await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, submittedKey);
        setApiKey(submittedKey);
        setSuccessMessage('API Key validated successfully!');
        await fetchDataAndProcessBalances(submittedKey, [], 'Monthly');
      } else {
        setError('Invalid API Key.');
      }
    } catch (err) {
      const errorMessage = err instanceof UpApiError ? err.message : 'Failed to validate API Key.';
      setError(errorMessage);
      await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
      setApiKey(null);
    } finally {
    }
  };

  const handleAccountSelectionChange = (newSelectedIds: string[]) => {
    setSelectedAccountIdsForChart(newSelectedIds);
  };

  const handleTimeframeSelect = (timeframe: TimeframeOption) => {
    setCurrentTimeframe(timeframe);
  };

  const handleRefreshData = async () => {
    if (!apiKey) {
      setError("Cannot refresh data: API key is not set.");
      return;
    }
    setSuccessMessage(null);
    await fetchDataAndProcessBalances(apiKey, selectedAccountIdsForChart, currentTimeframe);
    setSuccessMessage("Data refreshed successfully!");
  };

  if (isLoading && !successMessage) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText>Loading application...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }
  
  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {successMessage && <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage(null)} />}
      {error && !successMessage && <ErrorMessage message={error} />}

      {!apiKey ? (
        <ApiKeyInput onSubmit={handleApiKeySubmit} isLoading={isLoading} initialApiKey='' />
      ) : (
        <DashboardScreen
          apiKey={apiKey}
          accounts={accounts}
          transactionSummary={transactionSummary}
          balanceSummary={balanceSummary}
          isLoading={isLoading}
          error={error}
          successMessage={successMessage}
          selectedAccountIdsForChart={selectedAccountIdsForChart}
          onAccountSelectionChange={handleAccountSelectionChange}
          onRefreshData={handleRefreshData}
          currentTimeframe={currentTimeframe}
          onTimeframeSelect={handleTimeframeSelect}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
