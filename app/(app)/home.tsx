// app/(app)/home.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert, Button,
  FlatList,
  Image,
  Modal,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity, View
} from 'react-native';
import { fetchActiveTables, loadTables, saveTables } from '../../src/api/homeApi';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/stores/authStore';

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const role = useAuthStore(state => state.role);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  // 1. === TANSTACK QUERY ===
  // Lấy danh sách bàn CHÍNH từ AsyncStorage
  const { data: tables, isLoading: isLoadingTables } = useQuery({
    queryKey: ['tableList'],
    queryFn: loadTables,
  });

  // Lấy danh sách bàn ĐANG HOẠT ĐỘNG từ Supabase
  // refetchInterval: Tự động hỏi lại server sau mỗi 5 giây
  const { data: activeTables } = useQuery({
    queryKey: ['activeTables'],
    queryFn: fetchActiveTables,
    refetchInterval: 5000, 
  });
  
  // Mutation để LƯU danh sách bàn (sau khi thêm/xóa)
  const saveTablesMutation = useMutation({
    mutationFn: saveTables,
    onSuccess: (updatedTables) => {
      // Cập nhật cache 'tableList' với dữ liệu mới ngay lập tức
      queryClient.setQueryData(['tableList'], updatedTables);
    },
    onError: (err) => Alert.alert('Lỗi', 'Không thể lưu danh sách bàn'),
  });

  // 2. === HÀM XỬ LÝ ===
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const confirmAddTable = () => {
    const name = newTableName.trim();
    if (!name) {
      return Alert.alert('Lỗi', 'Tên bàn không được trống');
    }
    if (tables?.includes(name)) {
      return Alert.alert('Lỗi', 'Tên bàn đã tồn tại');
    }
    
    const newTables = [...(tables || []), name].sort((a, b) => 
      parseInt(a.replace('Bàn ', '')) - parseInt(b.replace('Bàn ', ''))
    );
    saveTablesMutation.mutate(newTables); // Gửi lên mutation
    
    setModalVisible(false);
    setNewTableName('');
  };

  const deleteTable = (tableName: string) => {
    Alert.alert('Xóa bàn', `Bạn có chắc muốn xóa "${tableName}"?`, [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          const newTables = tables?.filter(t => t !== tableName) || [];
          saveTablesMutation.mutate(newTables);
        }
      }
    ]);
  };

  // 3. === RENDER ===
  // Ghi nhớ component, chỉ render lại khi activeTables thay đổi
  const renderTable = useMemo(() => ({ item }: { item: string }) => {
    const isActive = activeTables?.includes(item) || false;
    return (
      <TouchableOpacity
        style={[styles.table, isActive && styles.tableActive]}
        onPress={() => router.push({ pathname: '/(app)/order', params: { tableName: item } })}
        onLongPress={() => role === 'admin' && deleteTable(item)}
      >
        {/* (SỬA) Thêm 2 thuộc tính này vào <Text> */}
        <Text 
          style={[styles.tableText, isActive && styles.tableTextActive]}
          numberOfLines={2} // Cho phép hiển thị tối đa 2 dòng
          adjustsFontSizeToFit // Tự động co nhỏ chữ nếu quá dài
        >
          {item}
        </Text>
        {isActive && <Text style={styles.status}>Đang dùng</Text>}
      </TouchableOpacity>
    );
  }, [activeTables, role]); // Phụ thuộc vào activeTables

  return (
    <View style={styles.container}>
      {/* HEADER: LOGO + ĐĂNG XUẤT */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')} // Đảm bảo bạn có file logo.png trong /assets
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Chọn bàn</Text>
      
      {/* Nút "+ Thêm bàn" cho Admin */}
      {role === 'admin' && (
        <View style={styles.adminRow}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Thêm bàn</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DANH SÁCH BÀN */}
      {isLoadingTables ? (
        <ActivityIndicator size="large" color="#FF6B35" />
      ) : (
        <FlatList
          data={tables}
          numColumns={3}
          keyExtractor={item => item}
          contentContainerStyle={styles.grid}
          renderItem={renderTable}
          // Quan trọng: Báo FlatList biết khi nào cần render lại
          extraData={activeTables} 
        />
      )}

      {/* MODAL THÊM BÀN */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm bàn mới</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập tên bàn (VD: Bàn 13)"
              value={newTableName}
              onChangeText={setNewTableName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button title="Hủy" onPress={() => setModalVisible(false)} color="#999" />
              <Button title="Thêm" onPress={confirmAddTable} color="#FF6B35" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// === STYLES === (Lấy từ file gốc home.tsx của bạn)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, height: 60, },
  logo: { width: 120, height: 50 },
  logoutBtn: { backgroundColor: '#e74c3c', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  logoutText: { color: '#fff', fontSize: 16, fontFamily: 'SVN-Bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 16,fontFamily: 'SVN-Bold' },
  adminRow: { paddingHorizontal: 20, marginBottom: 10, alignItems: 'flex-start' },
  addBtn: { backgroundColor: '#FF6B35', padding: 12, borderRadius: 16, elevation: 3 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 16,fontFamily: 'SVN-Bold' },
  grid: { paddingBottom: 20, paddingHorizontal: 12 },
  table: { flex: 1, margin: 8, height: 110, backgroundColor: '#fff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  tableActive: { backgroundColor: '#FF6B35' },
  tableText: { fontSize: 17, fontWeight: '700', color: '#e74c3c',textAlign: 'center',paddingHorizontal: 4, width: '90%',fontFamily: 'SVN-Bold'},
  tableTextActive: { color: '#fff' },
  status: { fontSize: 13, color: '#fff', marginTop: 6, backgroundColor: '#e74c3c', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontWeight: '600',fontFamily: 'SVN-Bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 20, width: '85%', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 16,fontFamily: 'SVN-Bold' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', padding: 14, borderRadius: 12, fontSize: 16, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around' },
});