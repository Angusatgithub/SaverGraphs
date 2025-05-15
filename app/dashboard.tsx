import { ScrollView, StyleSheet, View } from 'react-native';
import BalanceChart from '../components/BalanceChart';
import ThemedText from '../components/ThemedText';
import { UpAccount } from './services/upApi';

interface DashboardProps {
  accounts: UpAccount[];
  transactionSummary: Record<string, number>;
  balanceSummary: { dates: string[]; balances: number[] };
  isLoading: boolean;
  // currentTotalBalance: string | null; // No longer needed with revised balanceSummary
}

export default function Dashboard({ accounts, transactionSummary, balanceSummary, isLoading }: DashboardProps) {
  const totalAccounts = accounts.length;
  const totalTransactions = Object.values(transactionSummary).reduce((sum, count) => sum + count, 0);

  const lastBalance = balanceSummary.balances.length > 0 
    ? balanceSummary.balances[balanceSummary.balances.length - 1].toFixed(2) 
    : 'N/A';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ThemedText type="title" style={styles.title}>Your Savings Accounts</ThemedText>
      
      <View style={styles.summaryBox}>
        <ThemedText type="subtitle">Overview</ThemedText>
        <ThemedText style={styles.summaryText}>Current Total Balance: ${lastBalance}</ThemedText>
        <ThemedText style={styles.summaryText}>Total Saver Accounts: {totalAccounts}</ThemedText>
        <ThemedText style={styles.summaryText}>Total Transactions (last 90 days): {totalTransactions}</ThemedText>
        <ThemedText style={styles.summaryText}>{balanceSummary.dates.length} days with transaction data</ThemedText>
      </View>

      <BalanceChart dates={balanceSummary.dates} balances={balanceSummary.balances} isLoading={isLoading} />

      {accounts.map((account) => (
        <View key={account.id} style={styles.accountItem}>
          <ThemedText type="defaultSemiBold" style={styles.accountName}>{account.attributes.displayName}</ThemedText>
          <ThemedText style={styles.accountDetail}>Type: {account.attributes.accountType}</ThemedText>
          <ThemedText style={styles.accountDetail}>Balance: ${account.attributes.balance.value} {account.attributes.balance.currencyCode}</ThemedText>
          <ThemedText style={styles.transactionCount}>Transactions (last 90d): {transactionSummary[account.id] || 0}</ThemedText>
        </View>
      ))}
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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
  },
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
  summaryText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#E5E5E7',
  },
  accountItem: {
    backgroundColor: '#1C1C1E',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  accountName: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  accountDetail: {
    fontSize: 14,
    color: '#AEAEB2',
    marginBottom: 2,
  },
  transactionCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
}); 