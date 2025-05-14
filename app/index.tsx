import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ApiKeyInput from './components/ApiKeyInput';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);

  const handleApiKeySubmit = async (apiKey: string) => {
    setIsLoading(true);
    // We'll implement the actual API validation in Story 1.3
    console.log('API Key submitted:', apiKey);
    // For now, just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
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
