import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedText from './ThemedText';

export type Timeframe = 'Weekly' | 'Monthly' | 'Yearly'; // Removed 'All'

interface TimeframeSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentTimeframe: Timeframe;
  onTimeframeSelect: (timeframe: Timeframe) => void;
}

const TIMEFRAME_OPTIONS: Timeframe[] = ['Weekly', 'Monthly', 'Yearly']; // Removed 'All'

export default function TimeframeSelectionModal({
  isVisible,
  onClose,
  currentTimeframe,
  onTimeframeSelect,
}: TimeframeSelectionModalProps) {
  const handleSelect = (timeframe: Timeframe) => {
    onTimeframeSelect(timeframe);
    onClose();
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
          <ThemedText type="subtitle" style={styles.modalTitle}>Select Timeframe</ThemedText>
          {TIMEFRAME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                option === currentTimeframe && styles.selectedOptionButton,
              ]}
              onPress={() => handleSelect(option)}
            >
              <ThemedText 
                style={[
                    styles.optionText,
                    option === currentTimeframe && styles.selectedOptionText
                ]}
              >
                {option}
              </ThemedText>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={onClose} // Simple close button
          >
            <ThemedText style={styles.textStyle}>Cancel</ThemedText>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    width: '80%',
    backgroundColor: '#1E1E1E',
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
  optionButton: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedOptionButton: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
  selectedOptionText: {
    fontWeight: 'bold',
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
    backgroundColor: '#555555', // Darker grey for cancel
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
}); 