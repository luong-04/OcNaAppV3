// src/stores/settingsStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// (SỬA) Định nghĩa các trường mới
interface SettingsState {
  shopName: string;
  address: string;
  phone: string;
  thankYouMessage: string; // <-- THÊM MỚI
  qrCodeData: string;
  isVatEnabled: boolean;  // <-- THÊM MỚI
  vatPercent: string;     // <-- THÊM MỚI

  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create(
  persist<SettingsState>(
    (set) => ({
      // Giá trị mặc định
      shopName: 'Ốc Na',
      address: '123 Đường ABC, Quận 1, TP. HCM',
      phone: '0909 123 456',
      thankYouMessage: 'Cảm ơn quý khách và hẹn gặp lại!', // <-- MỚI
      qrCodeData: '', 
      isVatEnabled: false, // <-- MỚI
      vatPercent: '8',    // <-- MỚI (mặc định 8%)

      setSettings: (settings) =>
        set((state) => ({
          ...state,
          ...settings,
        })),
    }),
    {
      name: 'ocna-settings-storage',
      storage: createJSONStorage(() => AsyncStorage), 
    }
  )
);