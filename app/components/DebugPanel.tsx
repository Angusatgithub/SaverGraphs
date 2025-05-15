import { ThemedText } from '@/components/ThemedText';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

// Store logs in memory
let logs: string[] = [];
const originalConsole = {
  log: console.log,
  error: console.error,
};

// Override console methods to capture logs
console.log = (...args) => {
  logs.push(args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' '));
  originalConsole.log(...args);
};

console.error = (...args) => {
  logs.push('ERROR: ' + args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' '));
  originalConsole.error(...args);
};

export default function DebugPanel() {
  const [logMessages, setLogMessages] = useState<string[]>([]);

  useEffect(() => {
    // Update logs every second
    const interval = setInterval(() => {
      setLogMessages([...logs]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (logMessages.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Debug Logs:</ThemedText>
      <ScrollView style={styles.scrollView}>
        {logMessages.map((log, index) => (
          <ThemedText key={index} style={styles.log}>{log}</ThemedText>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    padding: 16,
    maxHeight: 200,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scrollView: {
    maxHeight: 150,
  },
  log: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
}); 