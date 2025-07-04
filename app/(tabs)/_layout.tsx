import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { TouchableWithoutFeedback, View, Text } from 'react-native';

function TabBarButton(props) {
  // Remove ref to avoid linter/type errors
  const { ref, ...rest } = props;
  return (
    <TouchableWithoutFeedback {...rest}>
      <View
        style={{
          flex: 1,
          margin: 0,
          padding: 0,
          minHeight: 48,
          height: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2, // add space between icon and label
          paddingTop: 20, // move content down
        }}
      >
        {props.children}
      </View>
    </TouchableWithoutFeedback>
  );
}

export default function Layout() {
  const insets = useSafeAreaInsets();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
            tabBarLabel: ({ focused, color }) =>
              focused ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '500', color, marginTop: 0 }}>
                    {route.name === 'index' ? 'Trang chủ' : route.name === 'account' ? 'Tài khoản' : ''}
                  </Text>
                </View>
              ) : null,
            tabBarLabelStyle: { fontSize: 13, fontWeight: '500', textAlign: 'center', marginTop: 0 },
            tabBarStyle: {
              backgroundColor: '#fff',
              paddingBottom: insets.bottom || 0,
              height: Math.max(48, 28 + (insets.bottom || 0)),
              borderTopWidth: 0.5,
              borderTopColor: '#eee',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: 'transparent',
              elevation: 0,
              margin: 0,
              padding: 0,
              width: '100%',
            },
            tabBarButton: (props) => <TabBarButton {...props} />, // Use custom button
            tabBarIcon: ({ color, size, focused }) => {
              const iconSize = 25;
              if (route.name === 'index') {
                return <Ionicons name="home-outline" size={iconSize} color={color} />;
              }
              if (route.name === 'account') {
                return <Ionicons name="person-outline" size={iconSize} color={color} />;
              }
              return null;
            },
          })}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Trang chủ',
              tabBarLabel: 'Trang chủ',
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: 'Tài khoản',
              tabBarLabel: 'Tài khoản',
            }}
          />
        </Tabs>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}