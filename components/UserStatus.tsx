import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function UserStatus() {
  const { user } = useAuth();
  const router = useRouter();

  const handlePress = () => {
    if (user) {
      // Navigate to account screen
      router.push('/(tabs)/account');
    } else {
      // Navigate to account screen for login
      router.push('/(tabs)/account');
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {user ? (
        <View style={styles.userContainer}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={16} color="#666" />
            </View>
          )}
          <Text style={styles.userName} numberOfLines={1}>
            {user.full_name || user.email}
          </Text>
        </View>
      ) : (
        <View style={styles.loginContainer}>
          <Ionicons name="log-in-outline" size={20} color="#2196f3" />
          <Text style={styles.loginText}>Đăng nhập</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    maxWidth: 120,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '500',
    marginLeft: 4,
  },
}); 