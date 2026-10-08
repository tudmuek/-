import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import type { InventoryItem, StockTransaction, LowStockAlert, LineConfig, LineWebhookLog, LineSimulateResponse } from './src/types';
import { buildItemDetailFlex, buildLowStockAlertFlex, buildStockSummaryFlex, buildHelpFlex, getStandardQuickReplies } from './src/lineFlex';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '.inventory-data.json');

// Default initial inventory items
const DEFAULT_ITEMS: InventoryItem[] = [
  {
    id: 'item-1',
    sku: 'COKE-325',
    name: 'โค้กกระป๋อง Original (325 มล.)',
    category: 'เครื่องดื่ม',
    quantity: 48,
    minThreshold: 20,
    unit: 'กระป๋อง',
    price: 16,
    cost: 11.5,
    location: 'ตู้แช่ A-01',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    updatedBy: 'ระบบเริ่มต้น',
  },
  {
    id: 'item-2',
    sku: 'MAMA-TOM',
    name: 'มาม่าต้มยำกุ้งน้ำข้น (60 กรัม)',
    category: 'อาหารกึ่งสำเร็จรูป',
    quantity: 12,
    minThreshold: 25,
    unit: 'ซอง',
    price: 8,
    cost: 5.5,
    location: 'ชั้นวาง B-02',
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    updatedBy: 'LINE: สมหญิง (แคชเชียร์)',
  },
  {
    id: 'item-3',
    sku: 'WATER-600',
    name: 'น้ำดื่มสิงห์ (600 มล.)',
    category: 'เครื่องดื่ม',
    quantity: 96,
    minThreshold: 30,
    unit: 'ขวด',
    price: 10,
    cost: 6.2,
    location: 'โกดังพาเลท W-1',
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
    updatedBy: 'LINE: สมชาย (คลังสินค้า)',
  },
  {
    id: 'item-4',
    sku: 'LAY-NORI',
    name: 'เลย์ มันฝรั่งแท้ รสโนริสาหร่าย (48 กรัม)',
    category: 'ขนมขบเคี้ยว',
    quantity: 6,
    minThreshold: 15,
    unit: 'ซอง',
    price: 22,
    cost: 16,
    location: 'ชั้นวาง C-01',
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    updatedBy: 'LINE: สมหญิง (แคชเชียร์)',
  },
  {
    id: 'item-5',
    sku: 'RICE-5KG',
    name: 'ข้าวหอมมะลิแท้ 100% ตราฉัตร (5 กก.)',
    category: 'ข้าวสาร/ธัญพืช',
    quantity: 5,
    minThreshold: 10,
    unit: 'ถุง',
    price: 215,
    cost: 175,
    location: 'โกดังหลัก R-2',
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    updatedBy: 'ผู้จัดการวิชัย',
  },
  {
    id: 'item-6',
    sku: 'MILK-MEIJI',
    name: 'นมสดพาสเจอร์ไรส์ เมจิ รสจืด (830 มล.)',
    category: 'นมและเนย',
    quantity: 0,
    minThreshold: 8,
    unit: 'ขวด',
    price: 49,
    cost: 39,
    location: 'ตู้แช่เย็น D-01',
    updatedAt: new Date(Date.now() - 900000).toISOString(),
    updatedBy: 'LINE: อนุชา (ตรวจนับสต๊อก)',
  },
  {
    id: 'item-7',
    sku: 'OIL-1L',
    name: 'น้ำมันพืช มรกต (1 ลิตร)',
    category: 'เครื่องปรุง/วัตถุดิบ',
    quantity: 36,
    minThreshold: 12,
    unit: 'ขวด',
    price: 55,
    cost: 44,
    location: 'ชั้นวาง B-05',
    updatedAt: new Date(Date.now() - 5400000).toISOString(),
    updatedBy: 'ระบบเริ่มต้น',
  },
  {
    id: 'item-8',
    sku: 'EGG-NO2',
    name: 'ไข่ไก่สด เบอร์ 2 (แผง 30 ฟอง)',
    category: 'เครื่องปรุง/วัตถุดิบ',
    quantity: 8,
    minThreshold: 10,
    unit: 'แผง',
    price: 135,
    cost: 115,
    location: 'ห้องควบคุมอุณหภูมิ F-1',
    updatedAt: new Date(Date.now() - 2500000).toISOString(),
    updatedBy: 'LINE: สมชาย (คลังสินค้า)',
  }
];

interface DataStore {
  items: InventoryItem[];
  transactions: StockTransaction[];
  alerts: LowStockAlert[];
  config: LineConfig;
  logs: LineWebhookLog[];
  botInfo?: {
    displayName: string;
    userId: string;
    pictureUrl?: string;
  };
}

let store: DataStore = {
  items: [...DEFAULT_ITEMS],
  transactions: [
    {
      id: 'tx-init-1',
      itemId: 'item-2',
      itemSku: 'MAMA-TOM',
      itemName: 'มาม่าต้มยำกุ้งน้ำข้น (60 กรัม)',
      type: 'OUT',
      delta: -15,
      prevQuantity: 27,
      newQuantity: 12,
      operator: 'LINE: สมหญิง (แคชเชียร์)',
      reason: 'เบิกขายหน้าร้าน (สั่งการผ่าน LINE OA)',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      triggeredAlert: true,
    },
    {
      id: 'tx-init-2',
      itemId: 'item-4',
      itemSku: 'LAY-NORI',
      itemName: 'เลย์ มันฝรั่งแท้ รสโนริสาหร่าย (48 กรัม)',
      type: 'OUT',
      delta: -10,
      prevQuantity: 16,
      newQuantity: 6,
      operator: 'LINE: สมหญิง (แคชเชียร์)',
      reason: 'ขายปลีก (สั่งการผ่าน LINE OA: "- LAY-NORI 10")',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      triggeredAlert: true,
    },
    {
      id: 'tx-init-3',
      itemId: 'item-3',
      itemSku: 'WATER-600',
      itemName: 'น้ำดื่มสิงห์ (600 มล.)',
      type: 'IN',
      delta: 48,
      prevQuantity: 48,
      newQuantity: 96,
      operator: 'LINE: สมชาย (คลังสินค้า)',
      reason: 'รับสินค้าเข้าโกดัง (สั่งการผ่าน LINE OA: "+ WATER-600 48")',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      triggeredAlert: false,
    }
  ],
  alerts: [
    {
      id: 'alert-1',
      itemId: 'item-6',
      itemSku: 'MILK-MEIJI',
      itemName: 'นมสดพาสเจอร์ไรส์ เมจิ รสจืด (830 มล.)',
      currentQuantity: 0,
      minThreshold: 8,
      unit: 'ขวด',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      acknowledged: false,
    },
    {
      id: 'alert-2',
      itemId: 'item-4',
      itemSku: 'LAY-NORI',
      itemName: 'เลย์ มันฝรั่งแท้ รสโนริสาหร่าย (48 กรัม)',
      currentQuantity: 6,
      minThreshold: 15,
      unit: 'ซอง',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      acknowledged: false,
    },
    {
      id: 'alert-3',
      itemId: 'item-2',
      itemSku: 'MAMA-TOM',
      itemName: 'มาม่าต้มยำกุ้งน้ำข้น (60 กรัม)',
      currentQuantity: 12,
      minThreshold: 25,
      unit: 'ซอง',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      acknowledged: false,
    },
    {
      id: 'alert-4',
      itemId: 'item-5',
      itemSku: 'RICE-5KG',
      itemName: 'ข้าวหอมมะลิแท้ 100% ตราฉัตร (5 กก.)',
      currentQuantity: 5,
      minThreshold: 10,
      unit: 'ถุง',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      acknowledged: true,
    },
    {
      id: 'alert-5',
      itemId: 'item-8',
      itemSku: 'EGG-NO2',
      itemName: 'ไข่ไก่สด เบอร์ 2 (แผง 30 ฟอง)',
      currentQuantity: 8,
      minThreshold: 10,
      unit: 'แผง',
      timestamp: new Date(Date.now() - 2500000).toISOString(),
      acknowledged: false,
    }
  ],
  config: {
    channelAccessToken: '',
    channelSecret: '',
    adminLineUserId: '',
    autoNotifyLowStock: true,
    webhookUrl: '',
    botName: 'LINE Stock Bot',
  },
  logs: [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      sender: 'U893248921839213',
      senderName: 'สมหญิง (แคชเชียร์)',
      rawMessage: '- LAY-NORI 10',
      actionTaken: 'ลดสต๊อกสินค้า LAY-NORI จำนวน 10 ซอง',
      replyText: '✅ ตัดสต๊อกสำเร็จ: เลย์ มันฝรั่งแท้ รสโนริสาหร่าย (48 กรัม) ลดลง 10 ซอง คงเหลือ 6 ซอง\n⚠️ แจ้งเตือน: สินค้าใกล้หมดแล้ว! (เกณฑ์เตือน: 15 ซอง)',
      status: 'warning',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      sender: 'U109823901840921',
      senderName: 'สมชาย (คลังสินค้า)',
      rawMessage: '+ WATER-600 48',
      actionTaken: 'เพิ่มสต๊อกสินค้า WATER-600 จำนวน 48 ขวด',
      replyText: '✅ เพิ่มสต๊อกสำเร็จ: น้ำดื่มสิงห์ (600 มล.) เพิ่มขึ้น 48 ขวด คงเหลือ 96 ขวด',
      status: 'success',
    }
  ]
};

// Try to load persisted data
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.items && Array.isArray(parsed.items)) {
      store = { ...store, ...parsed };
    }
  }
} catch (e) {
  console.error('Failed to load persisted data:', e);
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to persist data:', e);
  }
}

// SSE Clients for real-time synchronization
const sseClients = new Set<express.Response>();

function broadcast(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Check and create low-stock alert, and optionally push to LINE
async function checkAndCreateAlert(item: InventoryItem, operatorName: string): Promise<boolean> {
  if (item.quantity <= item.minThreshold) {
    const existingUnacked = store.alerts.find(a => a.itemId === item.id && !a.acknowledged);
    if (!existingUnacked) {
      const newAlert: LowStockAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemId: item.id,
        itemSku: item.sku,
        itemName: item.name,
        currentQuantity: item.quantity,
        minThreshold: item.minThreshold,
        unit: item.unit,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };
      store.alerts.unshift(newAlert);
      if (store.alerts.length > 50) store.alerts.pop();
      saveData();
      broadcast('alert', newAlert);

      // Auto Push to real LINE if configured
      if (store.config.autoNotifyLowStock && store.config.channelAccessToken) {
        const alertFlex = buildLowStockAlertFlex([item]);
        await sendLinePushOrBroadcast([alertFlex], store.config.channelAccessToken, store.config.adminLineUserId);
      }

      return true;
    }
  }
  return false;
}

// Find item by SKU or Name fuzzy search
function findItem(identifier: string): InventoryItem | undefined {
  const clean = identifier.trim().toLowerCase();
  let found = store.items.find(i => i.sku.toLowerCase() === clean);
  if (found) return found;

  found = store.items.find(i => i.sku.toLowerCase().includes(clean));
  if (found) return found;

  found = store.items.find(i => i.name.toLowerCase() === clean);
  if (found) return found;

  found = store.items.find(i => i.name.toLowerCase().includes(clean));
  return found;
}

// Core LINE Command Execution Engine
export function executeLineCommand(text: string, senderName = 'พนักงาน LINE'): LineSimulateResponse {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. HELP / MENU COMMANDS
  if (['คำสั่ง', 'ช่วย', 'ช่วยเหลือ', 'เมนู', 'help', '?'].includes(lower)) {
    const flex = buildHelpFlex();
    const replyText = `📋 คู่มือคำสั่งระบบสต๊อกผ่าน LINE OA:\n• พิมพ์ "สต็อก" เพื่อดูภาพรวมสินค้า\n• พิมพ์ "+ [รหัส] [จำนวน]" เพื่อเพิ่มสต็อก\n• พิมพ์ "- [รหัส] [จำนวน]" เพื่อตัดสต็อก\n• พิมพ์ "ใกล้หมด" เพื่อดูสินค้าใกล้หมด`;

    return {
      replyText,
      replyType: 'flex',
      flexData: flex,
      actionTaken: 'แสดงคู่มือคำสั่งช่วยเหลือ'
    };
  }

  // 2. SUMMARY STOCK COMMANDS
  if (['สต็อก', 'คลัง', 'รายการ', 'สต๊อก', 'สรุป', 'stock', 'list'].includes(lower)) {
    const flex = buildStockSummaryFlex(store.items);
    const totalItems = store.items.length;
    const lowStockItems = store.items.filter(i => i.quantity <= i.minThreshold);
    const replyText = `📦 สรุปสต็อกคงเหลือ (${totalItems} รายการ) | ใกล้หมด: ${lowStockItems.length} รายการ`;

    return {
      replyText,
      replyType: 'flex',
      flexData: flex,
      actionTaken: 'เรียกดูสรุปสต็อกสินค้า'
    };
  }

  // 3. LOW STOCK / ALERTS COMMAND
  if (['เตือน', 'สินค้าใกล้หมด', 'ใกล้หมด', 'หมด', 'เตือนสต็อก', 'alert', 'low'].includes(lower)) {
    const lowItems = store.items.filter(i => i.quantity <= i.minThreshold);
    const flex = buildLowStockAlertFlex(lowItems);

    if (lowItems.length === 0) {
      return {
        replyText: '🎉 สินค้าทุกรายการอยู่ในเกณฑ์ปลอดภัย ไม่มีสินค้าใกล้หมดหรือขาดสต็อกในขณะนี้!',
        replyType: 'text',
        flexData: flex,
        actionTaken: 'ตรวจสอบสินค้าใกล้หมด (ปลอดภัยทั้งหมด)'
      };
    }

    return {
      replyText: `⚠️ พบสินค้าใกล้หมดสต็อก ${lowItems.length} รายการ กรุณาสั่งซื้อเพิ่มด่วน`,
      replyType: 'alert',
      flexData: flex,
      actionTaken: `เรียกดูรายการสินค้าใกล้หมด (${lowItems.length} รายการ)`
    };
  }

  // 4. HISTORY COMMAND
  if (['ประวัติ', 'บันทึก', 'log', 'history'].includes(lower)) {
    const recent = store.transactions.slice(0, 5);
    if (recent.length === 0) {
      return {
        replyText: 'ยังไม่มีประวัติการอัปเดตสต็อกในระบบ',
        replyType: 'text',
        actionTaken: 'เรียกดูประวัติ (ไม่มีข้อมูล)'
      };
    }

    let reply = `📜 ประวัติการอัปเดตสต๊อกล่าสุด (5 รายการ):\n-----------------------------\n`;
    recent.forEach((tx, idx) => {
      const sign = tx.delta > 0 ? `+${tx.delta}` : `${tx.delta}`;
      const timeStr = new Date(tx.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      reply += `${idx + 1}. [${timeStr}] [${tx.itemSku}] (${sign})\n   คงเหลือ: ${tx.newQuantity} | โดย: ${tx.operator}\n`;
    });

    return {
      replyText: reply,
      replyType: 'text',
      actionTaken: 'เรียกดูประวัติอัปเดต 5 รายการล่าสุด'
    };
  }

  // 5. CHECK SPECIFIC ITEM
  const checkMatch = raw.match(/^(?:เช็ค|ดู|ตรวจ|ค้นหา|check)\s+(.+)$/i);
  if (checkMatch) {
    const query = checkMatch[1].trim();
    const item = findItem(query);
    if (!item) {
      return {
        replyText: `❌ ไม่พบสินค้าที่ตรงกับคำค้นหา: "${query}"\nกรุณาตรวจสอบรหัส SKU หรือพิมพ์ "สต็อก" เพื่อดูรายการทั้งหมด`,
        replyType: 'text',
        actionTaken: `ค้นหาไม่พบสินค้า: ${query}`
      };
    }

    const flex = buildItemDetailFlex(item);
    const replyText = `📦 [${item.sku}] ${item.name} คงเหลือ: ${item.quantity} ${item.unit} (จุดเตือน: ${item.minThreshold})`;

    return {
      replyText,
      replyType: 'flex',
      flexData: flex,
      actionTaken: `เช็คข้อมูลสินค้า [${item.sku}]`,
      item
    };
  }

  // 6. ADD STOCK: "+ A01 10"
  const addMatch = raw.match(/^(?:\+|\bเพิ่ม\b|\bรับ\b|\bเข้า\b|\badd\b)\s*([A-Za-z0-9_\-\u0E00-\u0E7F]+)\s+(\d+)$/i);
  if (addMatch) {
    const target = addMatch[1].trim();
    const qty = parseInt(addMatch[2], 10);
    const item = findItem(target);

    if (!item) {
      return {
        replyText: `❌ ไม่พบสินค้ารหัส/ชื่อ: "${target}" ในระบบ\nพิมพ์ "สต็อก" เพื่อเช็ครหัสที่ถูกต้อง`,
        replyType: 'text',
        actionTaken: `เพิ่มสต็อกล้มเหลว: ไม่พบสินค้า ${target}`
      };
    }

    if (qty <= 0) {
      return {
        replyText: `❌ จำนวนที่ต้องการเพิ่มต้องมากกว่า 0`,
        replyType: 'text',
        actionTaken: 'จำนวนไม่ถูกต้อง'
      };
    }

    const prev = item.quantity;
    item.quantity += qty;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = senderName;

    const tx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      itemSku: item.sku,
      itemName: item.name,
      type: 'IN',
      delta: qty,
      prevQuantity: prev,
      newQuantity: item.quantity,
      operator: senderName,
      reason: `รับเข้าผ่าน LINE OA (+ ${qty})`,
      timestamp: new Date().toISOString(),
      triggeredAlert: false,
    };

    store.transactions.unshift(tx);
    if (store.transactions.length > 200) store.transactions.pop();
    saveData();

    broadcast('stock_updated', { item, transaction: tx });

    const flex = buildItemDetailFlex(item);
    const replyText = `✅ เพิ่มสต็อกสำเร็จ!\n📦 [${item.sku}] ${item.name}\n➕ เพิ่มขึ้น: +${qty} ${item.unit}\n📊 คงเหลือใหม่: ${item.quantity} ${item.unit}`;

    return {
      replyText,
      replyType: 'flex',
      flexData: flex,
      actionTaken: `เพิ่มสต็อก [${item.sku}] +${qty} ${item.unit}`,
      item
    };
  }

  // 7. DEDUCT STOCK: "- A01 5"
  const deductMatch = raw.match(/^(?:-|\bลด\b|\bขาย\b|\bเบิก\b|\bออก\b|\bจ่าย\b|\bcut\b)\s*([A-Za-z0-9_\-\u0E00-\u0E7F]+)\s+(\d+)$/i);
  if (deductMatch) {
    const target = deductMatch[1].trim();
    const qty = parseInt(deductMatch[2], 10);
    const item = findItem(target);

    if (!item) {
      return {
        replyText: `❌ ไม่พบสินค้ารหัส/ชื่อ: "${target}" ในระบบ\nพิมพ์ "สต็อก" เพื่อเช็ครหัสที่ถูกต้อง`,
        replyType: 'text',
        actionTaken: `ตัดสต็อกล้มเหลว: ไม่พบสินค้า ${target}`
      };
    }

    if (qty <= 0) {
      return {
        replyText: `❌ จำนวนที่ต้องการลดต้องมากกว่า 0`,
        replyType: 'text',
        actionTaken: 'จำนวนไม่ถูกต้อง'
      };
    }

    if (item.quantity < qty) {
      return {
        replyText: `❌ สต็อกไม่เพียงพอ!\nสินค้า [${item.sku}] คงเหลือเพียง ${item.quantity} ${item.unit} แต่คุณต้องการตัดออก ${qty} ${item.unit}`,
        replyType: 'text',
        actionTaken: `ตัดสต็อกล้มเหลว: ยอดไม่พอ [${item.sku}] มี ${item.quantity} ต้องการตัด ${qty}`
      };
    }

    const prev = item.quantity;
    item.quantity -= qty;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = senderName;

    const triggeredAlert = item.quantity <= item.minThreshold;
    checkAndCreateAlert(item, senderName);

    const tx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      itemSku: item.sku,
      itemName: item.name,
      type: 'OUT',
      delta: -qty,
      prevQuantity: prev,
      newQuantity: item.quantity,
      operator: senderName,
      reason: `ตัดสต็อกผ่าน LINE OA (- ${qty})`,
      timestamp: new Date().toISOString(),
      triggeredAlert,
    };

    store.transactions.unshift(tx);
    if (store.transactions.length > 200) store.transactions.pop();
    saveData();

    broadcast('stock_updated', { item, transaction: tx });

    const flex = buildItemDetailFlex(item);
    let replyText = `✅ ตัดสต็อกสำเร็จ!\n📦 [${item.sku}] ${item.name}\n➖ ตัดออก: -${qty} ${item.unit}\n📊 คงเหลือใหม่: ${item.quantity} ${item.unit}`;
    if (item.quantity === 0) {
      replyText += `\n🚨 สินค้าหมดเกลี้ยงแล้ว (0 ${item.unit})!`;
    } else if (item.quantity <= item.minThreshold) {
      replyText += `\n⚠️ สินค้าใกล้หมดแล้ว! (เกณฑ์เตือน: ${item.minThreshold} ${item.unit})`;
    }

    return {
      replyText,
      replyType: item.quantity <= item.minThreshold ? 'alert' : 'flex',
      flexData: flex,
      actionTaken: `ตัดสต็อก [${item.sku}] -${qty} ${item.unit}`,
      item,
      triggeredAlert
    };
  }

  // 8. SET EXACT STOCK: "ตั้ง A01 50"
  const setMatch = raw.match(/^(?:=|\bตั้ง\b|\bปรับ\b|\bset\b)\s*([A-Za-z0-9_\-\u0E00-\u0E7F]+)\s+(\d+)$/i);
  if (setMatch) {
    const target = setMatch[1].trim();
    const newQty = parseInt(setMatch[2], 10);
    const item = findItem(target);

    if (!item) {
      return {
        replyText: `❌ ไม่พบสินค้ารหัส/ชื่อ: "${target}" ในระบบ`,
        replyType: 'text',
        actionTaken: `ปรับยอดล้มเหลว: ไม่พบสินค้า ${target}`
      };
    }

    const prev = item.quantity;
    const delta = newQty - prev;
    item.quantity = newQty;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = senderName;

    const triggeredAlert = item.quantity <= item.minThreshold;
    checkAndCreateAlert(item, senderName);

    const tx: StockTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      itemSku: item.sku,
      itemName: item.name,
      type: 'ADJUST',
      delta,
      prevQuantity: prev,
      newQuantity: newQty,
      operator: senderName,
      reason: `ปรับยอดตรวจนับตรงผ่าน LINE OA (${prev} ➔ ${newQty})`,
      timestamp: new Date().toISOString(),
      triggeredAlert,
    };

    store.transactions.unshift(tx);
    saveData();
    broadcast('stock_updated', { item, transaction: tx });

    const flex = buildItemDetailFlex(item);
    const replyText = `🎯 ปรับยอดสำเร็จ: [${item.sku}] ${prev} ➔ ${newQty} ${item.unit}`;

    return {
      replyText,
      replyType: item.quantity <= item.minThreshold ? 'alert' : 'flex',
      flexData: flex,
      actionTaken: `ปรับยอด [${item.sku}] เป็น ${newQty} ${item.unit}`,
      item,
      triggeredAlert
    };
  }

  // 9. Fallback
  return {
    replyText: `❓ ไม่เข้าใจคำสั่ง: "${raw}"\n\n💡 คำสั่งที่ใช้ได้:\n• พิมพ์ "สต็อก" เพื่อดูสรุป\n• พิมพ์ "+ [รหัส] [จำนวน]" เพื่อเพิ่มสต็อก\n• พิมพ์ "- [รหัส] [จำนวน]" เพื่อตัดสต็อก\n• พิมพ์ "คำสั่ง" เพื่อดูคู่มือ`,
    replyType: 'text',
    actionTaken: `คำสั่งไม่ถูกต้อง: ${raw}`
  };
}

// Function to call LINE Messaging API reply with Flex & Quick Replies
async function sendLineReply(replyToken: string, messagesPayload: any[], channelAccessToken: string) {
  if (!channelAccessToken) return;
  // Ignore dummy verification reply tokens sent during LINE Console "Verify" tests
  if (replyToken.startsWith('0000000000') || replyToken.startsWith('ffffffffffff')) {
    return;
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: messagesPayload,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('LINE Reply API error:', res.status, err);
    }
  } catch (e) {
    console.error('Failed to send LINE reply:', e);
  }
}

// Function to call LINE Push or Broadcast
async function sendLinePushOrBroadcast(messagesPayload: any[], channelAccessToken: string, toUserId?: string) {
  if (!channelAccessToken) return;
  try {
    const endpoint = toUserId
      ? 'https://api.line.me/v2/bot/message/push'
      : 'https://api.line.me/v2/bot/message/broadcast';

    const body: any = { messages: messagesPayload };
    if (toUserId) body.to = toUserId;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('LINE Push/Broadcast error:', res.status, err);
    }
  } catch (e) {
    console.error('Failed to send LINE Push/Broadcast:', e);
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Preserve raw body for LINE signature verification
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // ================= API ROUTES =================

  // 1. Get All Items
  app.get('/api/items', (_req, res) => {
    res.json(store.items);
  });

  // 2. Add New Item
  app.post('/api/items', (req, res) => {
    const { sku, name, category, quantity, minThreshold, unit, price, cost, location } = req.body;
    if (!sku || !name) {
      return res.status(400).json({ error: 'รหัสสินค้า (SKU) และชื่อสินค้าเป็นสิ่งจำเป็น' });
    }

    const cleanSku = String(sku).trim().toUpperCase();
    if (store.items.some(i => i.sku.toUpperCase() === cleanSku)) {
      return res.status(400).json({ error: `รหัสสินค้า "${cleanSku}" มีอยู่ในระบบแล้ว` });
    }

    const newItem: InventoryItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sku: cleanSku,
      name: String(name).trim(),
      category: category ? String(category).trim() : 'ทั่วไป',
      quantity: Number(quantity) || 0,
      minThreshold: Number(minThreshold) || 10,
      unit: unit ? String(unit).trim() : 'ชิ้น',
      price: Number(price) || 0,
      cost: Number(cost) || 0,
      location: location ? String(location).trim() : 'คลังสินค้าหลัก',
      updatedAt: new Date().toISOString(),
      updatedBy: 'ผู้ดูแลระบบ (เว็บ)',
    };

    store.items.push(newItem);

    const tx: StockTransaction = {
      id: `tx-${Date.now()}`,
      itemId: newItem.id,
      itemSku: newItem.sku,
      itemName: newItem.name,
      type: 'INITIAL',
      delta: newItem.quantity,
      prevQuantity: 0,
      newQuantity: newItem.quantity,
      operator: 'ผู้ดูแลระบบ (เว็บ)',
      reason: 'เพิ่มสินค้าใหม่เข้าสู่ระบบ',
      timestamp: new Date().toISOString(),
      triggeredAlert: newItem.quantity <= newItem.minThreshold,
    };
    store.transactions.unshift(tx);

    checkAndCreateAlert(newItem, 'ผู้ดูแลระบบ (เว็บ)');
    saveData();
    broadcast('item_added', newItem);

    res.status(201).json(newItem);
  });

  // 3. Update Existing Item
  app.put('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const idx = store.items.findIndex(i => i.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'ไม่พบสินค้าที่ระบุ' });
    }

    const current = store.items[idx];
    const { sku, name, category, quantity, minThreshold, unit, price, cost, location } = req.body;

    const newQty = quantity !== undefined ? Number(quantity) : current.quantity;
    const delta = newQty - current.quantity;

    store.items[idx] = {
      ...current,
      sku: sku ? String(sku).trim().toUpperCase() : current.sku,
      name: name ? String(name).trim() : current.name,
      category: category ? String(category).trim() : current.category,
      quantity: newQty,
      minThreshold: minThreshold !== undefined ? Number(minThreshold) : current.minThreshold,
      unit: unit ? String(unit).trim() : current.unit,
      price: price !== undefined ? Number(price) : current.price,
      cost: cost !== undefined ? Number(cost) : current.cost,
      location: location ? String(location).trim() : current.location,
      updatedAt: new Date().toISOString(),
      updatedBy: 'ผู้ดูแลระบบ (เว็บ)',
    };

    const updated = store.items[idx];

    if (delta !== 0) {
      const tx: StockTransaction = {
        id: `tx-${Date.now()}`,
        itemId: updated.id,
        itemSku: updated.sku,
        itemName: updated.name,
        type: 'ADJUST',
        delta,
        prevQuantity: current.quantity,
        newQuantity: newQty,
        operator: 'ผู้ดูแลระบบ (เว็บ)',
        reason: 'แก้ไขรายละเอียดสินค้าจากเว็บ',
        timestamp: new Date().toISOString(),
        triggeredAlert: newQty <= updated.minThreshold,
      };
      store.transactions.unshift(tx);
    }

    checkAndCreateAlert(updated, 'ผู้ดูแลระบบ (เว็บ)');
    saveData();
    broadcast('stock_updated', { item: updated });

    res.json(updated);
  });

  // 4. Delete Item
  app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const idx = store.items.findIndex(i => i.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'ไม่พบสินค้าที่ระบุ' });
    }

    const removed = store.items.splice(idx, 1)[0];
    saveData();
    broadcast('item_deleted', { id: removed.id });
    res.json({ success: true, removed });
  });

  // 5. Quick Stock Adjustment
  app.post('/api/items/:id/adjust', async (req, res) => {
    const { id } = req.params;
    const { delta, operator = 'ผู้ดูแลระบบ (เว็บ)', reason = 'ปรับสต๊อกจากหน้าเว็บ' } = req.body;
    const item = store.items.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ error: 'ไม่พบสินค้า' });
    }

    const amount = Number(delta);
    if (isNaN(amount) || amount === 0) {
      return res.status(400).json({ error: 'จำนวนการปรับต้องไม่เป็น 0' });
    }

    const prev = item.quantity;
    const newQty = prev + amount;
    if (newQty < 0) {
      return res.status(400).json({ error: `ยอดสต๊อกไม่พอ (มีเพียง ${prev} ${item.unit})` });
    }

    item.quantity = newQty;
    item.updatedAt = new Date().toISOString();
    item.updatedBy = operator;

    const triggeredAlert = await checkAndCreateAlert(item, operator);

    const tx: StockTransaction = {
      id: `tx-${Date.now()}`,
      itemId: item.id,
      itemSku: item.sku,
      itemName: item.name,
      type: amount > 0 ? 'IN' : 'OUT',
      delta: amount,
      prevQuantity: prev,
      newQuantity: newQty,
      operator,
      reason,
      timestamp: new Date().toISOString(),
      triggeredAlert,
    };

    store.transactions.unshift(tx);
    saveData();
    broadcast('stock_updated', { item, transaction: tx });

    res.json({ item, transaction: tx, triggeredAlert });
  });

  // 6. Get Audit Transactions
  app.get('/api/transactions', (_req, res) => {
    res.json(store.transactions);
  });

  // 7. Get Low Stock Alerts
  app.get('/api/alerts', (_req, res) => {
    res.json(store.alerts);
  });

  // 8. Acknowledge Alert
  app.post('/api/alerts/:id/ack', (req, res) => {
    const { id } = req.params;
    const alert = store.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      saveData();
      broadcast('alert_acknowledged', alert);
    }
    res.json({ success: true, alert });
  });

  // 9. Reset Sample Data
  app.post('/api/reset-data', (_req, res) => {
    store.items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    store.alerts = [];
    store.transactions = [];
    store.logs = [];
    saveData();
    broadcast('full_reload', store);
    res.json({ success: true });
  });

  // 10. Config & LINE settings
  app.get('/api/config', (_req, res) => {
    const appUrl = process.env.APP_URL || '';
    const webhookUrl = appUrl ? `${appUrl.replace(/\/$/, '')}/api/line/webhook` : '/api/line/webhook';
    res.json({
      ...store.config,
      webhookUrl,
      appUrl,
      botInfo: store.botInfo,
    });
  });

  app.post('/api/config', async (req, res) => {
    store.config = {
      ...store.config,
      ...req.body,
    };
    saveData();

    // If channel token updated, test and fetch bot profile
    if (store.config.channelAccessToken) {
      try {
        const testRes = await fetch('https://api.line.me/v2/bot/info', {
          headers: { Authorization: `Bearer ${store.config.channelAccessToken}` },
        });
        if (testRes.ok) {
          const info = await testRes.json();
          store.botInfo = info;
          store.config.botName = info.displayName || 'LINE Stock Bot';
          saveData();
        }
      } catch (e) {
        console.warn('Could not fetch bot profile:', e);
      }
    }

    res.json({ ...store.config, botInfo: store.botInfo });
  });

  // 11. Test LINE Credentials Endpoint
  app.post('/api/line/test-credentials', async (req, res) => {
    const { token, secret } = req.body;
    const tokenToTest = token || store.config.channelAccessToken;

    if (!tokenToTest) {
      return res.status(400).json({ success: false, error: 'กรุณากรอก Channel Access Token' });
    }

    try {
      const response = await fetch('https://api.line.me/v2/bot/info', {
        headers: { Authorization: `Bearer ${tokenToTest}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(400).json({
          success: false,
          error: `LINE API ปฏิเสธ (HTTP ${response.status}): Token อาจไม่ถูกต้องหรือหมดอายุ`,
          details: errorText,
        });
      }

      const botInfo = await response.json();
      store.botInfo = botInfo;
      if (token) store.config.channelAccessToken = token;
      if (secret) store.config.channelSecret = secret;
      saveData();

      res.json({
        success: true,
        message: `เชื่อมต่อกับ "${botInfo.displayName}" สำเร็จ!`,
        botInfo,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `เชื่อมต่อไม่สำเร็จ: ${err.message}`,
      });
    }
  });

  // 12. LINE Webhook Logs
  app.get('/api/line/logs', (_req, res) => {
    res.json(store.logs);
  });

  // 13. Simulator Endpoint
  app.post('/api/line/simulate', (req, res) => {
    const { message, senderName = 'สมชาย (คลังสินค้า)' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'ต้องมีข้อความส่งเข้ามา' });
    }

    const result = executeLineCommand(message, senderName);

    const logEntry: LineWebhookLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      sender: 'sim-user-' + senderName,
      senderName,
      rawMessage: message,
      actionTaken: result.actionTaken || 'คำสั่งจำลอง',
      replyText: result.replyText,
      status: result.triggeredAlert ? 'warning' : (result.replyType === 'alert' ? 'warning' : 'success'),
    };

    store.logs.unshift(logEntry);
    if (store.logs.length > 100) store.logs.pop();
    saveData();
    broadcast('line_log', logEntry);

    res.json(result);
  });

  // 14. REAL LINE Official Account Webhook
  app.post('/api/line/webhook', async (req: any, res) => {
    const signature = req.headers['x-line-signature'] as string;
    const body = req.body;
    const rawBody = req.rawBody;

    // Verify signature if secret configured
    if (store.config.channelSecret && signature && rawBody) {
      const hash = crypto
        .createHmac('sha256', store.config.channelSecret)
        .update(rawBody)
        .digest('base64');
      if (hash !== signature) {
        console.warn('LINE signature verification mismatch');
        // If it's a test ping or verify, log warning
      }
    }

    // LINE Console "Verify" Ping (returns 200 OK)
    if (!body || !body.events || !Array.isArray(body.events)) {
      return res.status(200).send('OK');
    }

    for (const event of body.events) {
      let commandText = '';
      const replyToken = event.replyToken;
      const senderId = event.source?.userId || 'unknown-user';
      const senderName = `LINE พนักงาน (${senderId.slice(-4)})`;

      // Case A: Text Message event
      if (event.type === 'message' && event.message?.type === 'text') {
        commandText = event.message.text;
      }
      // Case B: Postback event from Flex Buttons or Quick Replies
      else if (event.type === 'postback' && event.postback?.data) {
        commandText = event.postback.data;
      }

      if (commandText) {
        const result = executeLineCommand(commandText, senderName);

        const logEntry: LineWebhookLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          sender: senderId,
          senderName,
          rawMessage: commandText,
          actionTaken: result.actionTaken || 'ประมวลผลคำสั่ง LINE',
          replyText: result.replyText,
          status: result.triggeredAlert ? 'warning' : 'success',
        };

        store.logs.unshift(logEntry);
        if (store.logs.length > 100) store.logs.pop();
        saveData();
        broadcast('line_log', logEntry);

        // Send reply to LINE user
        if (replyToken && store.config.channelAccessToken) {
          let messagesPayload: any[] = [];

          if (result.flexData) {
            messagesPayload = [result.flexData];
          } else {
            messagesPayload = [
              {
                type: 'text',
                text: result.replyText,
                quickReply: getStandardQuickReplies(),
              },
            ];
          }

          await sendLineReply(replyToken, messagesPayload, store.config.channelAccessToken);
        }
      }
    }

    res.status(200).json({ status: 'success' });
  });

  // GET ping for webhook checking
  app.get('/api/line/webhook', (_req, res) => {
    res.status(200).json({
      status: 'LINE Webhook endpoint is active and ready to receive events',
      timestamp: new Date().toISOString(),
      webhookUrl: process.env.APP_URL ? `${process.env.APP_URL}/api/line/webhook` : undefined,
    });
  });

  // 15. Server-Sent Events (SSE) for Real-time Dashboard Sync
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);
    res.write(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Vite Dev or Prod static serving
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LINE Stock Management Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
