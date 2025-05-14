import { StyleSheet, View } from 'react-native';
import ThemedText from './components/ThemedText';

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <ThemedText>Dashboard coming soon!</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 