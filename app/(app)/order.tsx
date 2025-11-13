// app/(app)/order.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { fetchCategories, fetchMenuItems } from '../../src/api/menuApi';
import {
  createOrder,
  fetchOpenOrderForTable,
  updateOrderStatus,
  upsertOrderItems
} from '../../src/api/orderApi';
import { printKitchenBill, printPaymentBill } from '../../src/services/printService';
import { useSettingsStore } from '../../src/stores/settingsStore';

type CartState = Map<number, number>;

export default function OrderScreen() {
  const queryClient = useQueryClient();
  const { tableName } = useLocalSearchParams<{ tableName: string }>();

  const settings = useSettingsStore(); 
  const { isVatEnabled, vatPercent: globalVatPercent } = useSettingsStore(
    useShallow((state) => ({
      isVatEnabled: state.isVatEnabled,
      vatPercent: state.vatPercent,
    }))
  );

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [draftItems, setDraftItems] = useState<CartState>(new Map());
  const [orderId, setOrderId] = useState<number | null>(null);
  const [printedItems, setPrintedItems] = useState<CartState>(new Map());
  const [discountPercent, setDiscountPercent] = useState('0');

  // 1. === LẤY DỮ LIỆU ===
  const { data: menu, isLoading: isLoadingMenu } = useQuery({
    queryKey: ['menuItems'],
    queryFn: fetchMenuItems,
  });
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const { data: orderData, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order', tableName], 
    queryFn: () => fetchOpenOrderForTable(tableName!),
  });

  // 2. === HYDRATE STATE (Đổ dữ liệu vào state) ===
  useEffect(() => {
    if (orderData) {
      setOrderId(orderData.id);
      const newCart = new Map<number, number>();
      orderData.order_items.forEach(item => {
        if (item.menu_item_id) {
          newCart.set(item.menu_item_id, item.quantity);
        }
      });
      setDraftItems(newCart);
      setPrintedItems(new Map(newCart));
    } else {
      setOrderId(null);
      setDraftItems(new Map());
      setPrintedItems(new Map());
    }
  }, [orderData]);

  // 3. === MUTATIONS ===
  const createOrderMutation = useMutation({
    mutationFn: (tableName: string) => createOrder(tableName),
    onSuccess: (newOrder) => {
      setOrderId(newOrder.id);
      saveItemsMutation.mutate(newOrder.id);
    },
    onError: (err) => Alert.alert('Lỗi', `Không thể tạo đơn hàng: ${err.message}`),
  });

  const saveItemsMutation = useMutation({
    mutationFn: (currentOrderId: number) => {
      const itemsToSave = Array.from(draftItems.entries())
        .map(([id, qty]) => ({
          menu_item_id_input: id,
          quantity_input: qty
        }));
      return upsertOrderItems({ 
        order_id_input: currentOrderId, 
        items_input: itemsToSave 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', tableName] });
      queryClient.invalidateQueries({ queryKey: ['activeTables'] });
      handlePrintKitchen();
    },
    onError: (err) => Alert.alert('Lỗi', `Không thể lưu món: ${err.message}`),
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => updateOrderStatus(id, 'paid'),
    onSuccess: () => {
      Alert.alert('Thành công', 'Đã thanh toán!');
      queryClient.invalidateQueries({ queryKey: ['activeTables'] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      queryClient.removeQueries({ queryKey: ['order', tableName] });
      router.back();
    },
    onError: (err) => Alert.alert('Lỗi', `Không thể thanh toán: ${err.message}`),
  });

  // 4. === TÍNH TOÁN DỮ LIỆU (MEMO) ===
  const calculations = useMemo(() => {
    const subtotal = Array.from(draftItems.entries()).reduce((sum, [id, qty]) => {
      const menuItem = menu?.find(m => m.id === id);
      return sum + (menuItem?.price || 0) * qty;
    }, 0);
    const discountNum = parseFloat(discountPercent) || 0;
    const vatNum = isVatEnabled ? (parseFloat(globalVatPercent) || 0) : 0;
    const discountAmount = (subtotal * discountNum) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatAmount = (subtotalAfterDiscount * vatNum) / 100;
    const finalTotal = subtotalAfterDiscount + vatAmount;
    return { subtotal, discountAmount, vatAmount, finalTotal };
  }, [draftItems, menu, discountPercent, isVatEnabled, globalVatPercent]);

  // (SỬA) Bổ sung filteredMenu
  const filteredMenu = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return menu?.filter(item => {
      const matchesSearch = !search || item.name.toLowerCase().includes(lowerSearch);
      const matchesCategory = selectedCategory === null || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, search, selectedCategory]);
  
  // 5. === HÀM XỬ LÝ (HANDLERS) ===
  const handleUpdateQuantity = (menuItemId: number, delta: 1 | -1) => {
    setDraftItems(prevCart => {
      const newCart = new Map(prevCart);
      const currentQty = newCart.get(menuItemId) || 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        newCart.delete(menuItemId);
      } else {
        newCart.set(menuItemId, newQty);
      }
      return newCart;
    });
  };
  
  const handleSaveAndPrint = () => {
    if (draftItems.size === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng trống!');
      return;
    }
    if (orderId) {
      saveItemsMutation.mutate(orderId);
    } else {
      createOrderMutation.mutate(tableName!);
    }
  };

  const handlePrintKitchen = () => {
    if (!menu) return;
    const itemsToPrint = new Map<number, number>();
    draftItems.forEach((currentQty, id) => {
      const printedQty = printedItems.get(id) || 0;
      const diff = currentQty - printedQty;
      if (diff > 0) {
        itemsToPrint.set(id, diff);
      }
    });
    if (itemsToPrint.size === 0) {
      Alert.alert('Thông báo', 'Đã lưu. Không có món mới để in bếp.');
    } else {
      // (SỬA): Truyền toàn bộ settings thay vì chỉ shopName
      printKitchenBill(tableName!, itemsToPrint, menu, settings); 
    }
    setPrintedItems(new Map(draftItems));
  };

  const handlePay = () => {
    if (draftItems.size === 0 || !orderId || !menu) {
      Alert.alert('Thông báo', 'Không có gì để thanh toán');
      return;
    }
    printPaymentBill(
      tableName!, 
      draftItems,
      menu, 
      settings,
      calculations,
      () => {
        payMutation.mutate(orderId);
      }
    );
  };

  if (isLoadingMenu || isLoadingCategories || isLoadingOrder) {
    return <ActivityIndicator size="large" color="#FF6B35" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  // 6. === RENDER ===
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{tableName}</Text>
      <TextInput
        style={styles.search}
        placeholder="Tìm món..."
        value={search}
        onChangeText={setSearch}
      />
      <View>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryBtn, selectedCategory === item.id && styles.categoryBtnActive]}
              onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <FlatList
        data={filteredMenu} 
        numColumns={2}
        keyExtractor={item => item.id.toString()}
        scrollEnabled={false} 
        renderItem={({ item }) => {
          const qty = draftItems.get(item.id) || 0; 
          return (
            <View style={styles.menuCard}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuPrice}>{item.price.toLocaleString()}đ</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQuantity(item.id, -1)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qty}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQuantity(item.id, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      <View style={styles.footer}>
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Tiền hàng:</Text>
          <Text style={styles.calcValue}>{calculations.subtotal.toLocaleString()}đ</Text>
        </View>
        <View style={styles.calcRowInput}>
          <Text style={styles.calcLabel}>Giảm giá (%):</Text>
          <TextInput
            style={styles.inputPercent}
            value={discountPercent}
            onChangeText={setDiscountPercent}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Tiền giảm:</Text>
          <Text style={styles.calcValue}>-{calculations.discountAmount.toLocaleString()}đ</Text>
        </View>
        {isVatEnabled && (
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>VAT ({globalVatPercent}%):</Text>
            <Text style={styles.calcValue}>+{calculations.vatAmount.toLocaleString()}đ</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.total}>Tổng:</Text>
          <Text style={styles.total}>{calculations.finalTotal.toLocaleString()}đ</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.printBtn, (saveItemsMutation.isPending || createOrderMutation.isPending) && styles.btnDisabled]} 
            onPress={handleSaveAndPrint}
            disabled={saveItemsMutation.isPending || createOrderMutation.isPending}
          >
            <Text style={styles.printText}>Lưu & In Bếp</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.payBtn, payMutation.isPending && styles.btnDisabled]} 
            onPress={handlePay}
            disabled={payMutation.isPending}
          >
            <Text style={styles.payText}>In & Thanh toán</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// 7. === STYLES ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', paddingTop: 50 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF6B35', textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
  search: { backgroundColor: '#fff', padding: 14, borderRadius: 16, marginBottom: 12, fontSize: 16, elevation: 2, marginHorizontal: 16 },
  categoryList: { paddingHorizontal: 16, paddingBottom: 12 },
  categoryBtn: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20, marginHorizontal: 6, elevation: 3, minWidth: 90, alignItems: 'center' },
  categoryBtnActive: { backgroundColor: '#FF6B35' },
  categoryText: { fontSize: 16, fontWeight: '600', color: '#555' },
  categoryTextActive: { color: '#fff', fontWeight: '700' },
  menuCard: { flex: 1, margin: 8, backgroundColor: '#fff', padding: 16, borderRadius: 16, elevation: 3 },
  menuName: { fontSize: 16, fontWeight: '600' },
  menuPrice: { color: '#FF6B35', fontWeight: 'bold', marginVertical: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  qtyBtn: { backgroundColor: '#FF6B35', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  qty: { marginHorizontal: 14, fontSize: 16, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee', elevation: 10, marginTop: 16, marginHorizontal: 16, borderRadius: 12 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  calcRowInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  calcLabel: { fontSize: 16, color: '#555' },
  calcValue: { fontSize: 16, fontWeight: '500' },
  inputPercent: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: 100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#ccc',
    paddingTop: 10,
    marginTop: 10,
  },
  total: { fontSize: 22, fontWeight: 'bold', color: '#FF6B35' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  printBtn: { backgroundColor: '#3498db', padding: 14, borderRadius: 12, flex: 1, marginHorizontal: 8 },
  payBtn: { backgroundColor: '#27ae60', padding: 14, borderRadius: 12, flex: 1, marginHorizontal: 8 },
  btnDisabled: { opacity: 0.7 },
  printText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  payText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});