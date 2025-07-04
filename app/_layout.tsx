import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Tab group - có tabs */}
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
        headerShown: false,
                gestureEnabled: false // Không cho swipe back từ tabs
              }} 
            />
            
            {/* Article page - không có tabs, full screen */}
            <Stack.Screen 
              name="article/[id]" 
        options={{
                headerShown: false,
                presentation: 'card', // Smooth transition
                gestureEnabled: true,  // Cho phép swipe back
        }}
      />
          </Stack>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
} 