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
  currentPeriodReferenceDate: Date;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

const formatDateISO = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

const getMonday = (d: Date) => {
  d = new Date(d);
  const day = d.getDay(),
      diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const formatPeriod = (date: Date, timeframe: Timeframe): string => {
  const year = date.getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  switch (timeframe) {
    case 'Weekly': {
      const monday = getMonday(new Date(date));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return `${monthNames[monday.getMonth()]} ${monday.getDate()} - ${monthNames[sunday.getMonth()]} ${sunday.getDate()}, ${year}`;
    }
    case 'Monthly':
      return `${monthNames[date.getMonth()]} ${year}`;
    case 'Yearly':
      return `${year}`;
    default:
      return '';
  }
};

export default function SummaryDisplay({
  totalSelectedAccounts,
  currentTimeframe,
  lastBalance,
  transactionsLabel,
  totalSelectedTransactions,
  daysWithData,
  onOpenTimeframeModal,
  currentPeriodReferenceDate,
  onPreviousPeriod,
  onNextPeriod,
}: SummaryDisplayProps) {

  const formattedPeriod = formatPeriod(currentPeriodReferenceDate, currentTimeframe);

  const isNextDisabled = () => {
    const now = new Date();
    const nextPeriodRef = new Date(currentPeriodReferenceDate);
    if (currentTimeframe === 'Weekly') nextPeriodRef.setDate(nextPeriodRef.getDate() + 7);
    else if (currentTimeframe === 'Monthly') nextPeriodRef.setMonth(nextPeriodRef.getMonth() + 1);
    else if (currentTimeframe === 'Yearly') nextPeriodRef.setFullYear(nextPeriodRef.getFullYear() + 1);
    
    return nextPeriodRef.setHours(0,0,0,0) > now.setHours(0,0,0,0);
  };

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

      <View style={styles.periodNavigationRow}>
        <TouchableOpacity onPress={onPreviousPeriod} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.periodText}>{formattedPeriod}</ThemedText>
        <TouchableOpacity onPress={onNextPeriod} style={styles.navButton} disabled={isNextDisabled()}>
          <Ionicons name="chevron-forward" size={24} color={isNextDisabled() ? '#555' : '#fff'} />
        </TouchableOpacity>
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
    marginBottom: 24,
  },
  periodNavigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  navButton: {
    padding: 5,
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
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