import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Directions } from 'react-native-gesture-handler';
import CategoryTabs, { Category } from '../../components/CategoryTabs';
import ArticleCard from '../../components/ArticleCard';
import UserStatus from '../../components/UserStatus';
import { fetchArticles, clearCategoryCache, preloadMultiplePages } from '../../services/api';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

const CATEGORIES: Category[] = [
  { id: 1, name: 'Tin mới' },
  { id: 2, name: 'Thế giới' },
  { id: 3, name: 'Kinh tế' },
  { id: 4, name: 'Đời sống' },
  { id: 5, name: 'Sức khỏe' },
  { id: 6, name: 'Văn hóa' },
  { id: 7, name: 'Giải trí' },
  { id: 8, name: 'Thể thao' },
  { id: 9, name: 'Công nghệ' },
];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();
  // Custom state to track last focus
  const lastFocusRef = useRef<number>(0);

  // Load bài viết đầu tiên khi thay đổi category
  useEffect(() => {
    loadArticles(selectedCategory, 1, true);
  }, [selectedCategory]);

  useEffect(() => {
    // @ts-ignore: tabPress is a valid event for bottom tabs
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      // Only trigger if already focused
      if (navigation.isFocused && navigation.isFocused()) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        onRefresh();
      }
    });
    return unsubscribe;
  }, [navigation, selectedCategory]);

  // Hàm load bài viết với cache
  const loadArticles = async (category_id: number, page: number, resetList: boolean = false) => {
    if (resetList) {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setHasMore(true);
    }

    try {
      const newArticles = await fetchArticles(category_id, page, 20);
      
      if (resetList) {
        setArticles(newArticles);
        setHasMore(newArticles.length === 20);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
        setCurrentPage(page);
        setHasMore(newArticles.length === 20);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load thêm bài viết khi scroll
  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      const newArticles = await fetchArticles(selectedCategory, nextPage, 20);
      
      if (newArticles.length > 0) {
        setArticles(prev => [...prev, ...newArticles]);
        setCurrentPage(nextPage);
        setHasMore(newArticles.length === 20);
        
        // Preload trang tiếp theo sau khi load thành công
        preloadMultiplePages(selectedCategory, nextPage, 2);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Lỗi khi load thêm bài viết:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // Xóa cache cho category hiện tại để force refresh
    clearCategoryCache(selectedCategory);
    await loadArticles(selectedCategory, 1, true);
    setRefreshing(false);
  };

  // Xử lý scroll để trigger preload
  const onScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const contentHeight = contentSize.height;
    const screenHeight = layoutMeasurement.height;
    
    // Preload khi scroll đến 70% cuối danh sách
    const scrollPercentage = (scrollY + screenHeight) / contentHeight;
    if (scrollPercentage > 0.7 && hasMore && !loadingMore) {
      // Trigger preload cho trang tiếp theo
      const nextPage = currentPage + 1;
      preloadMultiplePages(selectedCategory, nextPage, 2);
    }
  };

  // Handler for FlingGestureHandler
  const onFling = (direction) => {
    const currentIndex = CATEGORIES.findIndex(cat => cat.id === selectedCategory);
    if (direction === 'LEFT' && currentIndex < CATEGORIES.length - 1) {
      setSelectedCategory(CATEGORIES[currentIndex + 1].id);
    } else if (direction === 'RIGHT' && currentIndex > 0) {
      setSelectedCategory(CATEGORIES[currentIndex - 1].id);
    }
  };

  // New Gesture API for fling
  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => onFling('LEFT'));

  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => onFling('RIGHT'));

  const composed = Gesture.Simultaneous(flingLeft, flingRight);

  // Render footer cho loading indicator
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196f3" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>VNews</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.searchBtn}>
            <Ionicons name="search" size={25} color="#222" />
          </TouchableOpacity>
          <UserStatus />
        </View>
      </View>
      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
      <CategoryTabs
        categories={CATEGORIES}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />
      </View>
      {/* Danh sách bài viết dạng lưới */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} size="large" color="#2196f3" />
      ) : error ? (
        <Text style={{ color: 'red', margin: 16 }}>{error}</Text>
      ) : (
        <GestureDetector gesture={composed}>
          <View style={{ flex: 1 }} collapsable={false}>
      <FlatList
              ref={flatListRef}
              data={articles}
              keyExtractor={(item, index) => {
                // Tạo key unique bằng cách kết hợp nhiều thuộc tính
                const baseKey = item.id?.toString() || item.url || '';
                const sourceKey = item.source || '';
                const timeKey = item.published_at || '';
                return `${baseKey}-${sourceKey}-${timeKey}-${index}`;
              }}
              numColumns={1}
        renderItem={({ item }) => (
                <ArticleCard
                  article={{
                    id: item.id?.toString() ?? item.url ?? '',
                    title: item.title,
                    image: item.thumbnail_url,
                    source: item.source || '',
                    time: item.published_at || '',
                    sourceIcon: item.source_icon || '',
                  }}
                  onPress={() => router.push({ pathname: '/article/[id]', params: { url: item.url, title: item.title, source: item.source, time: item.published_at, sourceIcon: item.source_icon || '' } })}
                />
              )}
              contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 8 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Không có bài viết</Text>}
              ListFooterComponent={renderFooter}
              onEndReached={loadMoreArticles}
              onEndReachedThreshold={0.1}
              onScroll={onScroll}
              scrollEventThrottle={16} // Tối ưu performance
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#2196f3']}
                  tintColor="#2196f3"
                />
              }
            />
          </View>
        </GestureDetector>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 6,
    backgroundColor: '#f7f8fa',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196f3',
    letterSpacing: 1,
  },
  searchBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  categoryContainer: {
    marginTop: 8,
    marginRight: 0,
    backgroundColor: '#f7f8fa',
  },
}); 