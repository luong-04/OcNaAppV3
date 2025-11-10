// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  // Layout này chỉ đơn giản là một Stack
  // Nó sẽ hiển thị các màn hình con bên trong nó (như login.tsx)
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}