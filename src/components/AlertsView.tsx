import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  BellRing, 
  Volume2, 
  Clock, 
  Package, 
  Plus, 
  Send,
  Check,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import type { LowStockAlert, InventoryItem } from '../types';

interface AlertsViewProps {
  alerts: LowStockAlert[];
  items: InventoryItem[];
  onAcknowledgeAlert: (id: string) => Promise<void>;
  onAdjustStock: (id: string, delta: number, reason?: string) => Promise<void>;
  onPlayChime: () => void;
  onSwitchToLineSim: (cmd?: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  items,
  onAcknowledgeAlert,
  onAdjustStock,
  onPlayChime,
  onSwitchToLineSim,
}) => {
  const [filter, setFilter] = useState<'UNACK' | 'ALL'>('UNACK');
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);
  const [broadcastSent, setBroadcastSent] = useState<string | null>(null);

  const displayedAlerts = alerts.filter(a => {
    if (filter === 'UNACK') return !a.acknowledged;
    return true;
  });

  const unackedCount = alerts.filter(a => !a.acknowledged).length;

  const handleSimulateBroadcast = async (alert: LowStockAlert) => {
    setBroadcastingId(alert.id);
    // Simulate push alert via LINE Broadcast API
    await new Promise(r => setTimeout(r, 600));
    setBroadcastingId(null);
    setBroadcastSent(alert.id);
    setTimeout(() => setBroadcastSent(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center space-x-2">
                <span>ศูนย์แจ้งเตือนสินค้าใกล้หมดสต็อก</span>
                {unackedCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                    {unackedCount} รายการใหม่
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                ระบบจะตรวจสอบระดับสต๊อกอัตโนมัติทุกครั้งที่มีการเบิกหรือขายสินค้าผ่าน LINE OA
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onPlayChime}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>ทดสอบเสียงแจ้งเตือน</span>
            </button>
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('UNACK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === 'UNACK'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              รอจัดการ ({unackedCount})
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filter === 'ALL'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ประวัติทั้งหมด ({alerts.length})
            </button>
          </div>

          <span className="text-xs text-slate-400">
            เกณฑ์เตือน: เมื่อจำนวน $\le$ จุดเตือนขั้นต่ำ
          </span>
        </div>
      </div>

      {/* Alert Cards */}
      {displayedAlerts.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">ไม่มีรายการแจ้งเตือนค้าง</h3>
          <p className="text-sm text-slate-400 mt-1">
            สินค้าทุกรายการมียอดคงเหลือเกินจุดเตือนความปลอดภัย หรือได้รับการรับทราบแล้วทั้งหมด
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedAlerts.map(alert => {
            const relatedItem = items.find(i => i.id === alert.itemId);
            const isCritical = alert.currentQuantity === 0;

            return (
              <div
                key={alert.id}
                className={`border rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  alert.acknowledged
                    ? 'bg-slate-800/40 border-slate-700/60 opacity-70'
                    : isCritical
                    ? 'bg-gradient-to-r from-rose-950/30 to-slate-900 border-rose-500/60 ring-1 ring-rose-500/30'
                    : 'bg-gradient-to-r from-amber-950/30 to-slate-900 border-amber-500/60 ring-1 ring-amber-500/30'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {alert.itemSku}
                      </span>
                      <h4 className="text-base font-bold text-white">
                        {alert.itemName}
                      </h4>
                      {isCritical && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-500 text-white animate-pulse">
                          ขาดสต๊อก (0)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                      <span className="text-slate-200">
                        ยอดคงเหลือ:{' '}
                        <b
                          className={
                            isCritical ? 'text-rose-400 text-sm' : 'text-amber-400 text-sm'
                          }
                        >
                          {alert.currentQuantity} {alert.unit}
                        </b>
                      </span>
                      <span>
                        จุดเตือนขั้นต่ำ: <b className="text-slate-300">{alert.minThreshold} {alert.unit}</b>
                      </span>
                      {relatedItem?.location && (
                        <span>ที่เก็บ: <b className="text-slate-300">{relatedItem.location}</b></span>
                      )}
                      <span className="flex items-center text-slate-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(alert.timestamp).toLocaleString('th-TH')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 self-end sm:self-center w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  {/* Restock shortcut */}
                  <button
                    onClick={() => onAdjustStock(alert.itemId, 20, 'สั่งซื้อเติมสต๊อกจากหน้าแจ้งเตือน')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center transition"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    เติม +20
                  </button>

                  {/* Send LINE push test */}
                  <button
                    onClick={() => handleSimulateBroadcast(alert)}
                    disabled={broadcastingId === alert.id}
                    title="ทดสอบส่งการแจ้งเตือนนี้เข้า LINE OA พนักงาน"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center transition"
                  >
                    {broadcastSent === alert.id ? (
                      <span className="text-emerald-400 flex items-center">
                        <Check className="w-3.5 h-3.5 mr-1" /> ส่ง LINE แล้ว
                      </span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        บรอดแคสต์ LINE
                      </>
                    )}
                  </button>

                  {/* Acknowledge */}
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
                    >
                      รับทราบแล้ว
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center px-2 py-1 bg-slate-800 rounded-lg">
                      <Check className="w-3 h-3 mr-1 text-emerald-400" /> รับทราบแล้ว
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
