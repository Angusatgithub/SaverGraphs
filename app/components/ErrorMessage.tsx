import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.text}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF4B4B20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  text: {
    color: '#FF4B4B',
    fontSize: 14,
  },
}); 