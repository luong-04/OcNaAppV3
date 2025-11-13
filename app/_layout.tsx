// D:/OcNaAppV2/app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
// (SỬA) Import AuthProvider từ authStore
import { AuthProvider } from '../src/stores/authStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* (SỬA) Bọc toàn bộ app trong AuthProvider */}
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          {/* (SỬA) Xóa not-found để fix lỗi vòng lặp render */}
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}