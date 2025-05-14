import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ApiKeyInput from './components/ApiKeyInput';
import DebugPanel from './components/DebugPanel';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';
import Dashboard from './dashboard';
import { getStoredApiKey, storeApiKey } from './services/storage';
import { fetchAccounts, fetchRecentTransactions, UpAccount, UpApiError, validateApiKey } from './services/upApi';

export default function App() {
  const [isLoading, setIsLoading] = useState(true); // Start loading immediately
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [accounts, setAccounts] = useState<UpAccount[] | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<Record<string, number>>({});

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
          for (const acct of saverAccounts) {
            const txns = await fetchRecentTransactions(storedKey, acct.id);
            summary[acct.id] = txns.length;
          }
          setTransactionSummary(summary);
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
      for (const acct of saverAccounts) {
        const txns = await fetchRecentTransactions(inputKey, acct.id);
        summary[acct.id] = txns.length;
      }
      setTransactionSummary(summary);
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
        <Dashboard accounts={accounts} transactionSummary={transactionSummary} />
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
