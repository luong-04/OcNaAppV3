import { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { create } from 'zustand'; // (SỬA) Sửa lỗi 'in' thành 'from'
import { supabase } from '../services/supabase';

// (SỬA) Định nghĩa State cho Zustand
export interface AuthState { // (SỬA) Export để home.tsx có thể dùng
  session: Session | null;
  role: 'admin' | 'staff' | null;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({ // (SỬA) Thêm type cho (set)
  session: null,
  role: null,
  setSession: (session: Session | null) => { // (SỬA) Thêm type cho (session)
    const role = session?.user?.user_metadata?.role || null;
    set({ session, role });
  },
}));

// (MỚI) Định nghĩa kiểu cho Context, bao gồm cả isLoading
interface AuthContextType extends AuthState {
  isLoading: boolean;
}

// Context
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Lấy state từ Zustand
  const { session, role, setSession } = useAuthStore();
  // (MỚI) Quản lý isLoading bằng React state, bắt đầu là true
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // (MỚI) Dùng async/await để có thể dùng try...finally
    const fetchSession = async () => {
      try {
        // Lấy session hiện tại khi app mở
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Lỗi khi lấy session:', error);
        setSession(null); // Đảm bảo logout nếu có lỗi
      } finally {
        // (MỚI) Quan trọng: Luôn luôn gọi setIsLoading(false) dù thành công hay thất bại
        setIsLoading(false); 
      }
    };

    fetchSession(); // Gọi hàm async vừa tạo

    // Lắng nghe thay đổi (Login, Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setSession]); // chỉ chạy 1 lần khi AppProvider được mount

  // (SỬA) Sửa toàn bộ lỗi cú pháp JSX
  return (
    <AuthContext.Provider value={{ session, role, setSession, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// (SỬA) Hook này sẽ đọc từ Context (bao gồm isLoading)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context; // Trả về { session, role, setSession, isLoading }
};