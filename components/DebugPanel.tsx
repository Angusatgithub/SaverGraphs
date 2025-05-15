import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor'; // Import useThemeColor
import { ThemedText } from './ThemedText'; // Adjusted path

// Store logs in memory
let logs: string[] = [];
const MAX_LOGS = 100; // Limit the number of logs stored

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

const formatArgs = (args: any[]) => {
  return args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, // Handle BigInt for JSON.stringify
    2) : String(arg)
  ).join(' ');
};

// Override console methods to capture logs
console.log = (...args: any[]) => {
  if (logs.length >= MAX_LOGS) logs.shift(); // Remove oldest log if max is reached
  logs.push(formatArgs(args));
  originalConsole.log(...args);
};

console.error = (...args: any[]) => {
  if (logs.length >= MAX_LOGS) logs.shift();
  logs.push('ERROR: ' + formatArgs(args));
  originalConsole.error(...args);
};

console.warn = (...args: any[]) => {
  if (logs.length >= MAX_LOGS) logs.shift();
  logs.push('WARN: ' + formatArgs(args));
  originalConsole.warn(...args);
};

console.info = (...args: any[]) => {
  if (logs.length >= MAX_LOGS) logs.shift();
  logs.push('INFO: ' + formatArgs(args));
  originalConsole.info(...args);
};

console.debug = (...args: any[]) => {
  if (logs.length >= MAX_LOGS) logs.shift();
  logs.push('DEBUG: ' + formatArgs(args));
  originalConsole.debug(...args);
};

interface DebugPanelProps {
  isVisible?: boolean; // Allow toggling visibility
}

export default function DebugPanel({ isVisible = true }: DebugPanelProps) {
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Theme colors
  const panelBackgroundColor = useThemeColor({}, 'icon'); // Using icon for a muted background
  const panelBorderColor = useThemeColor({}, 'text');   // Text color for border for some contrast
  const logTextColor = useThemeColor({}, 'text');

  useEffect(() => {
    if (!isVisible) return;
    // Update logs every second
    const interval = setInterval(() => {
      setLogMessages([...logs]);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || logMessages.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: panelBackgroundColor, borderTopColor: panelBorderColor }]}>
      <ThemedText style={[styles.title, { color: logTextColor }]}>Debug Logs:</ThemedText>
      <ScrollView style={styles.scrollView}>
        {logMessages.map((log, index) => (
          <ThemedText key={index} style={[styles.log, { color: logTextColor }]}>{log}</ThemedText>
        ))}
      </ScrollView>
    </View>
  );
}

// Styles use hardcoded colors, will be refactored for theming
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10, // Reduced padding
    maxHeight: 150, // Reduced max height
    borderTopWidth: 1,
    zIndex: 999, // Ensure it's on top
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scrollView: {
    maxHeight: 120, // Adjusted scroll view height
  },
  log: {
    fontSize: 10, // Smaller font for more logs
    marginBottom: 4,
    fontFamily: 'monospace',
  },
}); 