
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-url-polyfill/auto';
// Import AuthProvider và useAuth từ tệp .tsx
import { AuthProvider, useAuth } from '../src/stores/authStore';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Hook bảo vệ
const useAuthProtection = () => {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  
  // Dùng useAuth() để lấy state từ Context
  const { session, isLoading } = useAuth(); 
  
  const inAuthGroup = segments[0] === '(auth)';

  useEffect(() => {
    // Dùng isLoading
    if (isLoading || !navigationState?.key) return; 
    
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
    // Bổ sung logic: nếu đã login mà ở trang auth, đá về home
    if (session && inAuthGroup) {
      router.replace('/(app)/home');
    }
  }, [session, isLoading, inAuthGroup, navigationState?.key]);
};

// Tách RootLayoutNav ra
function RootLayoutNav() {
  const [fontsLoaded, fontError] = useFonts({
    'SVN-Bold': require('../assets/fonts/SVN-Times New Roman Bold.ttf'),
  });

  // Lấy isLoading từ Context
  const { isLoading: isAuthLoading } = useAuth();

  useAuthProtection(); 

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Chờ cả Auth (isAuthLoading) VÀ Font
  if (isAuthLoading || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="(auth)" />
      {/* not-found được xử lý tự động */}
    </Stack>
  );
}

// Bọc RootLayoutNav trong các Provider
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </QueryClientProvider>
  );
}
