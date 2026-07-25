import { StyleSheet, Text, View } from 'react-native';

export default function GroceryListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grocery List</Text>
      <Text style={styles.subtitle}>Ingredients from your meal plan will show up here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
