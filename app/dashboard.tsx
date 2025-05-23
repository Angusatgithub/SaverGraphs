import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import AccountSelector from '../components/AccountSelector';
import BalanceChart from '../components/BalanceChart';
import DashboardHeader from '../components/DashboardHeader';
import SummaryDisplay from '../components/SummaryDisplay';
import ThemedText from '../components/ThemedText';
import TimeframeSelectionModal, { Timeframe } from '../components/TimeframeSelectionModal';
import { clearAllData } from './services/storage';
import { UpAccount } from './services/upApi';

interface DashboardProps {
  accounts: UpAccount[];
  transactionSummary: Record<string, number>;
  balanceSummary: { dates: string[]; balances: number[] };
  isLoading: boolean;
  selectedAccountIdsForChart: string[];
  onAccountSelectionChange: (newSelectedAccountIds: string[]) => void;
  onRefreshData: () => Promise<void>;
  currentTimeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  currentPeriodReferenceDate: Date;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  filteredTransactionCount: number;
  onLogout: () => void;
}

export default function Dashboard({ 
  accounts, 
  transactionSummary, 
  balanceSummary, 
  isLoading,
  selectedAccountIdsForChart,
  onAccountSelectionChange,
  onRefreshData,
  currentTimeframe,
  onTimeframeChange,
  currentPeriodReferenceDate,
  onPreviousPeriod,
  onNextPeriod,
  filteredTransactionCount,
  onLogout
}: DashboardProps) {
  const totalAccounts = accounts.length;
  const [isTimeframeModalVisible, setIsTimeframeModalVisible] = useState(false);

  const lastBalance = balanceSummary.balances.length > 0 
    ? balanceSummary.balances[balanceSummary.balances.length - 1].toFixed(2) 
    : 'N/A';

  // Calculate overview stats based on selected accounts
  const selectedAccounts = accounts.filter(acc => selectedAccountIdsForChart.includes(acc.id));
  const totalSelectedAccounts = selectedAccounts.length;

  // Helper to get timeframe label
  const getTimeframeLabel = (timeframe: Timeframe) => {
    switch (timeframe) {
      case 'Monthly':
        return 'Monthly';
      case 'Yearly':
        return 'Yearly';
      case 'Weekly':
        return 'Weekly';
      default:
        return 'last 90 days';
    }
  };
  const timeframeLabel = getTimeframeLabel(currentTimeframe);

  // Helper to get transactions label
  const getTransactionsLabel = (timeframe: Timeframe) => {
    switch (timeframe) {
      case 'Monthly':
        return 'Transactions this Month';
      case 'Yearly':
        return 'Transactions this Year';
      case 'Weekly':
        return 'Transactions this Week';
      default:
        return 'Transactions (last 90 days)';
    }
  };
  const transactionsLabel = getTransactionsLabel(currentTimeframe);

  // Handler for toggling account selection
  const handleAccountToggle = (accountId: string) => {
    let newSelected: string[];
    if (selectedAccountIdsForChart.includes(accountId)) {
      newSelected = selectedAccountIdsForChart.filter(id => id !== accountId);
    } else {
      newSelected = [...selectedAccountIdsForChart, accountId];
    }
    onAccountSelectionChange(newSelected);
  };

  const handleLogout = async () => {
    await clearAllData();
    onLogout();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <DashboardHeader 
        title="Savers over time"
        isLoading={isLoading}
        onRefresh={onRefreshData}
      />

      <View style={styles.chartContainer}>
        <BalanceChart dates={balanceSummary.dates} balances={balanceSummary.balances} isLoading={isLoading} />
      </View>

      <SummaryDisplay
        totalSelectedAccounts={totalSelectedAccounts}
        currentTimeframe={currentTimeframe}
        lastBalance={lastBalance}
        transactionsLabel={transactionsLabel}
        totalSelectedTransactions={filteredTransactionCount}
        daysWithData={balanceSummary.dates.length}
        onOpenTimeframeModal={() => setIsTimeframeModalVisible(true)}
        currentPeriodReferenceDate={currentPeriodReferenceDate}
        onPreviousPeriod={onPreviousPeriod}
        onNextPeriod={onNextPeriod}
      />

      <AccountSelector 
        accounts={accounts}
        selectedAccountIds={selectedAccountIdsForChart}
        onAccountToggle={handleAccountToggle}
      />

      <TimeframeSelectionModal
        isVisible={isTimeframeModalVisible}
        onClose={() => setIsTimeframeModalVisible(false)}
        currentTimeframe={currentTimeframe}
        onTimeframeSelect={onTimeframeChange}
      />

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        accessibilityLabel="Log out"
      >
        <ThemedText style={styles.logoutButtonText}>Log out</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  chartContainer: {
    marginBottom: 32,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  timeframeButton: {
    backgroundColor: '#5856D6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 