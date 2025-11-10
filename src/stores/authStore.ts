// src/stores/authStore.ts
import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

type Role = 'admin' | 'staff';

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role | null;
  isReady: boolean; // <-- THÊM DÒNG NÀY
  setSession: (session: Session | null) => void;
  markReady: () => void; // <-- THÊM DÒNG NÀY
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  role: null,
  isReady: false, // <-- Giá trị mặc định là false
  setSession: (session) => {
    const user = session?.user ?? null;
    const role = (user?.app_metadata?.role as Role) ?? null;
    set({ session, user, role });
  },
  // Hàm để đánh dấu là đã sẵn sàng
  markReady: () => set({ isReady: true }), 
}));