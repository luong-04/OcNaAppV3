import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '../../src/services/supabase';
import { SettingsState, useSettingsStore } from '../../src/stores/settingsStore'; // (SỬA) Import 'SettingsState'

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(false);

  // (SỬA) Lấy đúng các state từ store
  const {
    shopName,
    address,
    phone,
    printer1,
    printer2,
    kitchenPrinterId,
    paymentPrinterId,
    thankYouMessage,
    qrCodeData,
    isVatEnabled,
    vatPercent,
    setSettings,
  } = useSettingsStore(useShallow((state) => state));

  const handleLogout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Lỗi', error.message);
    } else {
      router.replace('/(auth)/login');
    }
    setIsLoading(false);
  };

  // (SỬA) Sửa lại kiểu (type) của 'key'
  const updateSetting = (key: keyof SettingsState, value: any) => {
    // (SỬA) Báo cho TypeScript biết 'key' là một string an toàn
    setSettings({ [key as string]: value } as Partial<SettingsState>);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Cài Đặt</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin cửa hàng</Text>
        <Text style={styles.label}>Tên cửa hàng</Text>
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={(val) => updateSetting('shopName', val)}
        />
        <Text style={styles.label}>Địa chỉ</Text>
        <TextInput
          style={styles.input}
          value={address} // (SỬA)
          onChangeText={(val) => updateSetting('address', val)} // (SỬA)
        />
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={phone} // (SỬA)
          onChangeText={(val) => updateSetting('phone', val)} // (SỬA)
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt máy in</Text>
        <Text style={styles.label}>Máy in 1 (IP:PORT)</Text>
        <TextInput
          style={styles.input}
          value={printer1} // (SỬA)
          onChangeText={(val) => updateSetting('printer1', val)} // (SỬA)
          autoCapitalize="none"
        />
        <Text style={styles.label}>Máy in 2 (IP:PORT)</Text>
        <TextInput
          style={styles.input}
          value={printer2} // (SỬA)
          onChangeText={(val) => updateSetting('printer2', val)} // (SỬA)
          autoCapitalize="none"
        />

        <Text style={styles.label}>Chọn máy in Bếp</Text>
        <Picker
          selectedValue={kitchenPrinterId}
          onValueChange={(itemValue) => updateSetting('kitchenPrinterId', itemValue)}
        >
          <Picker.Item label="Dùng máy in 1" value="printer1" />
          <Picker.Item label="Dùng máy in 2" value="printer2" />
        </Picker>

        <Text style={styles.label}>Chọn máy in Thanh toán</Text>
        <Picker
          selectedValue={paymentPrinterId}
          onValueChange={(itemValue) => updateSetting('paymentPrinterId', itemValue)}
        >
          <Picker.Item label="Dùng máy in 1" value="printer1" />
          <Picker.Item label="Dùng máy in 2" value="printer2" />
        </Picker>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt hóa đơn</Text>
        <Text style={styles.label}>Lời cảm ơn</Text>
        <TextInput
          style={styles.input}
          value={thankYouMessage}
          onChangeText={(val) => updateSetting('thankYouMessage', val)}
        />
        <Text style={styles.label}>Nội dung QR Code (Link)</Text>
        <TextInput
          style={styles.input}
          value={qrCodeData}
          onChangeText={(val) => updateSetting('qrCodeData', val)}
        />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Bật VAT</Text>
          <Switch
            value={isVatEnabled}
            onValueChange={(val) => updateSetting('isVatEnabled', val)}
          />
        </View>
        {isVatEnabled && (
          <>
            <Text style={styles.label}>Phần trăm VAT (%)</Text>
            <TextInput
              style={styles.input}
              value={vatPercent}
              onChangeText={(val) => updateSetting('vatPercent', val)}
              keyboardType="numeric"
            />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Button
          title={isLoading ? 'Đang đăng xuất...' : 'Đăng Xuất'}
          onPress={handleLogout}
          color="#e74c3c"
          disabled={isLoading}
        />
      </View>
    </ScrollView>
  );
}

// (SỬA) Styles rút gọn cho nhất quán
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});