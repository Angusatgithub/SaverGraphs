import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedText from './ThemedText';

interface DashboardHeaderProps {
  title: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function DashboardHeader({ title, isLoading, onRefresh }: DashboardHeaderProps) {
  return (
    <View style={styles.headerRow}>
      <ThemedText type="title" style={styles.title}>{title}</ThemedText>
      <TouchableOpacity
        onPress={onRefresh}
        disabled={isLoading}
        style={styles.refreshIconButton}
        accessibilityLabel="Refresh Data"
      >
        {isLoading ? (
          <Ionicons name="refresh" size={24} color="#007AFF" style={{ opacity: 0.5, transform: [{ rotate: '90deg' }] }} />
        ) : (
          <Ionicons name="refresh" size={24} color="#007AFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshIconButton: {
    marginLeft: 12,
    padding: 4,
  },
}); 