import { ThemedText } from '@/components/ThemedText';
import React, { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface SuccessMessageProps {
  message: string;
  onComplete?: () => void;
}

export default function SuccessMessage({ message, onComplete }: SuccessMessageProps) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (!message) return;

    // Fade in
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Hold for 1.5 seconds
      Animated.delay(1500),
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  }, [message, onComplete]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <ThemedText style={styles.text}>✨ {message}</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4CAF5020',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  text: {
    color: '#4CAF50',
    fontSize: 14,
  },
}); 