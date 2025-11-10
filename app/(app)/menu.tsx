// app/(app)/menu.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  deleteCategory // (SỬA) Import API mới
  ,





















  deleteMenuItem,
  fetchCategories, fetchMenuItems,
  type MenuItemWithCategory,
  upsertCategory,
  upsertMenuItem
} from '../../src/api/menuApi';
import {
  categorySchema, CategorySchema // (SỬA) Import schema mới
  ,





















  menuItemSchema, MenuItemSchema
} from '../../types';

export default function MenuScreen() {
  const queryClient = useQueryClient();

  // State cho 2 form
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);

  // === LẤY DỮ LIỆU ===
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const { data: menuItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ['menuItems'],
    queryFn: fetchMenuItems,
  });

  // === FORM MÓN ĂN (MENU ITEM) ===
  const { 
    control: itemControl, 
    handleSubmit: handleItemSubmit, 
    reset: resetItemForm 
  } = useForm<MenuItemSchema>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: { name: '', price: 0, category_id: categories?.[0]?.id || 1 },
  });

  // === FORM DANH MỤC (CATEGORY) ===
  const { 
    control: categoryControl, 
    handleSubmit: handleCategorySubmit, 
    reset: resetCategoryForm,
    setValue: setCategoryValue
  } = useForm<CategorySchema>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  // === MUTATIONS (MÓN ĂN) ===
  const upsertItemMutation = useMutation({
    mutationFn: upsertMenuItem,
    onSuccess: () => {
      Alert.alert('Thành công', editItemId ? 'Đã cập nhật món!' : 'Đã thêm món!');
      resetItemForm({ name: '', price: 0, category_id: categories?.[0]?.id || 1 });
      setEditItemId(null);
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
    onError: (err) => Alert.alert('Lỗi', err.message),
  });

  const deleteItemMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      Alert.alert('Đã xóa món');
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    },
    onError: (err) => Alert.alert('Lỗi', err.message),
  });

  // === MUTATIONS (DANH MỤC) ===
  const upsertCategoryMutation = useMutation({
    mutationFn: upsertCategory,
    onSuccess: () => {
      Alert.alert('Thành công', editCategoryId ? 'Đã cập nhật DM!' : 'Đã thêm DM!');
      resetCategoryForm({ name: '' });
      setEditCategoryId(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] }); // Làm mới cả món ăn
    },
    onError: (err) => Alert.alert('Lỗi', err.message),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      Alert.alert('Đã xóa DM');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['menuItems'] }); // Làm mới cả món ăn
    },
    onError: (err) => Alert.alert('Lỗi', err.message),
  });

  // === HÀM XỬ LÝ (MÓN ĂN) ===
  const onItemSubmit = (data: MenuItemSchema) => {
    upsertItemMutation.mutate(editItemId ? { ...data, id: editItemId } : data);
  };
  const handleEditItem = (item: MenuItemWithCategory) => {
    setEditItemId(item.id);
    resetItemForm({
      name: item.name,
      price: item.price,
      category_id: item.category_id || (categories?.[0]?.id || 1),
    });
  };
  const handleDeleteItem = (id: number) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc muốn xóa MÓN ĂN này?', [
      { text: 'Hủy' },
      { text: 'Xóa', onPress: () => deleteItemMutation.mutate(id), style: 'destructive' },
    ]);
  };

  // === HÀM XỬ LÝ (DANH MỤC) ===
  const onCategorySubmit = (data: CategorySchema) => {
    upsertCategoryMutation.mutate(editCategoryId ? { ...data, id: editCategoryId } : data);
  };
  const handleEditCategory = (cat: { id: number; name: string }) => {
    setEditCategoryId(cat.id);
    setCategoryValue('name', cat.name);
  };
  const handleDeleteCategory = (id: number) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc muốn xóa DANH MỤC này? Các món ăn thuộc DM này sẽ bị "mồ côi".', [
      { text: 'Hủy' },
      { text: 'Xóa', onPress: () => deleteCategoryMutation.mutate(id), style: 'destructive' },
    ]);
  };

  if (isLoadingCategories || isLoadingItems) {
    return <ActivityIndicator size="large" color="#FF6B35" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Quản lý Thực đơn</Text>

      {/* === FORM DANH MỤC === */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>{editCategoryId ? 'Sửa Danh Mục' : 'Thêm Danh Mục'}</Text>
        <Controller
          control={categoryControl}
          name="name"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <>
              <TextInput placeholder="Tên danh mục" value={value} onChangeText={onChange} onBlur={onBlur} style={styles.input} />
              {error && <Text style={styles.error}>{error.message}</Text>}
            </>
          )}
        />
        <TouchableOpacity 
          style={[styles.btn, (upsertCategoryMutation.isPending) && styles.btnDisabled]} 
          onPress={handleCategorySubmit(onCategorySubmit)}
          disabled={upsertCategoryMutation.isPending}
        >
          <Text style={styles.btnText}>{editCategoryId ? 'Cập nhật DM' : 'Thêm DM'}</Text>
        </TouchableOpacity>
        {editCategoryId && (
          <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => { setEditCategoryId(null); resetCategoryForm({ name: '' }); }}>
            <Text style={styles.btnText}>Hủy</Text>
          </TouchableOpacity>
        )}
        {/* Danh sách danh mục */}
        {categories?.map((cat) => (
          <View key={cat.id} style={styles.item}>
            <Text style={styles.itemName}>{cat.name}</Text>
            <View style={styles.actions}>
              <Button title="Sửa" onPress={() => handleEditCategory(cat)} color="#3498db" />
              <Button title="Xóa" color="#e74c3c" onPress={() => handleDeleteCategory(cat.id)} />
            </View>
          </View>
        ))}
      </View>

      {/* === FORM MÓN ĂN === */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>{editItemId ? 'Sửa Món Ăn' : 'Thêm Món Ăn'}</Text>
        <Controller
          control={itemControl}
          name="name"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <>
              <TextInput placeholder="Tên món" value={value} onChangeText={onChange} onBlur={onBlur} style={styles.input} />
              {error && <Text style={styles.error}>{error.message}</Text>}
            </>
          )}
        />
        <Controller
          control={itemControl}
          name="price"
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <>
              <TextInput placeholder="Giá" value={String(value || '')} onChangeText={onChange} onBlur={onBlur} style={styles.input} keyboardType="numeric" />
              {error && <Text style={styles.error}>{error.message}</Text>}
            </>
          )}
        />
        <Controller
          control={itemControl}
          name="category_id"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.pickerContainer}>
              <Picker selectedValue={value} onValueChange={onChange} style={styles.picker}>
                {categories?.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                ))}
              </Picker>
              {error && <Text style={styles.error}>{error.message}</Text>}
            </View>
          )}
        />
        <TouchableOpacity 
          style={[styles.btn, (upsertItemMutation.isPending) && styles.btnDisabled]} 
          onPress={handleItemSubmit(onItemSubmit)}
          disabled={upsertItemMutation.isPending}
        >
          <Text style={styles.btnText}>{editItemId ? 'Cập nhật Món' : 'Thêm Món'}</Text>
        </TouchableOpacity>
        {editItemId && (
          <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => { setEditItemId(null); resetItemForm({ name: '', price: 0, category_id: categories?.[0]?.id || 1 }); }}>
            <Text style={styles.btnText}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* === DANH SÁCH MÓN ĂN === */}
      <Text style={styles.label}>Danh sách món</Text>
      {menuItems?.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemDetails}>{item.price.toLocaleString()}đ - (DM: {item.categories?.name ?? 'Chưa có'})</Text>
          </View>
          <View style={styles.actions}>
            <Button title="Sửa" onPress={() => handleEditItem(item)} color="#3498db" />
            <Button title="Xóa" color="#e74c3c" onPress={() => handleDeleteItem(item.id)} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9ff' },
  contentContainer: { padding: 16 },
  title: { fontSize: 24, color: '#FF6B35', textAlign: 'center', marginBottom: 16,fontFamily: 'SVN-Bold' },
  formContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, marginBottom: 24 },
  label: { fontSize: 18, marginBottom: 12, fontFamily: 'SVN-Bold' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 12, marginBottom: 12, backgroundColor: '#fff', fontSize: 16 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, marginBottom: 12, backgroundColor: '#fff', justifyContent: 'center' },
  picker: { height: 50 },
  error: { color: 'red', marginBottom: 8, marginTop: -8, marginLeft: 5 },
  btn: { backgroundColor: '#FF6B35', padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  btnCancel: { backgroundColor: '#7f8c8d' },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'SVN-Bold' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, elevation: 1 },
  itemInfo: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 16, fontWeight: '600',fontFamily: 'SVN-Bold' },
  itemDetails: { color: '#555', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
});