import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { formatTimeAgo } from '../utils/timeFormat';

export type Article = {
  id: string;
  title: string;
  summary?: string;
  image?: string;
  source?: string;
  time?: string;
  sourceIcon?: string;
};

type Props = {
  article: Article;
  onPress?: () => void;
};

export default function ArticleCard({ article, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress} android_ripple={{ color: '#eee' }}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={3}>{article.title}</Text>
      <View style={styles.infoRow}>
        {article.sourceIcon && (
          <Image source={{ uri: article.sourceIcon }} style={styles.icon} />
        )}
        <Text style={styles.source} numberOfLines={1}>{article.source}</Text>
            <Text style={styles.time}>
              {article.time ? formatTimeAgo(article.time) : ''}
            </Text>
          </View>
        </View>
        {article.image && (
          <Image source={{ uri: article.image }} style={styles.image} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  title: {
    fontWeight: '400',
    fontSize: 16,
    marginBottom: 8,
    color: '#222',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  source: {
    fontSize: 13,
    color: '#007AFF',
    marginRight: 8,
    maxWidth: 80,
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginLeft: 'auto',
  },
}); 