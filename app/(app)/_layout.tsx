import { Tabs } from 'expo-router';
import { BarChart4, Home, NotebookText, Settings, User, Utensils } from 'lucide-react-native';
import { useAuth } from '../../src/stores/authStore';

export default function AppLayout() {
  const { role } = useAuth(); 

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Bàn', tabBarIcon: ({ color }) => <Home color={color} /> }} />
      <Tabs.Screen name="order" options={{ title: 'Order', href: null, tabBarIcon: ({ color }) => <NotebookText color={color} /> }} />

      {/* SỬA LỖI: Dùng (condition ? <Component /> : null) */}
      
      {role === 'admin' ? (
        <Tabs.Screen name="menu" options={{ title: 'Menu', tabBarIcon: ({ color }) => <Utensils color={color} /> }} />
      ) : null}
      
      {role === 'admin' ? (
        <Tabs.Screen name="report" options={{ title: 'Báo cáo', tabBarIcon: ({ color }) => <BarChart4 color={color} /> }} />
      ) : null}
      
      {role === 'admin' ? (
        <Tabs.Screen name="staff" options={{ title: 'Nhân viên', tabBarIcon: ({ color }) => <User color={color} /> }} />
      ) : null}

      <Tabs.Screen name="settings" options={{ title: 'Cài đặt', tabBarIcon: ({ color }) => <Settings color={color} /> }} />
    </Tabs>
  );
}