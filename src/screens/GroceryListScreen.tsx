import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { SpecialItem, SpecialsData } from '../types';

const SPECIALS_URL =
  'https://raw.githubusercontent.com/Arushi314159/MealPlanner/main/data/specials.json';

export default function GroceryListScreen() {
  const [items, setItems] = useState<SpecialItem[]>([]);
  const [scrapedAt, setScrapedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSpecials = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${SPECIALS_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      const data: SpecialsData = await response.json();
      setItems(data.items);
      setScrapedAt(data.scrapedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load specials');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadSpecials().finally(() => setLoading(false));
  }, [loadSpecials]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSpecials().finally(() => setRefreshing(false));
  }, [loadSpecials]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Woolworths Specials</Text>
            {scrapedAt && (
              <Text style={styles.updatedText}>
                Updated {new Date(scrapedAt).toLocaleString()}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.subtitle}>No specials found right now.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.cardInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
                {item.size ? ` ${item.size}` : ''}
              </Text>
              {!!item.unitPrice && <Text style={styles.unitPrice}>{item.unitPrice}</Text>}
              <View style={styles.priceRow}>
                <Text style={styles.specialPrice}>${item.specialPrice.toFixed(2)}</Text>
                {item.wasPrice != null && (
                  <Text style={styles.wasPrice}>Was ${item.wasPrice.toFixed(2)}</Text>
                )}
              </View>
              {!!item.saveText && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.saveText}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  updatedText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#c0392b',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  unitPrice: {
    fontSize: 12,
    color: '#888',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  specialPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
  },
  wasPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2e7d32',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
