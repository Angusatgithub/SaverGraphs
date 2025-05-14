import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface ApiKeyInputProps {
  onSubmit?: (apiKey: string) => void;
}

export default function ApiKeyInput({ onSubmit }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');

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
      />
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
  },
}); 