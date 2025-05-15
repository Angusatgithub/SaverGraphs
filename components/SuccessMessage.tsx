import React, { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText'; // Adjusted path for ThemedText

interface SuccessMessageProps {
  message: string;
  onDismiss?: () => void; // Renamed onComplete to onDismiss to match usage in app/index.tsx
}

export default function SuccessMessage({ message, onDismiss }: SuccessMessageProps) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (!message) {
      // Ensure opacity is 0 if there's no message initially or it's cleared
      opacity.setValue(0);
      return;
    }

    opacity.setValue(0); // Reset opacity before fading in for new messages
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  }, [message, onDismiss, opacity]); // Added opacity to dependency array as it's used in setValue

  // Do not render if message is null or empty to allow fade-out to complete before disappearing
  // The animated opacity will handle visibility.
  // if (!message) return null; // This was causing abrupt disappearance

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