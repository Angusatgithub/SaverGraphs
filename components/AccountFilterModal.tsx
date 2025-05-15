import React from 'react';
import { Modal, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { UpAccount } from '../app/services/upApi'; // Adjust path as needed
import { ThemedText } from './ThemedText'; // Corrected: named import

interface AccountFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  accounts: UpAccount[];
  initiallySelectedAccountIds?: string[]; // Optional: if not provided, all are selected
  onSelectionChange: (selectedAccountIds: string[]) => void;
}

export default function AccountFilterModal({ 
  isVisible, 
  onClose, 
  accounts,
  initiallySelectedAccountIds,
  onSelectionChange,
}: AccountFilterModalProps) {
  const [selectedAccountIds, setSelectedAccountIds] = React.useState<string[]>(() => {
    if (initiallySelectedAccountIds) {
      return initiallySelectedAccountIds;
    }
    // Default to all accounts selected if no initial selection is provided
    return accounts.map(acc => acc.id);
  });

  // Effect to reset selected accounts if accounts list changes or initial selection prop changes
  // This ensures that if the modal is re-opened with different accounts or different initial selection,
  // the state reflects that.
  React.useEffect(() => {
    if (isVisible) { // Only reset when becoming visible to avoid issues during close animations
      setSelectedAccountIds(initiallySelectedAccountIds || accounts.map(acc => acc.id));
    }
  }, [isVisible, accounts, initiallySelectedAccountIds]);


  const handleToggleSwitch = (accountId: string) => {
    setSelectedAccountIds(prevSelectedIds => {
      if (prevSelectedIds.includes(accountId)) {
        return prevSelectedIds.filter(id => id !== accountId);
      } else {
        return [...prevSelectedIds, accountId];
      }
    });
  };

  const handleDonePress = () => {
    onSelectionChange(selectedAccountIds);
    onClose(); // Close the modal
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <ThemedText type="subtitle" style={styles.modalTitle}>Filter Savings Accounts</ThemedText>
          <ScrollView style={styles.scrollView}>
            {accounts.map((account) => (
              <View key={account.id} style={styles.accountItem}>
                <ThemedText style={styles.accountName}>{account.attributes.displayName}</ThemedText>
                <Switch 
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={selectedAccountIds.includes(account.id) ? '#f5dd4b' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                  value={selectedAccountIds.includes(account.id)}
                  onValueChange={() => handleToggleSwitch(account.id)}
                />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={handleDonePress}
          >
            <ThemedText style={styles.textStyle}>Done</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dimmed background
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1E1E1E', // Dark modal background
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  scrollView: {
    width: '100%',
    marginBottom: 15,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C', // Subtle separator
  },
  accountName: {
    fontSize: 17,
    color: '#E5E5E7',
    flex: 1, // Allow text to take available space before switch
    marginRight: 10,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
    marginTop: 10,
    minWidth: 100,
  },
  buttonClose: {
    backgroundColor: '#007AFF', // iOS blue style button
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
}); 