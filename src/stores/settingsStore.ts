// File: src/stores/settingsStore.ts
// (SỬA: Đổi printer1/printer2 thành string và export SettingsState)

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// SỬA: Xóa bỏ 'PrinterConfig', vì chúng ta dùng string
// type PrinterConfig = {
//   name: string;
//   ip: string;
//   port: string;
// };

// SỬA: Thêm 'export' để settings.tsx có thể import
export interface SettingsState {
  shopName: string;
  address: string;
  phone: string;
  
  // SỬA: Đổi printer1/printer2 từ PrinterConfig thành string
  printer1: string; // Sẽ lưu dạng "192.168.1.100:9100"
  printer2: string; // Sẽ lưu dạng "192.168.1.101:9100"
  
  kitchenPrinterId: 'printer1' | 'printer2' | null;
  paymentPrinterId: 'printer1' | 'printer2' | null;
  thankYouMessage: string;
  qrCodeData: string;
  isVatEnabled: boolean;
  vatPercent: number;

  // SỬA: setSettings để nhận Partial (bản cập nhật 1 phần)
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create(
  persist<SettingsState>(
    (set) => ({
      shopName: 'Ốc Na V2',
      address: '123 Đường ABC, Q1, TPHCM',
      phone: '0901234567',
      
      // SỬA: Đổi giá trị mặc định thành chuỗi rỗng
      printer1: '',
      printer2: '',
      
      kitchenPrinterId: null,
      paymentPrinterId: null,
      thankYouMessage: 'Cảm ơn quý khách!',
      qrCodeData: '',
      isVatEnabled: false,
      vatPercent: 10,
      
      // SỬA: Logic setSettings
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);