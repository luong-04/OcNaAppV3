// src/api/homeApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

const TABLES_STORAGE_KEY = 'ocna_tables';

/**
 * Lấy danh sách bàn CHÍNH (master list) từ bộ nhớ local.
 * Đây là cấu hình của quán.
 */
export const loadTables = async (): Promise<string[]> => {
  const saved = await AsyncStorage.getItem(TABLES_STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  // Dữ liệu mặc định nếu lần đầu chạy app
  const defaultTables = Array.from({ length: 12 }, (_, i) => `Bàn ${i + 1}`);
  await AsyncStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(defaultTables));
  return defaultTables;
};

/**
 * Lưu lại danh sách bàn CHÍNH (master list) vào bộ nhớ local.
 */
export const saveTables = async (tables: string[]): Promise<string[]> => {
  await AsyncStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(tables));
  return tables;
};

/**
 * Lấy danh sách bàn ĐANG HOẠT ĐỘNG (có đơn 'open') từ Supabase.
 */
export const fetchActiveTables = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('table_name')
    .eq('status', 'open');
    
  if (error) throw new Error(error.message);

  // Dùng Set để loại bỏ các tên bàn trùng lặp
  const activeTableSet = new Set(data.map(order => order.table_name));
  return Array.from(activeTableSet);
};