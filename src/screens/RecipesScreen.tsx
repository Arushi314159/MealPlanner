import { StyleSheet, Text, View } from 'react-native';

export default function RecipesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipes</Text>
      <Text style={styles.subtitle}>Your saved recipes will show up here.</Text>
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
