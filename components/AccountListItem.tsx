import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { UpAccount } from '../app/services/upApi'; // Adjusted import path
import ThemedText from './ThemedText';

interface AccountListItemProps {
  account: UpAccount;
  isSelected: boolean;
  onPress: () => void;
}

export default function AccountListItem({ account, isSelected, onPress }: AccountListItemProps) {
  return (
    <TouchableOpacity
      style={[
        styles.accountItem,
        isSelected ? styles.accountItemSelected : styles.accountItemUnselected
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ThemedText type="defaultSemiBold" style={styles.accountName}>{account.attributes.displayName}</ThemedText>
      <ThemedText style={styles.accountDetail}>${account.attributes.balance.value} {account.attributes.balance.currencyCode}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  accountItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  accountItemSelected: {
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#23234A',
  },
  accountItemUnselected: {
    borderWidth: 1,
    borderColor: '#3A3A3C',
    backgroundColor: '#1C1C1E',
    opacity: 0.7,
  },
}); 