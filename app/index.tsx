import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ApiKeyInput from './components/ApiKeyInput';
import ErrorMessage from './components/ErrorMessage';
import { UpApiError, validateApiKey } from './services/upApi';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleApiKeySubmit = async (apiKey: string) => {
    setIsLoading(true);
    setError('');

    try {
      const isValid = await validateApiKey(apiKey);
      if (isValid) {
        // We'll handle successful validation in Story 1.4
        console.log('API key is valid!');
      }
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

  return (
    <View style={styles.container}>
      <ErrorMessage message={error} />
      <ApiKeyInput onSubmit={handleApiKeySubmit} isLoading={isLoading} />
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
