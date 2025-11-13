import { ActivityIndicator, View } from 'react-native';

// File này là "cổng vào".
// Nó sẽ hiển thị một vòng xoay loading trong khi 
// app/_layout.tsx đang kiểm tra trạng thái đăng nhập
// và quyết định điều hướng đến (app) hay (auth).

export default function RootIndex() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
}