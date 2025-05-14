import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import ThemedText from './ThemedText';

interface ApiKeyInputProps {
  onSubmit?: (apiKey: string) => void;
  isLoading?: boolean;
}

export default function ApiKeyInput({ onSubmit, isLoading }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const validateKeyFormat = (key: string) => {
    const cleanKey = key.trim().replace(/\s+/g, '');
    if (!cleanKey.startsWith('up:yeah:')) {
      return 'API key should start with "up:yeah:"';
    }
    const tokenParts = cleanKey.split(':');
    if (tokenParts.length !== 3 || tokenParts[0] !== 'up' || tokenParts[1] !== 'yeah') {
      return 'API key should be in the format "up:yeah:yourtoken"';
    }
    const actualToken = tokenParts[2];
    if (!actualToken || !/^[a-zA-Z0-9]+$/.test(actualToken)) {
      return 'The token part should only contain letters and numbers';
    }
    return '';
  };

  const handleChangeText = (text: string) => {
    setApiKey(text);
    setError(validateKeyFormat(text));
  };

  const handleSubmit = () => {
    const cleanKey = apiKey.trim();
    if (cleanKey && !error && onSubmit) {
      onSubmit(cleanKey);
    }
  };

  const openUpDocs = () => {
    Linking.openURL('https://developer.up.com.au/#getting-started');
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Enter your Up API Key</ThemedText>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholder="up:yeah:yourtoken"
        placeholderTextColor="#666"
        value={apiKey}
        onChangeText={handleChangeText}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />
      {error ? (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      ) : (
        <ThemedText style={styles.helperText}>
          Enter your Personal Access Token from your Up developer settings, including the "up:yeah:" prefix.{' '}
          <ThemedText style={styles.link} onPress={openUpDocs}>
            Learn how to get one
          </ThemedText>
        </ThemedText>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          (isLoading || error) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!apiKey.trim() || !!error || isLoading}
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
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#FF4B4B',
  },
  helperText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF4B4B',
    marginBottom: 16,
  },
  link: {
    color: '#FF4B4B',
    textDecorationLine: 'underline',
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