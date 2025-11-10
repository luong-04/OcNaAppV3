// app/(app)/_layout.tsx
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router'; // (SỬA) import router
import React, { useEffect } from 'react';
import { useAuthStore } from '../../src/stores/authStore';

// (MỚI) Hook bảo vệ cho riêng nhóm (app)
function useAppAuthProtection() {
  const session = useAuthStore((state) => state.session);
  const isReady = useAuthStore((state) => state.isReady);

  useEffect(() => {
    // Chỉ chạy khi đã sẵn sàng
    if (!isReady) return;

    // Nếu vì lý do gì đó mà user ở trong (app)
    // nhưng không có session -> đá về login
    if (!session) {
      router.replace('/(auth)/login');
    }
  }, [isReady, session]);
}

export default function AppLayout() {
  const role = useAuthStore((state) => state.role);
  
  // (MỚI) Gọi hook bảo vệ
  useAppAuthProtection();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        headerStyle: { backgroundColor: '#FF6B35' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Bàn',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="store" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Thực đơn',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="restaurant-menu" size={size} color={color} />
          ),
          href: role === 'admin' ? '/(app)/menu' : null,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Báo cáo',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
          href: role === 'admin' ? '/(app)/report' : null,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Nhân viên',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="users-cog" size={size} color={color} />
          ),
          href: role === 'admin' ? '/(app)/staff' : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
          // Chỉ admin mới thấy
          href: role === 'admin' ? '/(app)/settings' : null, 
        }}
      />
      <Tabs.Screen 
        name="order" 
        options={{ 
          href: null, // Chỉ 1 dòng này là đủ
        }} 
      />
    </Tabs>
  );
}