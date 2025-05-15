import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import AccountFilterModal from '../components/AccountFilterModal';
import BalanceChart from '../components/BalanceChart';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import TimeframeSelectionModal, { TimeframeOption } from '../components/TimeframeSelectionModal';
import { useThemeColor } from '../hooks/useThemeColor';
import { BalanceSummary } from '../utils/balanceHelpers';
import { UpAccount } from './services/upApi';

interface DashboardProps {
  apiKey: string | null;
  accounts: UpAccount[] | null;
  transactionSummary: Record<string, number> | null;
  balanceSummary: BalanceSummary | null;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  selectedAccountIdsForChart: string[];
  onAccountSelectionChange: (selectedIds: string[]) => void;
  onRefreshData: () => Promise<void>;
  currentTimeframe: TimeframeOption;
  onTimeframeSelect: (timeframe: TimeframeOption) => void;
}

export default function DashboardScreen({
  apiKey,
  accounts,
  transactionSummary,
  balanceSummary,
  isLoading,
  error,
  successMessage,
  selectedAccountIdsForChart,
  onAccountSelectionChange,
  onRefreshData,
  currentTimeframe,
  onTimeframeSelect,
}: DashboardProps) {
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isTimeframeModalVisible, setIsTimeframeModalVisible] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const buttonBackgroundColor = useThemeColor({}, 'icon');
  const buttonTextColor = useThemeColor({}, 'text');

  const totalAccounts = accounts ? accounts.length : 0;
  const totalTransactions = transactionSummary ? Object.values(transactionSummary).reduce((sum, count) => sum + count, 0) : 0;
  const lastBalance = balanceSummary && balanceSummary.balances.length > 0 
    ? balanceSummary.balances[balanceSummary.balances.length - 1].toFixed(2) 
    : 'N/A';

  const handleModalAccountSelectionChange = (newSelectedAccountIds: string[]) => {
    onAccountSelectionChange(newSelectedAccountIds);
  };

  const filterButtonStyle = [
    styles.button,
    styles.filterButton,
    { backgroundColor: buttonBackgroundColor },
    (isLoading || !accounts || accounts.length === 0) && styles.disabledButton
  ];

  const refreshButtonStyle = [
    styles.button,
    styles.refreshButton,
    { backgroundColor: buttonBackgroundColor },
    isLoading && styles.disabledButton
  ];

  const timeframeButtonStyle = [
    styles.button,
    styles.timeframeButton,
    { backgroundColor: buttonBackgroundColor },
    isLoading && styles.disabledButton
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        {successMessage && (
          <View style={styles.messageContainer}>
            <SuccessMessage message={successMessage} onDismiss={() => { /* Handled in index.tsx */ }} />
          </View>
        )}
        {error && !successMessage && (
          <View style={styles.messageContainer}>
            <ErrorMessage message={error} />
          </View>
        )}

        {apiKey && (
          <View style={styles.contentContainer}>
            <ThemedText type="title" style={styles.dashboardTitle}>Your Savings Dashboard</ThemedText>
            
            <View style={styles.summaryBox}>
              <ThemedText style={styles.summaryText}>Total Saver Accounts: {totalAccounts}</ThemedText>
              <ThemedText style={styles.summaryText}>Total Transactions (90d): {totalTransactions}</ThemedText>
              <ThemedText style={styles.summaryText}>Latest Aggregated Balance: ${lastBalance}</ThemedText>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={filterButtonStyle}
                onPress={() => setIsFilterModalVisible(true)}
                disabled={isLoading || !accounts || accounts.length === 0}
              >
                <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>Filter Accounts</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={refreshButtonStyle}
                onPress={onRefreshData}
                disabled={isLoading}
              >
                <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
                  {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={timeframeButtonStyle}
                onPress={() => setIsTimeframeModalVisible(true)}
                disabled={isLoading}
              >
                <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
                  Timeframe: {currentTimeframe}
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.chartContainer}>
              <BalanceChart 
                dates={balanceSummary?.dates || []} 
                balances={balanceSummary?.balances || []} 
                isLoading={isLoading && !balanceSummary}
              />
            </View>

          </View>
        )}
      </ScrollView>
      
      <AccountFilterModal
        isVisible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        accounts={accounts || []}
        initiallySelectedAccountIds={selectedAccountIdsForChart}
        onSelectionChange={handleModalAccountSelectionChange}
      />
      <TimeframeSelectionModal 
        isVisible={isTimeframeModalVisible}
        onClose={() => setIsTimeframeModalVisible(false)}
        currentTimeframe={currentTimeframe}
        onTimeframeSelect={onTimeframeSelect}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  dashboardTitle: {
    marginVertical: 20,
    textAlign: 'center',
  },
  summaryBox: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: '#2C2C2E',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
  },
  timeframeButton: {
    backgroundColor: '#5856D6',
  },
  disabledButton: {
    opacity: 0.5,
  },
  chartContainer: {
    // Styles for the container of the BalanceChart if needed
  },
}); 