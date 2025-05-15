import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedText } from './ThemedText';

export type TimeframeOption = 'Weekly' | 'Monthly' | 'Yearly';

interface TimeframeSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentTimeframe: TimeframeOption;
  onTimeframeSelect: (timeframe: TimeframeOption) => void;
}

export default function TimeframeSelectionModal({
  isVisible,
  onClose,
  currentTimeframe,
  onTimeframeSelect,
}: TimeframeSelectionModalProps) {
  const timeframes: TimeframeOption[] = ['Weekly', 'Monthly', 'Yearly'];

  const modalBackgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const unselectedOptionBackgroundColor = useThemeColor({}, 'icon'); // Using 'icon' for unselected buttons
  const selectedOptionBackgroundColor = useThemeColor({}, 'tint');   // Using 'tint' for selected/primary action
  const cancelButtonBackgroundColor = useThemeColor({}, 'icon'); // Using 'icon' for cancel button for less prominence

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: modalBackgroundColor }]}>
          <ThemedText type="title" style={[styles.modalTitle, { color: textColor }]}>Select Timeframe</ThemedText>
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.optionButton,
                { backgroundColor: currentTimeframe === timeframe ? selectedOptionBackgroundColor : unselectedOptionBackgroundColor },
              ]}
              onPress={() => {
                onTimeframeSelect(timeframe);
                onClose();
              }}
            >
              <ThemedText
                style={[
                  styles.optionText,
                  { color: textColor }, // Standard text color for options
                  currentTimeframe === timeframe && styles.selectedOptionText, // Bold for selected
                ]}
              >
                {timeframe}
              </ThemedText>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.button, styles.doneButton, { backgroundColor: cancelButtonBackgroundColor }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.buttonText, { color: textColor }]}>Cancel</ThemedText>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent background
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  selectedOptionText: {
    fontWeight: 'bold',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  doneButton: { // Kept for structure, specific color set by useThemeColor
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  optionText: {
    fontSize: 16,
  },
}); 