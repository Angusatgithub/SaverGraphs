import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedText from './ThemedText';
import { Timeframe } from './TimeframeSelectionModal';

interface SummaryDisplayProps {
  totalSelectedAccounts: number;
  currentTimeframe: Timeframe;
  lastBalance: string;
  transactionsLabel: string;
  totalSelectedTransactions: number;
  daysWithData: number;
  onOpenTimeframeModal: () => void;
}

export default function SummaryDisplay({
  totalSelectedAccounts,
  currentTimeframe,
  lastBalance,
  transactionsLabel,
  totalSelectedTransactions,
  daysWithData,
  onOpenTimeframeModal,
}: SummaryDisplayProps) {
  return (
    <View style={styles.summaryBox}>
      <View style={styles.summaryHeaderRow}>
        <ThemedText type="subtitle">
          {totalSelectedAccounts === 1
            ? `${totalSelectedAccounts} Saver selected`
            : `${totalSelectedAccounts} Savers selected`}
        </ThemedText>
        <TouchableOpacity
          style={styles.timeframeSmallButton}
          onPress={onOpenTimeframeModal}
          accessibilityLabel="Change Timeframe"
        >
          <ThemedText style={styles.timeframeSmallButtonText}>{currentTimeframe}</ThemedText>
          <Ionicons name="calendar-outline" size={16} color="#fff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>
      <View style={styles.summaryRow}>
        <ThemedText style={styles.summaryLabel}>Total Balance:</ThemedText>
        <ThemedText style={styles.summaryValue}>${lastBalance}</ThemedText>
      </View>
      <View style={styles.summaryRow}>
        <ThemedText style={styles.summaryLabel}>{transactionsLabel}:</ThemedText>
        <ThemedText style={styles.summaryValue}>{totalSelectedTransactions}</ThemedText>
      </View>
      <View style={styles.summaryRow}>
        <ThemedText style={styles.summaryLabel}>Days with transaction data:</ThemedText>
        <ThemedText style={styles.summaryValue}>{daysWithData}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryBox: {
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#E5E5E7',
  },
  summaryValue: {
    fontSize: 16,
    color: '#E5E5E7',
    fontWeight: '600',
  },
  timeframeSmallButton: {
    flexDirection: 'row',
    backgroundColor: '#5856D6',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  timeframeSmallButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 