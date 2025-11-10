// src/services/printService.ts
import { Asset } from 'expo-asset';
import * as DPrinting from 'expo-print';
import QRCode from 'qrcode'; // (MỚI) Import thư viện QR
import { MenuItemWithCategory } from '../api/menuApi';
import { useSettingsStore } from '../stores/settingsStore';

// Lấy kiểu Settings từ store
type Settings = ReturnType<typeof useSettingsStore.getState>;

const getLogoUri = async (): Promise<string> => {
  try {
    const logoAsset = Asset.fromModule(require('../../assets/logo.png')); // Đảm bảo bạn có file logo.png
    await logoAsset.downloadAsync();
    return logoAsset.localUri || logoAsset.uri;
  } catch (e) {
    console.error("Không thể tải logo:", e);
    return '';
  }
};

// ... (generateItemsHtml giữ nguyên) ...
const generateItemsHtml = (
  itemsToPrint: Map<number, number>,
  menu: MenuItemWithCategory[]
) => {
  return Array.from(itemsToPrint.entries())
    .map(([id, qty]) => {
      const item = menu.find(m => m.id === id);
      if (!item) return '';
      const price = (item.price * qty).toLocaleString();
      return `
        <tr>
          <td style="font-size: 16px; padding: 4px 0;">${item.name}</td>
          <td style="font-size: 16px; text-align: right;">x${qty}</td>
          <td style="font-size: 16px; text-align: right;">${price}đ</td>
        </tr>
      `;
    })
    .join('');
};

/**
 * (SỬA) In Hóa Đơn Bếp
 */
export const printKitchenBill = async (
  tableName: string,
  itemsToPrint: Map<number, number>,
  menu: MenuItemWithCategory[],
  shopName: string // (SỬA) Nhận thêm tên quán
) => {
  const itemsHtml = Array.from(itemsToPrint.entries())
    .map(([id, qty]) => {
      const item = menu.find(m => m.id === id);
      return item ? `<p style="font-size:20px; margin:8px 0; font-weight: 600;">${item.name} x${qty}</p>` : '';
    })
    .join('');

  const html = `
    <div style="padding:20px; font-family:Arial; width: 300px;">
      <h2 style="text-align:center; color:#FF6B35;">${shopName} - BẾP</h2>
      <p style="font-size: 18px;"><strong>Bàn:</strong> ${tableName}</p>
      <p style="font-size: 16px;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      <hr>
      ${itemsHtml}
      <p style="text-align:center; margin-top:20px; color:#7f8c8d;">Vui lòng chế biến</p>
    </div>
  `;
  await DPrinting.printAsync({ html, width: 300 });
};


/**
 * (SỬA) In Hóa Đơn Thanh Toán (Full)
 */
export const printPaymentBill = async (
  tableName: string,
  orderItems: Map<number, number>,
  menu: MenuItemWithCategory[],
  // (SỬA) Nhận vào các giá trị mới
  settings: Settings,
  calculations: {
    subtotal: number;
    discountAmount: number;
    vatAmount: number;
    finalTotal: number;
  },
  onPaid?: () => void
) => {
  const { subtotal, discountAmount, vatAmount, finalTotal } = calculations;
  const { shopName, address, phone, qrCodeData, thankYouMessage } = settings; // (SỬA)

  const itemsHtml = generateItemsHtml(orderItems, menu);
  const logoUri = await getLogoUri();

  // (MỚI) Tạo QR Code
  let qrCodeHtml = '';
  if (qrCodeData) {
    try {
      // Chuyển chuỗi QR thành ảnh Data URI
      const qrDataUri = await QRCode.toDataURL(qrCodeData);
      qrCodeHtml = `<img src="${qrDataUri}" style="width: 200px; height: 200px; margin: 10px auto; display: block;" />`;
    } catch (err) {
      console.error('Không thể tạo QR code:', err);
    }
  }

  const html = `
    <div style="padding:20px; font-family:Arial; width: 300px; margin:auto;">
      ${logoUri ? `<img src="${logoUri}" style="width: 150px; height: auto; margin: 0 auto; display: block;" />` : ''}
      <h2 style="text-align:center; color:#FF6B35; margin-bottom: 5px;">${shopName}</h2>
      <p style="text-align:center; margin: 2px 0;">${address}</p>
      <p style="text-align:center; margin: 2px 0; font-weight: 600;">SĐT: ${phone}</p>

      <hr>
      <p style="font-size: 18px;"><strong>Bàn:</strong> ${tableName}</p>
      <p style="font-size: 16px;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      <hr>
      <table width="100%" style="border-collapse: collapse;">
        ${itemsHtml}
      </table>
      <hr>

      <table width="100%" style="font-size: 16px;">
        <tr>
          <td>Tiền hàng:</td>
          <td style="text-align:right;">${subtotal.toLocaleString()}đ</td>
        </tr>
        <tr>
          <td>Giảm giá:</td>
          <td style="text-align:right;">-${discountAmount.toLocaleString()}đ</td>
        </tr>
        <tr>
          <td>VAT:</td>
          <td style="text-align:right;">+${vatAmount.toLocaleString()}đ</td>
        </tr>
        <tr style="font-weight:bold; font-size:22px; border-top: 1px dashed #555; padding-top: 5px;">
          <td>TỔNG:</td>
          <td style="text-align:right;">${finalTotal.toLocaleString()}đ</td>
        </tr>
      </table>

      ${qrCodeHtml}

      <p style="text-align:center; margin-top:20px; color:#7f8c8d;">
        ${thankYouMessage}
      </p>
    </div>
  `;

  await DPrinting.printAsync({ html, width: 300 });
  onPaid?.();
};