// app/(app)/staff.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  createStaffUser,
  fetchStaff,
  updateStaffUser,
  type Profile
} from '../../src/api/staffApi';
import {
  editStaffSchema, EditStaffSchema,
  staffSchema, StaffSchema,
  type Role
} from '../../types';

export default function StaffScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: fetchStaff,
  });

  // === Form TẠO User ===
  const { control: createControl, handleSubmit: handleCreateSubmit, reset: resetCreateForm, formState: { errors: createErrors } } = useForm<StaffSchema>({
    resolver: zodResolver(staffSchema),
    defaultValues: { email: '', password: '' },
  });
  const createStaffMutation = useMutation({
    mutationFn: createStaffUser,
    onSuccess: () => {
      Alert.alert('Thành công', `Đã tạo tài khoản nhân viên mới.`);
      resetCreateForm(); 
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err) => Alert.alert('Lỗi', err.message),
  });
  const onCreateSubmit = (data: StaffSchema) => createStaffMutation.mutate(data);

  // === Form SỬA User ===
  const { control: editControl, handleSubmit: handleEditSubmit, reset: resetEditForm, formState: { errors: editErrors } } = useForm<EditStaffSchema>({
    resolver: zodResolver(editStaffSchema),
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: EditStaffSchema) => 
      updateStaffUser(selectedUser!.id, data),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã cập nhật thông tin.');
      setModalVisible(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err) => Alert.alert('Lỗi', err.message),
  });
  const onEditSubmit = (data: EditStaffSchema) => updateUserMutation.mutate(data);

  // === Hàm mở Modal Sửa ===
  const openEditModal = (user: Profile) => {
    setSelectedUser(user);
    resetEditForm({
      email: user.email || '',
      password: '', 
      role: (user.role as Role) || 'staff'
    });
    setModalVisible(true);
  };

  if (isLoading) {
    return <ActivityIndicator size="large" color="#FF6B35" style={{ flex: 1, justifyContent: 'center' }} />;
  }
  
  // (SỬA) Bỏ ScrollView
  return (
    <View style={styles.container}>
      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContentContainer} // (SỬA) Thêm padding ở đây
        // (SỬA) Đưa Form và Title vào Header của FlatList
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Quản lý Nhân viên</Text>
            
            {/* Form Tạo User */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>Tạo nhân viên mới</Text>
              <Controller
                control={createControl}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <TextInput style={styles.input} placeholder="Email nhân viên" value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none" keyboardType="email-address" />
                    {createErrors.email && <Text style={styles.error}>{createErrors.email.message}</Text>}
                  </>
                )}
              />
              <Controller
                control={createControl}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <>
                    <TextInput style={styles.input} placeholder="Mật khẩu (ít nhất 6 ký tự)" value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry />
                    {createErrors.password && <Text style={styles.error}>{createErrors.password.message}</Text>}
                  </>
                )}
              />
              <TouchableOpacity 
                style={[styles.btn, createStaffMutation.isPending && styles.btnDisabled]}
                onPress={handleCreateSubmit(onCreateSubmit)}
                disabled={createStaffMutation.isPending}
              >
                <Text style={styles.btnText}>
                  {createStaffMutation.isPending ? "Đang tạo..." : "Tạo tài khoản"}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Danh sách hiện tại</Text>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => openEditModal(item)}>
            <Text style={styles.itemName}>{item.email}</Text>
            <Text style={styles.itemRole}>{item.role || 'staff'}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Modal Sửa Role (Để bên ngoài FlatList) */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sửa thông tin</Text>
            
            <Controller
              control={editControl}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput style={styles.input} value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none" keyboardType="email-address" />
                  {editErrors.email && <Text style={styles.error}>{editErrors.email.message}</Text>}
                </>
              )}
            />

            <Controller
              control={editControl}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <>
                  <Text style={styles.inputLabel}>Mật khẩu mới (Bỏ trống nếu không đổi)</Text>
                  <TextInput style={styles.input} placeholder="Ít nhất 6 ký tự" value={value || ''} onChangeText={onChange} onBlur={onBlur} secureTextEntry />
                  {editErrors.password && <Text style={styles.error}>{editErrors.password.message}</Text>}
                </>
              )}
            />
            
            <Text style={styles.inputLabel}>Quyền</Text>
            <Controller
              control={editControl}
              name="role"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={value} onValueChange={onChange}>
                    <Picker.Item label="Nhân viên (Staff)" value="staff" />
                    <Picker.Item label="Quản lý (Admin)" value="admin" />
                  </Picker>
                </View>
              )}
            />

            <View style={styles.modalActions}>
              <Button title="Hủy" onPress={() => setModalVisible(false)} color="#7f8c8d" />
              <Button 
                title="Lưu" 
                onPress={handleEditSubmit(onEditSubmit)} 
                disabled={updateUserMutation.isPending}
                color="#FF6B35"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View> // (SỬA) Đây là </View> của container
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' }, // (SỬA) Bỏ padding
  listContentContainer: { padding: 16 }, // (MỚI) Thêm padding cho nội dung list
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 20,fontFamily: 'SVN-Bold' },
  formContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 24 },
  label: { fontSize: 18, fontWeight: '600', marginBottom: 12, fontFamily: 'SVN-Bold' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 12, marginBottom: 12, backgroundColor: '#fff', fontSize: 16 },
  error: { color: 'red', marginBottom: 8, marginTop: -8, marginLeft: 5 },
  btn: { backgroundColor: '#FF6B35', padding: 14, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16, fontFamily: 'SVN-Bold' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 1 },
  itemName: { fontSize: 16, fontWeight: '600', fontFamily: 'SVN-Bold' },
  itemRole: { fontSize: 14, color: '#FF6B35', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'SVN-Bold' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 20, width: '90%', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20, fontFamily: 'SVN-Bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginLeft: 4, fontFamily: 'SVN-Bold' },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, marginBottom: 24 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
});