// app/(auth)/login.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/stores/authStore';
import { loginSchema, LoginSchema } from '../../types';

// (SỬA) 1. Import `router`
import { router } from 'expo-router';

export default function LoginScreen() {
  const setSession = useAuthStore((state) => state.setSession);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = async (data: LoginSchema) => {
    console.log('Bắt đầu đăng nhập với:', data.email);
    
    const { data: loginResponse, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error('LỖI ĐĂNG NHẬP:', error.message); 
      Alert.alert('Lỗi đăng nhập', error.message);
    } else {
      console.log('ĐĂNG NHẬP THÀNH CÔNG:', loginResponse.user?.email);
      // 1. Cập nhật store (vẫn giữ)
      setSession(loginResponse.session);
      
      // (SỬA) 2. TỰ ĐIỀU HƯỚNG NGAY LẬP TỨC
      router.replace('/(app)/home'); 
    }
  };

  return (
    // ... (Toàn bộ phần JSX và Styles giữ nguyên) ...
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập Ốc Na</Text>
      
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Nhập tài khoản đi mới cho vô cơ"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        )}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Không nhập này thì next lun :))"
            value={value}
            onBlur={onBlur}
            onChangeText={onChange}
            secureTextEntry
          />
        )}
      />
      {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

      <TouchableOpacity 
        style={[styles.btn, isSubmitting && styles.btnDisabled]} 
        onPress={handleSubmit(handleLogin)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ... (Styles giữ nguyên)
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f9f9f9' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 40,fontFamily: 'SVN-Bold' },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, fontSize: 16, elevation: 2 },
  btn: { backgroundColor: '#FF6B35', padding: 16, borderRadius: 16, alignItems: 'center', height: 58, justifyContent: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 18, fontFamily: 'SVN-Bold' },
  errorText: { color: 'red', marginBottom: 10, marginLeft: 5 },
});