import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { InventoryView } from './components/InventoryView';
import { LineSimulator } from './components/LineSimulator';
import { AlertsView } from './components/AlertsView';
import { TransactionsView } from './components/TransactionsView';
import { SettingsView } from './components/SettingsView';
import { ItemModal } from './components/ItemModal';
import { playAlertChime, playSuccessBeep } from './utils/audio';
import type { InventoryItem, StockTransaction, LowStockAlert, LineConfig, LineWebhookLog } from './types';
import { AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'inventory' | 'simulator' | 'alerts' | 'history' | 'settings'>('inventory');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [config, setConfig] = useState<LineConfig>({
    channelAccessToken: '',
    channelSecret: '',
    adminLineUserId: '',
    autoNotifyLowStock: true,
    webhookUrl: '',
    botName: 'LINE Stock Bot',
  });
  const [logs, setLogs] = useState<LineWebhookLog[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [simSuggestedCommand, setSimSuggestedCommand] = useState<string | undefined>();
  const [bannerAlert, setBannerAlert] = useState<LowStockAlert | null>(null);

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Fetch all initial data
  const loadData = useCallback(async () => {
    try {
      const [itemsRes, txRes, alertsRes, configRes, logsRes] = await Promise.all([
        fetch('/api/items'),
        fetch('/api/transactions'),
        fetch('/api/alerts'),
        fetch('/api/config'),
        fetch('/api/line/logs'),
      ]);

      if (itemsRes.ok) setItems(await itemsRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (configRes.ok) setConfig(await configRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (e) {
      console.error('Error fetching inventory data:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Connect to SSE for real-time live events
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.addEventListener('ping', () => {
        setIsConnected(true);
      });

      eventSource.addEventListener('stock_updated', (event: any) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.item) {
            setItems(prev => prev.map(i => i.id === payload.item.id ? payload.item : i));
          }
          if (payload.transaction) {
            setTransactions(prev => [payload.transaction, ...prev]);
          }
        } catch (err) {
          console.error('Failed to parse stock_updated:', err);
        }
      });

      eventSource.addEventListener('item_added', (event: any) => {
        try {
          const newItem = JSON.parse(event.data);
          setItems(prev => [...prev, newItem]);
          if (soundEnabledRef.current) playSuccessBeep();
        } catch (err) {
          console.error('Failed to parse item_added:', err);
        }
      });

      eventSource.addEventListener('item_deleted', (event: any) => {
        try {
          const { id } = JSON.parse(event.data);
          setItems(prev => prev.filter(i => i.id !== id));
        } catch (err) {
          console.error('Failed to parse item_deleted:', err);
        }
      });

      eventSource.addEventListener('alert', (event: any) => {
        try {
          const newAlert: LowStockAlert = JSON.parse(event.data);
          setAlerts(prev => [newAlert, ...prev]);
          setBannerAlert(newAlert);
          if (soundEnabledRef.current) {
            playAlertChime();
          }
        } catch (err) {
          console.error('Failed to parse alert:', err);
        }
      });

      eventSource.addEventListener('alert_acknowledged', (event: any) => {
        try {
          const acked: LowStockAlert = JSON.parse(event.data);
          setAlerts(prev => prev.map(a => a.id === acked.id ? { ...a, acknowledged: true } : a));
        } catch (err) {
          console.error('Failed to parse alert_acknowledged:', err);
        }
      });

      eventSource.addEventListener('line_log', (event: any) => {
        try {
          const newLog: LineWebhookLog = JSON.parse(event.data);
          setLogs(prev => [newLog, ...prev]);
        } catch (err) {
          console.error('Failed to parse line_log:', err);
        }
      });

      eventSource.addEventListener('full_reload', () => {
        loadData();
      });

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        setTimeout(connectSSE, 4000);
      };
    };

    connectSSE();

    return () => {
      eventSource?.close();
    };
  }, [loadData]);

  // Adjust stock via quick actions
  const handleAdjustStock = async (id: string, delta: number, reason = 'ปรับสต๊อกจากหน้าเว็บ') => {
    try {
      const res = await fetch(`/api/items/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delta,
          operator: 'ผู้ดูแลระบบ (เว็บ)',
          reason,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการปรับสต๊อก');
        return;
      }

      const data = await res.json();
      if (data.item) {
        setItems(prev => prev.map(i => i.id === data.item.id ? data.item : i));
      }
      if (data.transaction) {
        setTransactions(prev => [data.transaction, ...prev]);
      }
      if (data.triggeredAlert) {
        if (soundEnabled) playAlertChime();
      } else {
        if (soundEnabled) playSuccessBeep();
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  // Save new / edited item
  const handleSaveItem = async (itemData: Partial<InventoryItem>) => {
    if (editingItem) {
      // Edit
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'ไม่สามารถแก้ไขสินค้าได้');
      }
      const updated = await res.json();
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    } else {
      // Add
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'ไม่สามารถเพิ่มสินค้าได้');
      }
      const created = await res.json();
      setItems(prev => [...prev, created]);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (!confirm(`คุณต้องการลบสินค้า [${item.sku}] "${item.name}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  };

  // Acknowledge low stock alert
  const handleAcknowledgeAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/ack`, { method: 'POST' });
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save LINE config
  const handleSaveConfig = async (newConfig: Partial<LineConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(prev => ({ ...prev, ...updated }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset sample data
  const handleResetData = async () => {
    if (!confirm('ต้องการรีเซ็ตข้อมูลสินค้าและประวัติกลับเป็นค่าเริ่มต้นหรือไม่?')) return;
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchToSimulator = (cmd?: string) => {
    if (cmd) setSimSuggestedCommand(cmd);
    setCurrentTab('simulator');
  };

  const lowStockCount = items.filter(i => i.quantity <= i.minThreshold).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Prompt',sans-serif]">
      {/* Top Banner Alert (when a low stock alert fires in background) */}
      {bannerAlert && (
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 text-white px-4 py-2.5 shadow-lg flex items-center justify-between z-40 animate-slide-down">
          <div className="flex items-center space-x-2 text-xs sm:text-sm font-semibold max-w-4xl mx-auto flex-1">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
            <span>
              🚨 <b>แจ้งเตือนสต๊อกวิกฤต!</b> สินค้า [{bannerAlert.itemSku}] {bannerAlert.itemName} เหลือเพียง {bannerAlert.currentQuantity} {bannerAlert.unit} (ต่ำกว่าเกณฑ์ {bannerAlert.minThreshold} {bannerAlert.unit})
            </span>
            <button
              onClick={() => {
                setCurrentTab('alerts');
                setBannerAlert(null);
              }}
              className="ml-3 underline font-bold hover:text-slate-100"
            >
              ดูรายละเอียด ➔
            </button>
          </div>
          <button
            onClick={() => setBannerAlert(null)}
            className="p-1 hover:bg-black/20 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lowStockCount={lowStockCount}
        unreadLogsCount={logs.length}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenAddItem={() => {
          setEditingItem(null);
          setIsItemModalOpen(true);
        }}
        isConnected={isConnected}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'inventory' && (
          <InventoryView
            items={items}
            onAdjustStock={handleAdjustStock}
            onEditItem={item => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
            onOpenAddItem={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            onSwitchToLineSim={handleSwitchToSimulator}
          />
        )}

        {currentTab === 'simulator' && (
          <LineSimulator
            items={items}
            initialCommand={simSuggestedCommand}
            onClearInitialCommand={() => setSimSuggestedCommand(undefined)}
            onStockUpdated={loadData}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            items={items}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onAdjustStock={handleAdjustStock}
            onPlayChime={playAlertChime}
            onSwitchToLineSim={handleSwitchToSimulator}
          />
        )}

        {currentTab === 'history' && (
          <TransactionsView transactions={transactions} />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            config={config}
            onSaveConfig={handleSaveConfig}
            logs={logs}
            onRefreshLogs={loadData}
          />
        )}
      </main>

      {/* Modal Dialog for Add / Edit Item */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        editItem={editingItem}
      />
    </div>
  );
}
