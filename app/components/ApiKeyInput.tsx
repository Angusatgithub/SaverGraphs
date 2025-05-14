import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import ThemedText from './ThemedText';

interface ApiKeyInputProps {
  onSubmit?: (apiKey: string) => void;
  isLoading?: boolean;
}

export default function ApiKeyInput({ onSubmit, isLoading }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = () => {
    if (apiKey.trim() && onSubmit) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Enter your Up API Key</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Enter your Up API Key"
        placeholderTextColor="#666"
        value={apiKey}
        onChangeText={setApiKey}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          isLoading && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!apiKey.trim() || isLoading}
      >
        <ThemedText style={styles.buttonText}>
          {isLoading ? 'Connecting...' : 'Connect'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF4B4B',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 