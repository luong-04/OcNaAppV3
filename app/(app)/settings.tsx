// app/(app)/settings.tsx
import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'; // (SỬA) Import thêm Switch
import { useSettingsStore } from '../../src/stores/settingsStore';

// (SỬA) Lấy kiểu State
type SettingsKeys = keyof Omit<ReturnType<typeof useSettingsStore.getState>, 'setSettings'>;

export default function SettingsScreen() {
  // (SỬA) Lấy TẤT CẢ state (chọn riêng lẻ để tránh lỗi vòng lặp)
  const shopName = useSettingsStore((state) => state.shopName);
  const address = useSettingsStore((state) => state.address);
  const phone = useSettingsStore((state) => state.phone);
  const thankYouMessage = useSettingsStore((state) => state.thankYouMessage);
  const qrCodeData = useSettingsStore((state) => state.qrCodeData);
  const isVatEnabled = useSettingsStore((state) => state.isVatEnabled);
  const vatPercent = useSettingsStore((state) => state.vatPercent);
  const setSettings = useSettingsStore((state) => state.setSettings);

  // (SỬA) Hàm helper cập nhật (dùng cho cả text và switch)
  const updateSetting = (key: SettingsKeys, value: string | boolean) => {
    setSettings({ [key]: value });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cài đặt Quán ăn</Text>

      <Text style={styles.sectionTitle}>Thông tin chung (in trên bill)</Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Tên quán</Text>
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={(text) => updateSetting('shopName', text)}
        />

        <Text style={styles.label}>Địa chỉ</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={(text) => updateSetting('address', text)}
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={(text) => updateSetting('phone', text)}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Lời cảm ơn (cuối bill)</Text>
        <TextInput
          style={styles.input}
          value={thankYouMessage}
          onChangeText={(text) => updateSetting('thankYouMessage', text)}
        />

        <Text style={styles.label}>Dữ liệu Mã QR Thanh Toán (VietQR)</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Dán chuỗi VietQR của bạn vào đây..."
          value={qrCodeData}
          onChangeText={(text) => updateSetting('qrCodeData', text)}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* (MỚI) Phần Thuế & Phí */}
      <Text style={styles.sectionTitle}>Thuế & Phí</Text>
      <View style={styles.formContainer}>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Áp dụng thuế (VAT)</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#FF6B35' }}
            thumbColor={isVatEnabled ? '#f4f3f4' : '#f4f3f4'}
            onValueChange={(value) => updateSetting('isVatEnabled', value)}
            value={isVatEnabled}
          />
        </View>

        {/* Chỉ hiện ô nhập % khi VAT được bật */}
        {isVatEnabled && (
          <>
            <Text style={styles.label}>Mức thuế (%)</Text>
            <TextInput
              style={styles.input}
              value={vatPercent}
              onChangeText={(text) => updateSetting('vatPercent', text)}
              keyboardType="numeric"
              placeholder="8"
            />
          </>
        )}
      </View>

      {/* (MỚI) Phần Máy In (Chỉ giải thích) */}
      <Text style={styles.sectionTitle}>Máy in</Text>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Kết nối máy in (LAN/Wifi)</Text>
        <Text style={styles.helpText}>
          Hiện tại, app đang dùng chức năng in mặc định của điện thoại (Expo Print).
          {"\n\n"}
          Để in, bạn cần:
          {"\n"}
          1. Vào "Cài đặt" của điện thoại (không phải app này).
          {"\n"}
          2. Kết nối điện thoại với máy in qua Wifi hoặc Bluetooth.
          {"\n"}
          3. Khi nhấn "In" trong app, điện thoại sẽ tự tìm thấy máy in đó.
        </Text>
      </View>
    </ScrollView>
  );
}

// (SỬA) Cập nhật styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginTop: 10, marginBottom: 10, paddingHorizontal: 4 },
  formContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  }
});