import { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface AuthState {
  session: Session | null;
  role: 'admin' | 'staff' | null;
  // SỬA: setSession giờ là async (bất đồng bộ)
  setSession: (session: Session | null) => Promise<void>; 
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  role: null,
  // SỬA: Logic setSession phải lấy role từ bảng 'profiles'
  setSession: async (session: Session | null) => {
    let role: 'admin' | 'staff' | null = null;
    
    if (session) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          // SỬA: Kiểm tra kiểu (type) của role
          const dbRole = profile.role;
          if (dbRole === 'admin' || dbRole === 'staff') {
            role = dbRole; 
          }
        }
      } catch (e) {
        console.error("Lỗi khi lấy profile role:", e);
      }
    }
    set({ session, role });
  },
}));

interface AuthContextType extends AuthState {
  isLoading: boolean;
}
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { session, role, setSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Hàm để lấy session ban đầu
    const fetchInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await setSession(session); // (await) Rất quan trọng
      } catch (e) {
        console.error("Lỗi khi fetch session ban đầu:", e);
        await setSession(null);
      } finally {
        // SỬA: Luôn tắt loading để hết "xoay"
        setIsLoading(false); 
      }
    };
    fetchInitialSession();

    // 2. Lắng nghe thay đổi (Login, Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await setSession(session); // (await) Rất quan trọng
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [setSession]);

  return (
    <AuthContext.Provider value={{ session, role, setSession, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};