// File: app/(app)/_layout.tsx
// (SỬA LỖI TRIỆT ĐỂ BẰNG CÁCH LỌC MẢNG)

import { Tabs } from 'expo-router';
import { BarChart4, Home, NotebookText, Settings, User, Utensils } from 'lucide-react-native';
import { useAuth } from '../../src/stores/authStore';

// Định nghĩa cấu trúc 1 Tab
type TabConfig = {
  name: string;
  title: string;
  icon: React.ElementType; 
  href?: null;             // SỬA: Chỉ dùng 'null' để ẩn tab
  condition: boolean;      
};

export default function AppLayout() {
  const { role } = useAuth(); // Lấy role để kiểm tra

  // Danh sách TẤT CẢ các tab
  const allTabs: TabConfig[] = [
    { name: "home", title: "Bàn", icon: Home, condition: true },
    { name: "order", title: "Order", icon: NotebookText, href: null, condition: true },
    { name: "menu", title: "Menu", icon: Utensils, condition: role === 'admin' },
    { name: "report", title: "Báo cáo", icon: BarChart4, condition: role === 'admin' },
    { name: "staff", title: "Nhân viên", icon: User, condition: role === 'admin' },
    { name: "settings", title: "Cài đặt", icon: Settings, condition: true }
  ];

  // Lọc ra danh sách tab HỢP LỆ (condition == true)
  const visibleTabs = allTabs.filter(tab => tab.condition);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
      }}
    >
      {/* Chỉ render các tab đã được lọc.
        Cách này KHÔNG BAO GIỜ render 'null' hay 'false',
        do đó sửa dứt điểm lỗi "Layout children".
      */}
      {visibleTabs.map(tab => {
        const Icon = tab.icon;
        return (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              href: tab.href, // Sẽ là null (ẩn) hoặc undefined (hiện)
              tabBarIcon: ({ color }) => <Icon color={color} />,
            }}
          />
        );
      })}
    </Tabs>
  );
}