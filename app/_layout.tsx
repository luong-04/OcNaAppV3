// app/_layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-url-polyfill/auto';
import { supabase } from '../src/services/supabase';
import { useAuthStore } from '../src/stores/authStore';

// (SỬA) 1. Import các hook và component cần thiết
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// (SỬA) 2. Ngăn Splash Screen tự động ẩn
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Hook bảo vệ (giữ nguyên)
const useAuthProtection = () => {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  
  const session = useAuthStore((state) => state.session);
  const isReady = useAuthStore((state) => state.isReady);
  
  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    if (!isReady || !navigationState?.key) return;
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, isReady, inAuthGroup, navigationState?.key]);
};

export default function RootLayout() {
  // (SỬA) 3. Tải font chữ
  const [fontsLoaded, fontError] = useFonts({
    // Đặt tên cho font (ví dụ 'SpaceMono') và trỏ đến file của bạn
    'SVN-Bold': require('../assets/fonts/SVN-Times New Roman Bold.ttf'),
  });

  // (SỬA) 4. Lấy state Auth
  const setSession = useAuthStore((state) => state.setSession);
  const markReady = useAuthStore((state) => state.markReady);
  const isReady = useAuthStore((state) => state.isReady);

  // (SỬA) 5. Gọi hook bảo vệ
  useAuthProtection(); 

  // (SỬA) 6. Logic Auth (giữ nguyên)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    }).finally(() => {
      markReady(); 
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          setSession(null);
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); 
  
  // (SỬA) 7. Logic ẩn Splash Screen (giữ nguyên)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // (SỬA) 8. Logic Loading
  // Phải chờ cả Auth (isReady) VÀ Font (fontsLoaded)
  if (!isReady || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // (SỬA) 9. Return JSX (Đã gộp RootLayoutNav vào đây)
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </QueryClientProvider>
  );
}
