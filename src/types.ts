export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  price: number;
  cost: number;
  location: string;
  updatedAt: string;
  updatedBy: string;
}

export type TransactionType = 'IN' | 'OUT' | 'ADJUST' | 'INITIAL';

export interface StockTransaction {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  type: TransactionType;
  delta: number;
  prevQuantity: number;
  newQuantity: number;
  operator: string;
  reason: string;
  timestamp: string;
  triggeredAlert: boolean;
}

export interface LowStockAlert {
  id: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  currentQuantity: number;
  minThreshold: number;
  unit: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  adminLineUserId: string;
  autoNotifyLowStock: boolean;
  webhookUrl: string;
  botName: string;
  liffId?: string;
  botInfo?: {
    displayName: string;
    userId: string;
    pictureUrl?: string;
  };
}

export interface LineWebhookLog {
  id: string;
  timestamp: string;
  sender: string;
  senderName: string;
  rawMessage: string;
  actionTaken: string;
  replyText: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface LineSimulateResponse {
  replyText: string;
  replyType: 'text' | 'flex' | 'alert';
  flexData?: any;
  actionTaken?: string;
  item?: InventoryItem;
  triggeredAlert?: boolean;
}
