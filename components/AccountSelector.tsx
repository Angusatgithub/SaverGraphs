import React from 'react';
import { StyleSheet, View } from 'react-native';
import { UpAccount } from '../app/services/upApi'; // Adjusted import path
import AccountListItem from './AccountListItem';
import ThemedText from './ThemedText';

interface AccountSelectorProps {
  accounts: UpAccount[];
  selectedAccountIds: string[];
  onAccountToggle: (accountId: string) => void;
}

export default function AccountSelector({
  accounts,
  selectedAccountIds,
  onAccountToggle,
}: AccountSelectorProps) {
  return (
    <View>
      <View style={styles.subtitle}>
        <ThemedText type="subtitle">Pick your Savers 👇</ThemedText>
      </View>

      {accounts.map((account) => (
        <AccountListItem
          key={account.id}
          account={account}
          isSelected={selectedAccountIds.includes(account.id)}
          onPress={() => onAccountToggle(account.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: 16,
    marginBottom: 16,
  },
}); 