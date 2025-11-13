// D:/OcNaAppV2/app/(app)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
// (SỬA) Import 'useAuth' (từ Context)
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/stores/authStore';

const TabBarIcon = ({ name, color }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) => {
  return <Ionicons size={28} style={{ marginBottom: -3 }} name={name} color={color} />;
};

export default function AppLayout() {
  // (SỬA) Dùng hook 'useAuth'
  const { session, role, isLoading } = useAuth();

  // (SỬA) Khối 'if (isLoading)' sẽ chờ cho đến khi getSession() hoàn tất
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // Khối này chỉ chạy SAU KHI đã tải xong
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#ecf0f1',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <TabBarIcon name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Thực đơn',
          tabBarIcon: ({ color }) => <TabBarIcon name="restaurant-outline" color={color} />,
        }}
      />
      {role === 'admin' && (
        <>
          <Tabs.Screen
            name="report"
            options={{
              title: 'Báo cáo',
              tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart-outline" color={color} />,
            }}
          />
          <Tabs.Screen
            name="staff"
            options={{
              title: 'Nhân viên',
              tabBarIcon: ({ color }) => <TabBarIcon name="people-outline" color={color} />,
            }}
          />
        </>
      )}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="order" 
        options={{
          title: 'Đặt món',
          href: null, // Ẩn khỏi Tab Bar
        }}
      />
    </Tabs>
  );
}