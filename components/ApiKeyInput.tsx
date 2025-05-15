import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedText } from './ThemedText';

interface ApiKeyInputProps {
  onSubmit?: (apiKey: string) => void;
  isLoading?: boolean;
  initialApiKey?: string;
}

export default function ApiKeyInput({ onSubmit, isLoading, initialApiKey = '' }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [error, setError] = useState('');

  // Theme colors
  const themedBackgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'icon');
  const inputBackgroundColor = useThemeColor({}, 'icon');
  const inputBorderColor = useThemeColor({}, 'icon');
  const errorColor = useThemeColor({}, 'tint');
  const primaryActionColor = useThemeColor({}, 'tint');
  const buttonTextColor = useThemeColor({}, 'background');
  const disabledColor = useThemeColor({}, 'icon');
  const helperTextColor = useThemeColor({}, 'icon');

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
    const validationError = validateKeyFormat(cleanKey);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (cleanKey && onSubmit) {
      onSubmit(cleanKey);
    }
  };

  const openUpDocs = () => {
    Linking.openURL('https://developer.up.com.au/#getting-started');
  };

  return (
    <View style={[styles.container, { backgroundColor: themedBackgroundColor }]}>
      <ThemedText style={[styles.label, { color: textColor }]}>Enter your Up API Key</ThemedText>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: inputBackgroundColor, color: textColor, borderColor: error ? errorColor : inputBorderColor },
        ]}
        placeholder="up:yeah:yourtoken"
        placeholderTextColor={placeholderColor}
        value={apiKey}
        onChangeText={handleChangeText}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isLoading}
      />
      {error ? (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>{error}</ThemedText>
      ) : (
        <ThemedText style={[styles.helperText, { color: helperTextColor }]}>
          Enter your Personal Access Token from your Up developer settings, including the "up:yeah:" prefix.{' '}
          <ThemedText style={[styles.link, { color: primaryActionColor }]} onPress={openUpDocs}>
            Learn how to get one
          </ThemedText>
        </ThemedText>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: (isLoading || !!error || !apiKey.trim()) ? disabledColor : primaryActionColor },
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSubmit}
        disabled={!apiKey.trim() || !!error || isLoading}
      >
        <ThemedText style={[styles.buttonText, {color: buttonTextColor }]}>
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
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  link: {
    textDecorationLine: 'underline',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 