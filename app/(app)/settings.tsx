// D:/OcNaAppV2/app/(app)/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useSettingsStore } from '../../src/stores/settingsStore';

// (SỬA) Định nghĩa Props ở đây
interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// Component Accordion (Thu gọn)
const CollapsibleSection = ({ title, children, defaultOpen = false }: CollapsibleProps) => { // (SỬA) Sử dụng Props đã định nghĩa
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <View style={styles.formContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => setIsOpen(!isOpen)}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={24} color="#333" />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.sectionContent}>
          {children}
        </View>
      )}
    </View>
  );
};

// Component quản lý 1 máy in
const PrinterSettings = ({ printerKey }: { printerKey: 'printer1' | 'printer2' }) => {
  const printer = useSettingsStore(state => state[printerKey]);
  const setPrinter = useSettingsStore(state => state.setPrinter);

  const updateField = (field: 'name' | 'ip' | 'port', value: string) => {
    setPrinter(printerKey, { ...printer, [field]: value });
  };

  return (
    <View style={styles.printerBox}>
      <Text style={styles.label}>Tên gợi nhớ (VD: Bếp)</Text>
      <TextInput
        style={styles.input}
        value={printer.name}
        onChangeText={(text) => updateField('name', text)}
        placeholder="VD: Máy in Bếp"
      />
      <Text style={styles.label}>Địa chỉ IP (LAN/WiFi)</Text>
      <TextInput
        style={styles.input}
        value={printer.ip}
        onChangeText={(text) => updateField('ip', text)}
        placeholder="VD: 192.168.1.100"
        keyboardType="numbers-and-punctuation"
      />
      <Text style={styles.label}>Cổng kết nối (Port)</Text>
      <TextInput
        style={styles.input}
        value={printer.port}
        onChangeText={(text) => updateField('port', text)}
        keyboardType="numeric"
        placeholder="9100"
      />
    </View>
  );
};

// Component chọn máy in cho chức năng
const PrinterAssignment = ({ title, assignmentKey }: { title: string, assignmentKey: 'kitchenPrinterId' | 'paymentPrinterId' }) => {
  const { p1Name, p2Name, value, setSettings } = useSettingsStore(useShallow(state => ({
    p1Name: state.printer1.name,
    p2Name: state.printer2.name,
    value: state[assignmentKey],
    setSettings: state.setSettings,
  })));

  const options = [
    { id: null, label: 'Mặc định (In PDF/Chia sẻ)' },
    { id: 'printer1', label: p1Name || 'Máy in 1' },
    { id: 'printer2', label: p2Name || 'Máy in 2' },
  ];

  return (
    <View style={styles.assignmentBox}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.pickerRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.id || 'null'}
            style={[styles.pickerBtn, value === opt.id && styles.pickerBtnActive]}
            onPress={() => setSettings({ [assignmentKey]: opt.id })}
          >
            <Text style={[styles.pickerText, value === opt.id && styles.pickerTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};


export default function SettingsScreen() {
  const {
    shopName, address, phone, thankYouMessage, qrCodeData,
    isVatEnabled, vatPercent, setSettings
  } = useSettingsStore(useShallow(state => ({
    shopName: state.shopName,
    address: state.address,
    phone: state.phone,
    thankYouMessage: state.thankYouMessage,
    qrCodeData: state.qrCodeData,
    isVatEnabled: state.isVatEnabled,
    vatPercent: state.vatPercent,
    setSettings: state.setSettings,
  })));

  const updateSetting = (key: string, value: string | boolean) => {
    setSettings({ [key]: value });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.title}>Cài đặt Quán ăn</Text>

      <CollapsibleSection title="1. Thông tin chung (in trên bill)">
        <Text style={styles.label}>Tên quán</Text>
        <TextInput style={styles.input} value={shopName} onChangeText={(text) => updateSetting('shopName', text)} />
        <Text style={styles.label}>Địa chỉ</Text>
        <TextInput style={styles.input} value={address} onChangeText={(text) => updateSetting('address', text)} />
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput style={styles.input} value={phone} onChangeText={(text) => updateSetting('phone', text)} keyboardType="phone-pad" />
        <Text style={styles.label}>Lời cảm ơn (cuối bill)</Text>
        <TextInput style={styles.input} value={thankYouMessage} onChangeText={(text) => updateSetting('thankYouMessage', text)} />
        <Text style={styles.label}>Dữ liệu Mã QR Thanh Toán (VietQR)</Text>
        <TextInput style={[styles.input, { height: 100 }]} placeholder="Dán chuỗi VietQR của bạn vào đây..." value={qrCodeData} onChangeText={(text) => updateSetting('qrCodeData', text)} multiline textAlignVertical="top" />
      </CollapsibleSection>

      <CollapsibleSection title="2. Thuế & Phí">
        <View style={styles.switchRow}>
          <Text style={styles.label}>Áp dụng thuế (VAT)</Text>
          <Switch trackColor={{ false: '#767577', true: '#FF6B35' }} thumbColor="#f4f3f4" onValueChange={(value) => updateSetting('isVatEnabled', value)} value={isVatEnabled} />
        </View>
        {isVatEnabled && (
          <>
            <Text style={styles.label}>Mức thuế (%)</Text>
            <TextInput style={styles.input} value={vatPercent} onChangeText={(text) => updateSetting('vatPercent', text)} keyboardType="numeric" placeholder="8" />
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="3. Cài đặt Máy in (Nâng cao)" defaultOpen={true}>
        <Text style={styles.helpText}>
          Thiết lập máy in nhiệt (thermal printer) kết nối qua mạng LAN/WiFi bằng giao thức ESC/POS.
        </Text>
        
        {/* Cấu hình 2 máy in */}
        <PrinterSettings printerKey="printer1" />
        <PrinterSettings printerKey="printer2" />

        <View style={styles.separator} />

        {/* Phân công máy in */}
        <PrinterAssignment title="Chức năng In Bếp" assignmentKey="kitchenPrinterId" />
        <PrinterAssignment title="Chức năng In Thanh Toán" assignmentKey="paymentPrinterId" />

      </CollapsibleSection>
    </ScrollView>
  );
}

// (SỬA) Cập nhật styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 20 },
  
  // (MỚI) Styles cho Accordion
  formContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, elevation: 2, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '600', color: '#333' },
  sectionContent: { paddingTop: 16 },

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
  helpText: { fontSize: 14, color: '#7f8c8d', fontStyle: 'italic', lineHeight: 20, marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  
  // (MỚI) Styles cho Máy in
  printerBox: { backgroundColor: '#fdfdfd', borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 16 },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  assignmentBox: { marginBottom: 12 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerBtnActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  pickerText: { color: '#333', fontWeight: '500' },
  pickerTextActive: { color: '#fff', fontWeight: '700' },
});