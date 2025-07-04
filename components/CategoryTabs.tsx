import React, { useRef, useEffect } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';

export type Category = {
  id: number;
  name: string;
};

type Props = {
  categories: Category[];
  selectedId: number;
  onSelect: (id: number) => void;
};

export default function CategoryTabs({ categories, selectedId, onSelect }: Props) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto scroll to selected category
  useEffect(() => {
    const selectedIndex = categories.findIndex(cat => cat.id === selectedId);
    if (selectedIndex !== -1 && scrollViewRef.current) {
      // Calculate approximate position (each tab is roughly 80px wide)
      const scrollToX = selectedIndex * 80;
      scrollViewRef.current.scrollTo({
        x: scrollToX,
        animated: true,
      });
    }
  }, [selectedId, categories]);

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tab, selectedId === cat.id && styles.tabActive]}
            onPress={() => onSelect(cat.id)}
          >
            <Text style={[styles.tabText, selectedId === cat.id && styles.tabTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    backgroundColor: '#f7f8fa',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16, // Add padding to ensure first tab is not cut off
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 0,
    marginRight: 10,
    backgroundColor: '#ffffff',
    height: 36,
    justifyContent: 'center',
    minWidth: 60, // Ensure minimum width for consistent spacing
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    color: '#333',
    fontWeight: '400',
    fontSize: 14,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
}); 