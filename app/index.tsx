import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ApiKeyInput from './components/ApiKeyInput';
import DebugPanel from './components/DebugPanel';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';
import { getStoredApiKey, storeApiKey } from './services/storage';
import { UpApiError, validateApiKey } from './services/upApi';

export default function App() {
  const [isLoading, setIsLoading] = useState(true); // Start loading immediately
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // On mount, check for stored API key
  useEffect(() => {
    const checkStoredKey = async () => {
      try {
        const storedKey = await getStoredApiKey();
        if (storedKey) {
          await validateApiKey(storedKey);
          router.replace('/dashboard');
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

  const handleApiKeySubmit = async (apiKey: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await validateApiKey(apiKey); // If this doesn't throw, it's valid
      await storeApiKey(apiKey);
      setSuccess('API key validated successfully!');
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

  const handleSuccessComplete = () => {
    // Navigate to the main app screen
    router.replace('/dashboard');
  };

  return (
    <View style={styles.container}>
      <ErrorMessage message={error} />
      <SuccessMessage message={success} onComplete={handleSuccessComplete} />
      {!isLoading && (
        <ApiKeyInput onSubmit={handleApiKeySubmit} isLoading={isLoading} />
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
