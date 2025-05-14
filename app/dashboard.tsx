import { ScrollView, StyleSheet, View } from 'react-native';
import ThemedText from './components/ThemedText';
import { UpAccount } from './services/upApi';

interface DashboardProps {
  accounts: UpAccount[];
}

export default function Dashboard({ accounts }: DashboardProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Your Savings Accounts</ThemedText>
      <ScrollView style={styles.scrollView}>
        {accounts.map((account) => (
          <View key={account.id} style={styles.accountItem}>
            <ThemedText style={styles.accountName}>{account.attributes.displayName}</ThemedText>
            <ThemedText style={styles.accountType}>{account.attributes.accountType}</ThemedText>
            <ThemedText style={styles.accountBalance}>
              {account.attributes.balance.value} {account.attributes.balance.currencyCode}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  accountItem: {
    backgroundColor: '#181818',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  accountType: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 6,
    fontWeight: 'bold',
  },
}); 