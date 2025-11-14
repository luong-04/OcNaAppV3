// src/services/printService.ts
import { Asset } from 'expo-asset';
import * as DPrinting from 'expo-print';
import QRCode from 'qrcode';
import { Alert } from 'react-native';
// SỬA 1: Import 'Printer' theo đúng v4
import { Printer } from 'react-native-esc-pos-printer';
import TcpSocket from 'react-native-tcp-socket';
import { MenuItemWithCategory } from '../api/menuApi';
import { useSettingsStore } from '../stores/settingsStore';

// Lấy kiểu Settings từ store
type Settings = ReturnType<typeof useSettingsStore.getState>;

const getLogoUri = async (): Promise<string> => {
  try {
    const logoAsset = Asset.fromModule(require('../../assets/logo.png')); 
    await logoAsset.downloadAsync();
    return logoAsset.localUri || logoAsset.uri;
  } catch (e) {
    console.error("Không thể tải logo:", e);
    return '';
  }
};

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
 * (SỬA) Hàm in qua mạng LAN/WiFi (ESC/POS) - Dùng cú pháp v4
 */
const printEscPos = async (html: string, ip: string, port: string, width: number) => {
  const portNum = parseInt(port, 10);

  if (!ip || isNaN(portNum) || portNum <= 0 || portNum > 65535) {
    console.log("IP/Port không hợp lệ. Quay về in mặc định.");
    return DPrinting.printAsync({ html, width });
  }

  try {
    // SỬA 2: Khởi tạo Printer theo v4
    const printer = new Printer({ 
      target: 'UNKNOWN' as any, // 'UNKNOWN' là đúng vì chúng ta tự quản lý socket
      deviceName: 'Network Printer',
    }); 
    
    // SỬA 3: Dùng hàm .printHTML() thay vì .print() cho HTML
    const buffer = await (printer as any).printHTML(html, { 
      cut: true, 
      encoding: 'utf8', 
      // 'type' và 'width' không có trong options của printHTML
    });

    // Phần quản lý TcpSocket giữ nguyên
    return new Promise<void>((resolve, reject) => {
      const socket = TcpSocket.createConnection({ port: portNum, host: ip }, () => {
        socket.setTimeout(5000); 
        console.log(`Kết nối máy in ${ip}:${portNum} thành công`);
        
        socket.write(buffer, 'utf8', (err: Error | undefined) => {
          if (err) {
            console.error('Lỗi gửi dữ liệu:', err);
            Alert.alert('Lỗi in', `Lỗi gửi dữ liệu đến máy in ${ip}:${portNum}.`);
            socket.destroy();
            return reject(err);
          }
          console.log('Gửi dữ liệu in thành công.');
          socket.end(); 
          resolve();
        });
      });

      socket.on('error', (error) => {
        console.error('Lỗi kết nối máy in:', error);
        Alert.alert('Lỗi kết nối', `Không thể kết nối đến máy in ${ip}:${portNum}. Kiểm tra IP/Port và kết nối mạng.`);
        socket.destroy();
        reject(error);
      });
      
      socket.on('close', () => {
        console.log('Đã đóng kết nối máy in.');
      });
    });

  } catch (error) {
    console.error("Lỗi chuyển đổi/in:", error);
    Alert.alert('Lỗi in', `Lỗi xử lý in: ${(error as Error).message}. Thử lại hoặc kiểm tra cấu hình.`);
    // Fallback
    return DPrinting.printAsync({ html, width });
  }
};


/**
 * In Hóa Đơn Bếp
 */
export const printKitchenBill = async (
  tableName: string,
  itemsToPrint: Map<number, number>,
  menu: MenuItemWithCategory[],
  settings: Settings 
) => {
  const itemsHtml = Array.from(itemsToPrint.entries())
    .map(([id, qty]) => {
      const item = menu.find(m => m.id === id);
      return item ? `<p style="font-size:20px; margin:8px 0; font-weight: 600;">${item.name} x${qty}</p><br>` : '';
    })
    .join('');

  const html = `
    <div style="padding:10px; font-family:Arial; width: 300px;">
      <h2 style="text-align:center; color:#FF6B35;">${settings.shopName} - BẾP</h2>
      <p style="font-size: 18px;"><strong>Bàn:</strong> ${tableName}</p>
      <p style="font-size: 16px;"><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      <hr>
      ${itemsHtml}
      <p style="text-align:center; margin-top:20px; color:#7f8c8d;">Vui lòng chế biến</p>
    </div>
  `;
  
  const printerId = settings.kitchenPrinterId;
  if (!printerId) {
    console.log("In bếp: Dùng in PDF mặc định.");
    await DPrinting.printAsync({ html, width: 300 });
  } else {
    const printerIpPort = settings[printerId as 'printer1' | 'printer2'];
    // Tách chuỗi ra
    const [ip, port] = printerIpPort.split(':');

    console.log(`In bếp: Dùng máy in ${printerId} (${printerIpPort})`);

    // SỬA 4: Truyền ip và port đã tách
    await printEscPos(html, ip, port, 300); 
  }
};


/**
 * In Hóa Đơn Thanh Toán (Full)
 */
export const printPaymentBill = async (
  tableName: string,
  orderItems: Map<number, number>,
  menu: MenuItemWithCategory[],
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
  const { shopName, address, phone, qrCodeData, thankYouMessage } = settings; 

  const itemsHtml = generateItemsHtml(orderItems, menu);
  const logoUri = await getLogoUri();
  
  let qrCodeHtml = '';
  if (qrCodeData) {
    try {
      const qrDataUri = await QRCode.toDataURL(qrCodeData);
      qrCodeHtml = `<img src="${qrDataUri}" style="width: 150px; height: 150px; margin: 10px auto; display: block;" />`;
    } catch (err) {
      console.error('Không thể tạo QR code:', err);
    }
  }

  const html = `
    <div style="padding:10px; font-family:Arial; width: 300px; margin:auto;">
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

  const printerId = settings.paymentPrinterId;
  if (!printerId) {
    console.log("In thanh toán: Dùng in PDF mặc định.");
    await DPrinting.printAsync({ html, width: 300 });
  } else {
    // Lấy chuỗi IP:Port, ví dụ "192.168.1.100:9100"
    const printerIpPort = settings[printerId as 'printer1' | 'printer2'];
    // Tách chuỗi ra
    const [ip, port] = printerIpPort.split(':');

    console.log(`In thanh toán: Dùng máy in ${printerId} (${printerIpPort})`);

    // SỬA 5: Truyền ip và port đã tách
    await printEscPos(html, ip, port, 300);
  }
  
  onPaid?.();
};