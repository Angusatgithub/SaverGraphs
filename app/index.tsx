import { StyleSheet, View } from 'react-native';
import ApiKeyInput from './components/ApiKeyInput';

export default function App() {
  return (
    <View style={styles.container}>
      <ApiKeyInput />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
});
