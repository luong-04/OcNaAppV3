// src/stores/settingsStore.ts (SỬA TOÀN BỘ)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// (MỚI) Định nghĩa cấu hình 1 máy in
interface PrinterConfig {
  name: string; // Tên gợi nhớ (VD: Bếp, Quầy)
  ip: string;   // IP máy in
  port: string; // Port (thường là 9100)
}

interface SettingsState {
  shopName: string;
  address: string;
  phone: string;
  thankYouMessage: string;
  qrCodeData: string;
  isVatEnabled: boolean;
  vatPercent: string;
  
  // (MỚI) Quản lý 2 máy in
  printer1: PrinterConfig;
  printer2: PrinterConfig;
  
  // (MỚI) Phân công máy in
  // null = dùng in mặc định (PDF/Expo Print)
  // 'printer1' = dùng Máy in 1
  // 'printer2' = dùng Máy in 2
  kitchenPrinterId: 'printer1' | 'printer2' | null;
  paymentPrinterId: 'printer1' | 'printer2' | null;

  setSettings: (settings: Partial<SettingsState>) => void;
  setPrinter: (key: 'printer1' | 'printer2', config: PrinterConfig) => void;
}

const defaultPrinter: PrinterConfig = { name: '', ip: '', port: '9100' };

export const useSettingsStore = create(
  persist<SettingsState>(
    (set) => ({
      // Giá trị mặc định
      shopName: 'Ốc Na',
      address: '123 Đường ABC, Quận 1, TP. HCM',
      phone: '0909 123 456',
      thankYouMessage: 'Cảm ơn quý khách và hẹn gặp lại!',
      qrCodeData: '', 
      isVatEnabled: false, 
      vatPercent: '8',    
      
      // (MỚI) Cài đặt máy in
      printer1: { ...defaultPrinter, name: 'Máy in 1' },
      printer2: { ...defaultPrinter, name: 'Máy in 2' },
      kitchenPrinterId: null, // Mặc định dùng in PDF
      paymentPrinterId: null, // Mặc định dùng in PDF

      setSettings: (settings) =>
        set((state) => ({
          ...state,
          ...settings,
        })),
      
      // (MỚI) Hàm cập nhật máy in riêng
      setPrinter: (key, config) =>
        set((state) => ({
          ...state,
          [key]: config,
        })),
    }),
    {
      name: 'ocna-settings-storage',
      storage: createJSONStorage(() => AsyncStorage), 
    }
  )
);