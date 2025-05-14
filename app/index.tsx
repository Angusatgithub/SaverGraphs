import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ApiKeyInput from './components/ApiKeyInput';
import DebugPanel from './components/DebugPanel';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';
import { storeApiKey } from './services/storage';
import { UpApiError, validateApiKey } from './services/upApi';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

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
    // We'll implement this screen in future stories
    router.replace('/dashboard');
  };

  return (
    <View style={styles.container}>
      <ErrorMessage message={error} />
      <SuccessMessage message={success} onComplete={handleSuccessComplete} />
      <ApiKeyInput onSubmit={handleApiKeySubmit} isLoading={isLoading} />
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
